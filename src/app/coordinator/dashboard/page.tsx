/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";

export default function CoordinatorDashboard() {
  return (
    <ProtectedRoute allowedRoles={["coordinator"]}>
      {/* HEADER */}
      <div className="bg-[#493737] text-white px-6 py-4 flex flex-wrap items-center justify-between shadow-md">
        <div className="flex items-center gap-3 min-w-[200px] mb-2 sm:mb-0">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/VU_Logo.png/960px-VU_Logo.png"
              alt="VU Logo"
              className="w-8 h-auto"
            />
          </div>
          <span className="text-lg font-semibold">Coordinator Dashboard</span>
        </div>
        <button className="bg-[#d89860] hover:bg-[#c08850] px-4 py-2 rounded text-sm">
          <LogoutButton />
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Dashboard Header */}
        <div className="bg-white p-6 rounded-xl mb-6 border-l-4 shadow-sm border-[#d89860]">
          <h1 className="text-2xl font-semibold text-[#493737]">
            Coordinator Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Manage courses, classrooms, timetables, and handle unscheduled items
          </p>
        </div>

        {/* BUTTON GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 - Courses */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:-translate-y-1 transition-transform">
            <Link href="/coordinator/offered-courses">
              <button className="w-full py-2 bg-[#d89860] text-white rounded-lg hover:bg-[#c08850]">
                Manage Courses
              </button>
            </Link>
          </div>

          {/* Card 2 - Classrooms */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:-translate-y-1 transition-transform">
            <Link href="/coordinator/classrooms">
              <button className="w-full py-2 bg-[#d89860] text-white rounded-lg hover:bg-[#c08850]">
                Manage Classrooms
              </button>
            </Link>
          </div>

          {/* Card 3 - Timetable */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:-translate-y-1 transition-transform">
            <Link href="/coordinator/timetable">
              <button className="w-full py-2 bg-[#d89860] text-white rounded-lg hover:bg-[#c08850]">
                Generate Timetable
              </button>
            </Link>
          </div>

          {/* Card 4 - Unscheduled Items */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:-translate-y-1 transition-transform">
            <Link href="/coordinator/unscheduled">
              <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                View Unscheduled Items
              </button>
            </Link>
          </div>

          {/* Card 5 - Faculty Preferences */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:-translate-y-1 transition-transform">
            <Link href="/coordinator/faculty-preferences">
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Faculty Preferences
              </button>
            </Link>
          </div>

          {/* Card 6 - Reports */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:-translate-y-1 transition-transform">
            <Link href="/coordinator/reports">
              <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                View Reports
              </button>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
