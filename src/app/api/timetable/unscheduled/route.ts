import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Timetable from "@/models/Timetable";
import Course from "@/models/Course";
import Faculty from "@/models/Faculty";
import Classroom from "@/models/Classroom";
import Timeslot from "@/models/Timeslot";

export async function GET() {
  await connectDB();

  try {
    // Get all scheduled entries
    const scheduledEntries = await Timetable.find({})
      .populate("course", "code title")
      .populate("faculty", "name designation")
      .populate("classroom", "classroomId building")
      .populate("timeSlot", "day start end")
      .lean();

    // Get all available data
    const allCourses = await Course.find({}).lean();
    const allFaculty = await Faculty.find({}).lean();
    const allClassrooms = await Classroom.find({}).lean();
    const allTimeslots = await Timeslot.find({}).lean();

    // Find unscheduled courses
    const scheduledCourseIds = new Set(
      scheduledEntries.map((entry) => entry.course._id.toString())
    );
    const unscheduledCourses = allCourses.filter(
      (course) => !scheduledCourseIds.has(course._id.toString())
    );

    // Find faculty with insufficient course load (less than 2 courses)
    const facultyCourseCount: { [key: string]: number } = {};
    scheduledEntries.forEach((entry) => {
      const facultyId = entry.faculty._id.toString();
      facultyCourseCount[facultyId] = (facultyCourseCount[facultyId] || 0) + 1;
    });

    const unscheduledFaculty = allFaculty.filter((faculty) => {
      const courseCount = facultyCourseCount[faculty._id.toString()] || 0;
      return courseCount < 2; // Minimum 2 courses required
    });

    // Find unscheduled classroom-time slot combinations
    const scheduledSlots = new Set();
    scheduledEntries.forEach((entry) => {
      const key = `${entry.classroom._id.toString()}-${entry.timeSlot._id.toString()}-${
        entry.day
      }`;
      scheduledSlots.add(key);
    });

    const unscheduledSlots = [];
    for (const classroom of allClassrooms) {
      for (const timeslot of allTimeslots) {
        const key = `${classroom._id.toString()}-${timeslot._id.toString()}-${
          timeslot.day
        }`;
        if (!scheduledSlots.has(key)) {
          unscheduledSlots.push({
            classroom: classroom,
            timeslot: timeslot,
            day: timeslot.day,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      unscheduled: {
        courses: unscheduledCourses,
        faculty: unscheduledFaculty,
        slots: unscheduledSlots,
      },
      stats: {
        totalCourses: allCourses.length,
        scheduledCourses: scheduledEntries.length,
        unscheduledCourses: unscheduledCourses.length,
        totalFaculty: allFaculty.length,
        unscheduledFaculty: unscheduledFaculty.length,
        totalSlots: allClassrooms.length * allTimeslots.length,
        unscheduledSlots: unscheduledSlots.length,
      },
    });
  } catch (err: any) {
    console.error("Error fetching unscheduled items:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
