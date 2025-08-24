/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import Timetable from "@/models/Timetable";
import Course, { ICourse } from "@/models/Course";
import Faculty, { IFaculty } from "@/models/Faculty";
import Timeslot, { ITimeslot } from "@/models/Timeslot";
import Classroom, { IClassroom } from "@/models/Classroom";
import { connectDB } from "@/lib/mongoose";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Faculty designation priority (higher number = higher priority)
const DESIGNATION_PRIORITY = {
  Professor: 4,
  AssociateProfessor: 3,
  AssistantProfessor: 2,
  Lecturer: 1,
};

export async function POST(req: Request) {
  await connectDB();

  try {
    // Clear previous timetable
    await Timetable.deleteMany({});

    // Fetch all data
    const courses = await Course.find({}).lean<ICourse>();
    const facultyList = await Faculty.find({}).lean<IFaculty>();
    const timeslots = await Timeslot.find({}).lean<ITimeslot>();
    const classrooms = await Classroom.find({}).lean<IClassroom>();

    const timetableEntries: any[] = [];
    const facultyCourseCount: { [key: string]: number } = {};
    const courseLectureCount: { [key: string]: number } = {};

    // Initialize faculty course counts
    facultyList.forEach((faculty) => {
      facultyCourseCount[faculty._id.toString()] = 0;
    });

    // Initialize course lecture counts
    courses.forEach((course) => {
      courseLectureCount[course._id.toString()] = 0;
    });

    // Sort faculty by designation priority and submission time
    const sortedFaculty = facultyList.sort((a, b) => {
      const priorityDiff =
        DESIGNATION_PRIORITY[b.designation] -
        DESIGNATION_PRIORITY[a.designation];
      if (priorityDiff !== 0) return priorityDiff;

      // If same designation, sort by submission time (earlier = higher priority)
      const aTime = a.preferenceSubmittedAt
        ? new Date(a.preferenceSubmittedAt).getTime()
        : 0;
      const bTime = b.preferenceSubmittedAt
        ? new Date(b.preferenceSubmittedAt).getTime()
        : 0;
      return aTime - bTime;
    });

    // Process each course
    for (const course of courses) {
      const courseId = course._id.toString();
      const lecturesNeeded = course.creditHours === 3 ? 2 : 1;
      const assignedDays = new Set<string>();

      // Try to assign lectures for this course
      for (let lecture = 0; lecture < lecturesNeeded; lecture++) {
        let assigned = false;

        // Get preferred faculties for this course
        const preferredFaculties =
          course.preferredFacultyIds && course.preferredFacultyIds.length > 0
            ? sortedFaculty.filter((f) =>
                course.preferredFacultyIds!.includes(f._id.toString())
              )
            : sortedFaculty;

        // Try each faculty (in priority order)
        for (const faculty of preferredFaculties) {
          const facultyId = faculty._id.toString();

          // Check faculty course load limit (max 3 courses)
          if (facultyCourseCount[facultyId] >= 3) continue;

          // Try each timeslot
          for (const timeslot of timeslots) {
            // Try each classroom
            for (const classroom of classrooms) {
              // Check if classroom capacity is sufficient
              if (classroom.capacity < course.enrollment) continue;

              // Check if course needs multimedia and classroom has it
              if (course.multimediaRequired && !classroom.multimedia) continue;

              // Check for conflicts
              const conflict = await Timetable.findOne({
                $or: [
                  {
                    faculty: faculty._id,
                    timeSlot: timeslot._id,
                    day: timeslot.day,
                  },
                  {
                    classroom: classroom._id,
                    timeSlot: timeslot._id,
                    day: timeslot.day,
                  },
                ],
              });

              if (!conflict) {
                // Check same-day constraint for 3-credit courses
                if (lecturesNeeded === 2 && assignedDays.has(timeslot.day))
                  continue;

                // Create timetable entry
                const entry = await Timetable.create({
                  course: course._id,
                  faculty: faculty._id,
                  classroom: classroom._id,
                  timeSlot: timeslot._id,
                  day: timeslot.day,
                  studentBatch: course.studentBatch || "Batch A",
                  semester: "Fall 2025",
                });

                timetableEntries.push(entry);
                facultyCourseCount[facultyId]++;
                courseLectureCount[courseId]++;
                assignedDays.add(timeslot.day);
                assigned = true;
                break;
              }
            }
            if (assigned) break;
          }
          if (assigned) break;
        }

        if (!assigned) {
          console.warn(
            `Lecture ${lecture + 1} for course ${
              course.title
            } could not be scheduled`
          );
        }
      }
    }

    // Ensure minimum course load for faculty (at least 2 courses)
    for (const faculty of facultyList) {
      const facultyId = faculty._id.toString();
      if (facultyCourseCount[facultyId] < 2) {
        console.warn(
          `Faculty ${faculty.name} has only ${facultyCourseCount[facultyId]} courses assigned (minimum 2 required)`
        );
      }
    }

    return NextResponse.json({
      success: true,
      timetable: timetableEntries,
      stats: {
        totalCourses: courses.length,
        totalFaculty: facultyList.length,
        totalClassrooms: classrooms.length,
        totalTimeslots: timeslots.length,
        assignedEntries: timetableEntries.length,
        facultyCourseCounts: facultyCourseCount,
        courseLectureCounts: courseLectureCount,
      },
    });
  } catch (err: any) {
    console.error("Timetable generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
