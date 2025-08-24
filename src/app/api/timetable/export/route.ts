import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Timetable from "@/models/Timetable";

export async function GET(req: Request) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const batch = searchParams.get("batch");
    const faculty = searchParams.get("faculty");

    // Fetch timetable data
    let query = {};
    if (batch) {
      query = { studentBatch: batch };
    } else if (faculty) {
      query = { faculty: faculty };
    }

    const timetable = await Timetable.find(query)
      .populate("course", "code title")
      .populate("faculty", "name designation")
      .populate("classroom", "classroomId building")
      .populate("timeSlot", "day start end")
      .lean()
      .sort({ day: 1, "timeSlot.start": 1 });

    if (format === "csv") {
      // Generate CSV content
      const csvHeaders = [
        "Day",
        "Time",
        "Course Code",
        "Course Title",
        "Faculty Name",
        "Faculty Designation",
        "Classroom",
        "Building",
        "Student Batch",
        "Semester",
      ];

      const csvRows = timetable.map((entry) => [
        entry.day,
        `${entry.timeSlot.start} - ${entry.timeSlot.end}`,
        entry.course.code,
        entry.course.title,
        entry.faculty.name,
        entry.faculty.designation,
        entry.classroom.classroomId,
        entry.classroom.building,
        entry.studentBatch,
        entry.semester,
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
      ].join("\n");

      const filename = batch
        ? `timetable-batch-${batch}-${
            new Date().toISOString().split("T")[0]
          }.csv`
        : faculty
        ? `timetable-faculty-${new Date().toISOString().split("T")[0]}.csv`
        : `timetable-all-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else if (format === "json") {
      // Return JSON format
      return NextResponse.json({
        success: true,
        timetable: timetable,
        exportInfo: {
          format: "json",
          timestamp: new Date().toISOString(),
          totalEntries: timetable.length,
          filter: batch
            ? `batch: ${batch}`
            : faculty
            ? `faculty: ${faculty}`
            : "all",
        },
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported format. Use 'csv' or 'json'" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("Timetable export error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
