import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Timetable from "@/models/Timetable";
import Course from "@/models/Course";
import Faculty from "@/models/Faculty";
import Classroom from "@/models/Classroom";
import Timeslot from "@/models/Timeslot";

export async function POST(req: Request) {
  await connectDB();

  try {
    const { courseId, facultyId, classroomId, timeslotId, day } =
      await req.json();

    // Validate required fields
    if (!courseId || !facultyId || !classroomId || !timeslotId || !day) {
      return NextResponse.json(
        {
          error:
            "All fields are required: courseId, facultyId, classroomId, timeslotId, day",
        },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    // Check if timeslot exists
    const timeslot = await Timeslot.findById(timeslotId);
    if (!timeslot) {
      return NextResponse.json(
        { error: "Timeslot not found" },
        { status: 404 }
      );
    }

    // Check classroom capacity
    if (classroom.capacity < course.enrollment) {
      return NextResponse.json(
        {
          error: `Classroom capacity (${classroom.capacity}) is insufficient for course enrollment (${course.enrollment})`,
        },
        { status: 400 }
      );
    }

    // Check multimedia requirement
    if (course.multimediaRequired && !classroom.multimedia) {
      return NextResponse.json(
        {
          error:
            "Course requires multimedia but classroom doesn't have multimedia facilities",
        },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflict = await Timetable.findOne({
      $or: [
        { faculty: facultyId, timeSlot: timeslotId, day: day },
        { classroom: classroomId, timeSlot: timeslotId, day: day },
      ],
    });

    if (conflict) {
      return NextResponse.json(
        {
          error:
            "Conflict detected: Faculty or classroom is already scheduled for this time slot",
        },
        { status: 409 }
      );
    }

    // Check faculty course load limit
    const facultyCourseCount = await Timetable.countDocuments({
      faculty: facultyId,
    });
    if (facultyCourseCount >= 3) {
      return NextResponse.json(
        {
          error: "Faculty already has maximum 3 courses assigned",
        },
        { status: 400 }
      );
    }

    // Check if course already has enough lectures (for 3-credit courses)
    const courseLectureCount = await Timetable.countDocuments({
      course: courseId,
    });
    const maxLectures = course.creditHours === 3 ? 2 : 1;

    if (courseLectureCount >= maxLectures) {
      return NextResponse.json(
        {
          error: `Course already has ${courseLectureCount} lectures assigned (maximum: ${maxLectures})`,
        },
        { status: 400 }
      );
    }

    // Check same-day constraint for 3-credit courses
    if (course.creditHours === 3) {
      const existingDay = await Timetable.findOne({
        course: courseId,
        day: day,
      });
      if (existingDay) {
        return NextResponse.json(
          {
            error: "3-credit courses cannot have both lectures on the same day",
          },
          { status: 400 }
        );
      }
    }

    // Create the timetable entry
    const entry = await Timetable.create({
      course: courseId,
      faculty: facultyId,
      classroom: classroomId,
      timeSlot: timeslotId,
      day: day,
      studentBatch: course.studentBatch || "Batch A",
      semester: "Fall 2025",
    });

    // Populate the entry for response
    const populatedEntry = await Timetable.findById(entry._id)
      .populate("course", "code title")
      .populate("faculty", "name designation")
      .populate("classroom", "classroomId building")
      .populate("timeSlot", "day start end");

    return NextResponse.json(
      {
        success: true,
        message: "Course scheduled successfully",
        entry: populatedEntry,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Manual scheduling error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
