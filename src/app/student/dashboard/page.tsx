/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import toast from "react-hot-toast";

// Custom type matching what we added in auth.ts
interface CustomSessionUser {
  id: string;
  email: string;
  role: "admin" | "coordinator" | "faculty" | "student";
  batch?: string;
  name?: string | null;
  image?: string | null;
}

interface TimetableEntry {
  _id: string;
  day: string;
  studentBatch: string;
  timeSlot: { start: string; end: string };
  course: {
    title: string;
    code: string;
    creditHours: number;
    enrollment: number;
    department: string;
  };
  faculty: { name: string; designation: string; department: string };
  classroom: {
    classroomId: string;
    building: string;
    capacity: number;
    multimedia: boolean;
  };
}

export default function StudentDashboardPage() {
  const { data: sessionData } = useSession();
  const session = sessionData?.user as CustomSessionUser | undefined;

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [filteredTimetable, setFilteredTimetable] = useState<TimetableEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"timetable" | "courses" | "faculty">(
    "timetable"
  );

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await fetch("/api/timetable/fetch");
        const data = await res.json();

        if (!session?.batch) return;

        const filtered: TimetableEntry[] = (data.timetable || []).filter(
          (t: any) => t.studentBatch === session.batch
        );

        setTimetable(filtered);
        setFilteredTimetable(filtered);
      } catch (err) {
        console.error("Error fetching timetable:", err);
        toast.error("Failed to fetch timetable");
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [session]);

  useEffect(() => {
    if (selectedDay === "all") {
      setFilteredTimetable(timetable);
    } else {
      setFilteredTimetable(
        timetable.filter((entry) => entry.day === selectedDay)
      );
    }
  }, [selectedDay, timetable]);

  const handleExport = async (format: "csv" | "json") => {
    if (!session?.batch) {
      toast.error("Batch information not available");
      return;
    }

    setExportLoading(true);
    try {
      const res = await fetch(
        `/api/timetable/export?format=${format}&batch=${session.batch}`
      );

      if (format === "csv") {
        // Download CSV file
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `my-timetable-${session.batch}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
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
        a.download = `my-timetable-${session.batch}-${
          new Date().toISOString().split("T")[0]
        }.json`;
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

  const getDayStats = (day: string) => {
    const dayEntries = timetable.filter((entry) => entry.day === day);
    return dayEntries.length;
  };

  const getUniqueCourses = () => {
    return Array.from(new Set(timetable.map((t) => t.course.code)))
      .map((code) => {
        const course = timetable.find((t) => t.course.code === code);
        return course?.course;
      })
      .filter(Boolean);
  };

  const getUniqueFaculty = () => {
    return Array.from(new Set(timetable.map((t) => t.faculty.name)))
      .map((name) => {
        const faculty = timetable.find((t) => t.faculty.name === name);
        return faculty?.faculty;
      })
      .filter(Boolean);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="min-h-screen p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <LogoutButton />
          </div>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading your timetable...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  My Timetable
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome, {session?.name || session?.email} • Batch:{" "}
                  {session?.batch}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Classes
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {timetable.length}
                </p>
              </div>
              {days.map((day) => (
                <div
                  key={day}
                  className="bg-white rounded-lg shadow p-4 text-center"
                >
                  <h3 className="text-sm font-medium text-gray-500">{day}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {getDayStats(day)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* View Mode Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  View Options
                </h2>
                <p className="text-sm text-gray-600">
                  Choose how to view your information
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setViewMode("timetable")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === "timetable"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Timetable
                </button>
                <button
                  onClick={() => setViewMode("courses")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === "courses"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  My Courses
                </button>
                <button
                  onClick={() => setViewMode("faculty")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === "faculty"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  My Faculty
                </button>
              </div>
            </div>
          </div>

          {/* Content based on view mode */}
          {viewMode === "timetable" && (
            <>
              {/* Filter Controls */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Filter by Day
                    </h2>
                    <p className="text-sm text-gray-600">
                      View classes for specific days
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDay("all")}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedDay === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      All Days
                    </button>
                    {days.map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedDay === day
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timetable */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {timetable.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-lg">
                      No timetable assigned yet
                    </p>
                    <p className="text-gray-400 mt-1">
                      Please contact your coordinator
                    </p>
                  </div>
                ) : filteredTimetable.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-lg">
                      No classes on {selectedDay}
                    </p>
                    <p className="text-gray-400 mt-1">
                      Try selecting a different day
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Faculty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Classroom
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTimetable.map((entry) => (
                          <tr key={entry._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-gray-900">
                                {entry.day}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-gray-900">
                                {entry.timeSlot.start} - {entry.timeSlot.end}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-blue-600">
                                  {entry.course.code}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {entry.course.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {entry.course.creditHours} credits •{" "}
                                  {entry.course.department}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {entry.faculty.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {entry.faculty.designation}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {entry.faculty.department}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {entry.classroom.classroomId}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {entry.classroom.building}
                                </div>
                                {entry.classroom.multimedia && (
                                  <div className="text-xs text-orange-600">
                                    Multimedia Available
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === "courses" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">My Courses</h2>
              {getUniqueCourses().length === 0 ? (
                <p className="text-gray-500">No courses assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getUniqueCourses().map((course, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-blue-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-blue-600">
                          {course?.code}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {course?.creditHours} credits
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{course?.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {course?.department}
                      </p>
                      <div className="text-xs text-gray-500">
                        Enrollment: {course?.enrollment} students
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === "faculty" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">My Faculty</h2>
              {getUniqueFaculty().length === 0 ? (
                <p className="text-gray-500">No faculty assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getUniqueFaculty().map((faculty, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-green-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-green-600">
                          {faculty?.name}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {faculty?.designation}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {faculty?.department}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {timetable.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Weekly Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">
                    {timetable.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Classes</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(timetable.map((t) => t.course.code)).size}
                  </div>
                  <div className="text-sm text-gray-600">Unique Courses</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(timetable.map((t) => t.faculty.name)).size}
                  </div>
                  <div className="text-sm text-gray-600">Faculty Members</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50">
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      new Set(timetable.map((t) => t.classroom.classroomId))
                        .size
                    }
                  </div>
                  <div className="text-sm text-gray-600">Classrooms Used</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
