/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import CourseModal from "./CourseModal";
import DeleteModal from "./DeleteModal";

export default function OfferedCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchCourses = async () => {
    const res = await fetch("/api/courses", { cache: "no-store" });
    const data = await res.json();
    setCourses(data);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["coordinator"]}>
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Coordinator • Offered Courses</h1>
          <LogoutButton />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            Total Courses:{" "}
            <span className="font-semibold">{courses.length}</span>
          </div>
          <button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            + Add Course
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow p-4">
          {courses.length === 0 ? (
            <p className="text-gray-500">No courses found.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Code</th>
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Credit Hours
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Enrollment
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Multimedia
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-blue-600">
                      {course.code}
                    </td>
                    <td className="py-3 px-4">{course.title}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {course.department}
                    </td>
                    <td className="py-3 px-4">{course.creditHours}</td>
                    <td className="py-3 px-4">{course.enrollment}</td>
                    <td className="py-3 px-4">
                      {course.multimediaRequired ? (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          Required
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          Not Required
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelected(course);
                            setOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelected(course);
                            setDeleteOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        {courses.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Total Courses
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Total Enrollment
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {courses.reduce(
                  (sum, course) => sum + (course.enrollment || 0),
                  0
                )}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Multimedia Required
              </h3>
              <p className="text-2xl font-bold text-orange-600">
                {courses.filter((course) => course.multimediaRequired).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Total Credit Hours
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {courses.reduce(
                  (sum, course) => sum + (course.creditHours || 0),
                  0
                )}
              </p>
            </div>
          </div>
        )}

        {/* Modals */}
        <CourseModal
          open={open}
          setOpen={setOpen}
          selected={selected}
          refresh={fetchCourses}
        />
        <DeleteModal
          open={deleteOpen}
          setOpen={setDeleteOpen}
          selected={selected}
          refresh={fetchCourses}
        />
      </div>
    </ProtectedRoute>
  );
}
