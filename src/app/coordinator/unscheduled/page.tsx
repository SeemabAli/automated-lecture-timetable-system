/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import ManualScheduleModal from "./ManualScheduleModal";
import toast from "react-hot-toast";

interface UnscheduledData {
  courses: any[];
  faculty: any[];
  slots: any[];
}

interface Stats {
  totalCourses: number;
  scheduledCourses: number;
  unscheduledCourses: number;
  totalFaculty: number;
  unscheduledFaculty: number;
  totalSlots: number;
  unscheduledSlots: number;
}

export default function UnscheduledPage() {
  const [unscheduledData, setUnscheduledData] =
    useState<UnscheduledData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchUnscheduledItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/timetable/unscheduled");
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Failed to fetch unscheduled items");

      setUnscheduledData(data.unscheduled);
      setStats(data.stats);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching unscheduled items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnscheduledItems();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["coordinator"]}>
        <div className="min-h-screen p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              Coordinator • Unscheduled Items
            </h1>
            <LogoutButton />
          </div>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading unscheduled items...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["coordinator"]}>
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Coordinator • Unscheduled Items
          </h1>
          <LogoutButton />
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Unscheduled Courses
              </h3>
              <p className="text-2xl font-bold text-red-600">
                {stats.unscheduledCourses}
              </p>
              <p className="text-xs text-gray-500">
                of {stats.totalCourses} total
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Faculty Needing Courses
              </h3>
              <p className="text-2xl font-bold text-orange-600">
                {stats.unscheduledFaculty}
              </p>
              <p className="text-xs text-gray-500">
                of {stats.totalFaculty} total
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Available Slots
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.unscheduledSlots}
              </p>
              <p className="text-xs text-gray-500">
                of {stats.totalSlots} total
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Scheduled Courses
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.scheduledCourses}
              </p>
              <p className="text-xs text-gray-500">Successfully assigned</p>
            </div>
          </div>
        )}

        {/* Manual Scheduling Button */}
        <div className="mb-6">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manual Schedule Course
          </button>
        </div>

        {/* Unscheduled Courses */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Unscheduled Courses</h2>
          {unscheduledData?.courses.length === 0 ? (
            <p className="text-gray-500">All courses have been scheduled!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unscheduledData?.courses.map((course) => (
                <div
                  key={course._id}
                  className="border rounded-lg p-4 bg-red-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-red-600">
                      {course.code}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                      Unscheduled
                    </span>
                  </div>
                  <h3 className="font-medium mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {course.department}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{course.creditHours} credit hours</span>
                    <span>{course.enrollment} students</span>
                  </div>
                  {course.multimediaRequired && (
                    <span className="inline-block mt-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                      Multimedia Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Needing Courses */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Faculty Needing More Courses
          </h2>
          {unscheduledData?.faculty.length === 0 ? (
            <p className="text-gray-500">
              All faculty have sufficient course assignments!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unscheduledData?.faculty.map((faculty) => (
                <div
                  key={faculty._id}
                  className="border rounded-lg p-4 bg-orange-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-orange-600">
                      {faculty.name}
                    </span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                      Needs Courses
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {faculty.department}
                  </p>
                  <p className="text-sm text-gray-500">{faculty.designation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Slots */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Available Classroom Slots
          </h2>
          {unscheduledData?.slots.length === 0 ? (
            <p className="text-gray-500">All classroom slots are occupied!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unscheduledData?.slots.slice(0, 12).map((slot, index) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-green-600">
                      {slot.classroom.classroomId}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      Available
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {slot.classroom.building}
                  </p>
                  <p className="text-sm text-gray-500">
                    {slot.day} • {slot.timeslot.start} - {slot.timeslot.end}
                  </p>
                  <p className="text-xs text-gray-500">
                    Capacity: {slot.classroom.capacity}
                  </p>
                </div>
              ))}
              {unscheduledData?.slots.length > 12 && (
                <div className="col-span-full text-center py-4">
                  <p className="text-gray-500">
                    Showing 12 of {unscheduledData.slots.length} available slots
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Schedule Modal */}
        <ManualScheduleModal
          open={modalOpen}
          setOpen={setModalOpen}
          onComplete={fetchUnscheduledItems}
        />
      </div>
    </ProtectedRoute>
  );
}
