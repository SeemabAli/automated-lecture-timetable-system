// src/app/api/courses/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Course from "@/models/Course";
import { courseSchema } from "@/lib/zodSchemas";

// ======================= GET =======================
export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find({}).lean();
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// ======================= POST =======================
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const result = courseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map((err) => err.message).join(", ") },
        { status: 400 }
      );
    }

    const {
      code,
      title,
      enrollment,
      multimediaRequired,
      creditHours,
      department,
    } = result.data;

    const newCourse = new Course({
      code,
      title,
      enrollment,
      multimediaRequired,
      creditHours,
      department,
    });

    await newCourse.save();

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}

// ======================= PUT =======================
export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const result = courseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map((err) => err.message).join(", ") },
        { status: 400 }
      );
    }

    const {
      _id,
      code,
      title,
      enrollment,
      multimediaRequired,
      creditHours,
      department,
    } = body;

    const updatedCourse = await Course.findByIdAndUpdate(
      _id,
      { code, title, enrollment, multimediaRequired, creditHours, department },
      { new: true }
    );

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// ======================= DELETE =======================
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
