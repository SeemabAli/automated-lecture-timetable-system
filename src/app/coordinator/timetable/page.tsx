/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GenerateModal from "./GenerateModal";
import toast from "react-hot-toast";

interface TimetableEntry {
  _id: string;
  course: { title: string; code: string };
  faculty: { name: string };
  classroom: { classroomId: string; building: string };
  day: string;
  timeSlot: { start: string; end: string };
  studentBatch: string;
}

export default function AutoTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/timetable/fetch");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch timetable");
      setTimetable(data.timetable);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    setExportLoading(true);
    try {
      const res = await fetch(`/api/timetable/export?format=${format}`);

      if (format === "csv") {
        // Download CSV file
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `timetable-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Timetable exported successfully!");
      } else {
        // Handle JSON export
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to export timetable");

        // Download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `timetable-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Timetable exported successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error exporting timetable");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Timetable Management
              </h1>
              <p className="text-gray-600 mt-1">
                Generate and manage lecture schedules
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Timetable
              </button>
              <button
                onClick={() => handleExport("csv")}
                disabled={exportLoading || timetable.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {exportLoading ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={() => handleExport("json")}
                disabled={exportLoading || timetable.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {exportLoading ? "Exporting..." : "Export JSON"}
              </button>
              <button
                onClick={handlePrint}
                disabled={timetable.length === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {timetable.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Total Entries
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {timetable.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Unique Courses
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {new Set(timetable.map((t) => t.course.code)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Unique Faculty
              </h3>
              <p className="text-2xl font-bold text-orange-600">
                {new Set(timetable.map((t) => t.faculty.name)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Unique Classrooms
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(timetable.map((t) => t.classroom.classroomId)).size}
              </p>
            </div>
          </div>
        )}

        {/* Timetable Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading timetable...</p>
            </div>
          ) : timetable.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                No timetable generated yet
              </p>
              <p className="text-gray-400 mt-1">
                Click "Generate Timetable" to create a schedule
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Day</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Course</TableHead>
                    <TableHead className="font-semibold">Faculty</TableHead>
                    <TableHead className="font-semibold">Classroom</TableHead>
                    <TableHead className="font-semibold">Batch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetable.map((entry) => (
                    <TableRow key={entry._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{entry.day}</TableCell>
                      <TableCell>
                        {entry.timeSlot.start} - {entry.timeSlot.end}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.course.code}</div>
                          <div className="text-sm text-gray-600">
                            {entry.course.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.faculty.name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {entry.classroom.classroomId}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.classroom.building}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.studentBatch}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Generate Modal */}
        <GenerateModal
          open={modalOpen}
          setOpen={setModalOpen}
          onComplete={fetchTimetable}
        />
      </div>
    </div>
  );
}
