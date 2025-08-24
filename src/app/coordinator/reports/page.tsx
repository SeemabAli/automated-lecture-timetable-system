/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import toast from "react-hot-toast";

interface SystemStats {
  courses: {
    total: number;
    scheduled: number;
    unscheduled: number;
    multimediaRequired: number;
  };
  faculty: {
    total: number;
    withPreferences: number;
    withoutPreferences: number;
    withInsufficientCourses: number;
  };
  classrooms: {
    total: number;
    withMultimedia: number;
    totalCapacity: number;
  };
  timetable: {
    totalEntries: number;
    uniqueCourses: number;
    uniqueFaculty: number;
    uniqueClassrooms: number;
  };
  preferences: {
    total: number;
    averageCoursesPerFaculty: number;
  };
}

export default function ReportsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const [
        coursesRes,
        facultyRes,
        classroomsRes,
        timetableRes,
        preferencesRes,
        unscheduledRes,
      ] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/faculty"),
        fetch("/api/classrooms"),
        fetch("/api/timetable/fetch"),
        fetch("/api/preferences"),
        fetch("/api/timetable/unscheduled"),
      ]);

      const [
        courses,
        faculty,
        classrooms,
        timetable,
        preferences,
        unscheduled,
      ] = await Promise.all([
        coursesRes.json(),
        facultyRes.json(),
        classroomsRes.json(),
        timetableRes.json(),
        preferencesRes.json(),
        unscheduledRes.json(),
      ]);

      const systemStats: SystemStats = {
        courses: {
          total: courses.length,
          scheduled: timetable.timetable?.length || 0,
          unscheduled: unscheduled.unscheduled?.courses?.length || 0,
          multimediaRequired: courses.filter((c: any) => c.multimediaRequired)
            .length,
        },
        faculty: {
          total: faculty.length,
          withPreferences: preferences.length,
          withoutPreferences: faculty.length - preferences.length,
          withInsufficientCourses:
            unscheduled.unscheduled?.faculty?.length || 0,
        },
        classrooms: {
          total: classrooms.length,
          withMultimedia: classrooms.filter((c: any) => c.multimedia).length,
          totalCapacity: classrooms.reduce(
            (sum: number, c: any) => sum + (c.capacity || 0),
            0
          ),
        },
        timetable: {
          totalEntries: timetable.timetable?.length || 0,
          uniqueCourses:
            new Set(timetable.timetable?.map((t: any) => t.course?.code))
              .size || 0,
          uniqueFaculty:
            new Set(timetable.timetable?.map((t: any) => t.faculty?.name))
              .size || 0,
          uniqueClassrooms:
            new Set(
              timetable.timetable?.map((t: any) => t.classroom?.classroomId)
            ).size || 0,
        },
        preferences: {
          total: preferences.length,
          averageCoursesPerFaculty:
            preferences.length > 0
              ? Math.round(
                  preferences.reduce(
                    (sum: number, p: any) => sum + (p.courses?.length || 0),
                    0
                  ) / preferences.length
                )
              : 0,
        },
      };

      setStats(systemStats);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch system statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["coordinator"]}>
        <div className="min-h-screen p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Coordinator • Reports</h1>
            <LogoutButton />
          </div>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!stats) {
    return (
      <ProtectedRoute allowedRoles={["coordinator"]}>
        <div className="min-h-screen p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Coordinator • Reports</h1>
            <LogoutButton />
          </div>
          <p className="text-gray-500">Failed to load system statistics</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["coordinator"]}>
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Coordinator • System Reports</h1>
          <LogoutButton />
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Courses</h3>
            <p className="text-2xl font-bold text-blue-600">
              {stats.courses.total}
            </p>
            <p className="text-xs text-gray-500">
              {stats.courses.scheduled} scheduled, {stats.courses.unscheduled}{" "}
              unscheduled
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Faculty</h3>
            <p className="text-2xl font-bold text-green-600">
              {stats.faculty.total}
            </p>
            <p className="text-xs text-gray-500">
              {stats.faculty.withPreferences} with preferences
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Total Classrooms
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats.classrooms.total}
            </p>
            <p className="text-xs text-gray-500">
              {stats.classrooms.withMultimedia} with multimedia
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Timetable Entries
            </h3>
            <p className="text-2xl font-bold text-orange-600">
              {stats.timetable.totalEntries}
            </p>
            <p className="text-xs text-gray-500">
              {stats.timetable.uniqueCourses} unique courses
            </p>
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Analysis */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Course Analysis</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Scheduled Courses</span>
                <span className="font-semibold text-green-600">
                  {stats.courses.scheduled}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unscheduled Courses</span>
                <span className="font-semibold text-red-600">
                  {stats.courses.unscheduled}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Multimedia Required</span>
                <span className="font-semibold text-orange-600">
                  {stats.courses.multimediaRequired}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Scheduling Rate</span>
                <span className="font-semibold text-blue-600">
                  {stats.courses.total > 0
                    ? Math.round(
                        (stats.courses.scheduled / stats.courses.total) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Faculty Analysis */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Faculty Analysis</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">With Preferences</span>
                <span className="font-semibold text-green-600">
                  {stats.faculty.withPreferences}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Without Preferences</span>
                <span className="font-semibold text-red-600">
                  {stats.faculty.withoutPreferences}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Insufficient Courses</span>
                <span className="font-semibold text-orange-600">
                  {stats.faculty.withInsufficientCourses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Preference Rate</span>
                <span className="font-semibold text-blue-600">
                  {stats.faculty.total > 0
                    ? Math.round(
                        (stats.faculty.withPreferences / stats.faculty.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Classroom Analysis */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Classroom Analysis</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Capacity</span>
                <span className="font-semibold text-blue-600">
                  {stats.classrooms.totalCapacity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">With Multimedia</span>
                <span className="font-semibold text-green-600">
                  {stats.classrooms.withMultimedia}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Without Multimedia</span>
                <span className="font-semibold text-gray-600">
                  {stats.classrooms.total - stats.classrooms.withMultimedia}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Multimedia Rate</span>
                <span className="font-semibold text-purple-600">
                  {stats.classrooms.total > 0
                    ? Math.round(
                        (stats.classrooms.withMultimedia /
                          stats.classrooms.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Timetable Analysis */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Timetable Analysis</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Entries</span>
                <span className="font-semibold text-blue-600">
                  {stats.timetable.totalEntries}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Courses</span>
                <span className="font-semibold text-green-600">
                  {stats.timetable.uniqueCourses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Faculty</span>
                <span className="font-semibold text-purple-600">
                  {stats.timetable.uniqueFaculty}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Classrooms</span>
                <span className="font-semibold text-orange-600">
                  {stats.timetable.uniqueClassrooms}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            System Health Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  stats.courses.unscheduled === 0
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {stats.courses.unscheduled === 0 ? "✓" : "✗"}
              </div>
              <h3 className="font-medium">Course Scheduling</h3>
              <p className="text-sm text-gray-600">
                {stats.courses.unscheduled === 0
                  ? "All courses scheduled"
                  : `${stats.courses.unscheduled} unscheduled`}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  stats.faculty.withoutPreferences === 0
                    ? "bg-green-100 text-green-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                {stats.faculty.withoutPreferences === 0 ? "✓" : "!"}
              </div>
              <h3 className="font-medium">Faculty Preferences</h3>
              <p className="text-sm text-gray-600">
                {stats.faculty.withoutPreferences === 0
                  ? "All faculty have preferences"
                  : `${stats.faculty.withoutPreferences} pending`}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  stats.faculty.withInsufficientCourses === 0
                    ? "bg-green-100 text-green-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {stats.faculty.withInsufficientCourses === 0 ? "✓" : "!"}
              </div>
              <h3 className="font-medium">Course Distribution</h3>
              <p className="text-sm text-gray-600">
                {stats.faculty.withInsufficientCourses === 0
                  ? "All faculty have sufficient courses"
                  : `${stats.faculty.withInsufficientCourses} need more courses`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
