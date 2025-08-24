/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Timetable from "@/models/Timetable";
import { connectDB } from "@/lib/mongoose";

export async function GET() {
  await connectDB();

  try {
    const timetable = await Timetable.find({})
      .populate(
        "course",
        "code title creditHours enrollment department multimediaRequired"
      )
      .populate("faculty", "name designation department")
      .populate("classroom", "classroomId building capacity multimedia")
      .populate("timeSlot", "day start end")
      .lean();

    return NextResponse.json({ success: true, timetable });
  } catch (err: any) {
    console.error("Error fetching timetable:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
