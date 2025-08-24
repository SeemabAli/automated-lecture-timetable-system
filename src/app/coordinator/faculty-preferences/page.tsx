/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import FacultyPreferenceModal from "./FacultyPreferenceModal";
import toast from "react-hot-toast";

interface FacultyPreference {
  _id: string;
  facultyId: {
    _id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
  };
  courses: Array<{
    _id: string;
    code: string;
    title: string;
    department: string;
    creditHours: number;
    enrollment: number;
    multimediaRequired: boolean;
  }>;
  submittedAt: string;
}

export default function FacultyPreferencesPage() {
  const [preferences, setPreferences] = useState<FacultyPreference[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [preferencesRes, facultyRes, coursesRes] = await Promise.all([
        fetch("/api/preferences"),
        fetch("/api/faculty"),
        fetch("/api/courses"),
      ]);

      const [preferencesData, facultyData, coursesData] = await Promise.all([
        preferencesRes.json(),
        facultyRes.json(),
        coursesRes.json(),
      ]);

      setPreferences(preferencesData);
      setFaculty(facultyData);
      setCourses(coursesData);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPreference = (facultyMember: any) => {
    setSelectedFaculty(facultyMember);
    setModalOpen(true);
  };

  const handleEditPreference = (preference: FacultyPreference) => {
    setSelectedFaculty(preference.facultyId);
    setModalOpen(true);
  };

  const getFacultyWithoutPreferences = () => {
    const facultyWithPreferences = new Set(
      preferences.map((p) => p.facultyId._id)
    );
    return faculty.filter((f) => !facultyWithPreferences.has(f._id));
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["coordinator"]}>
        <div className="min-h-screen p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              Coordinator • Faculty Preferences
            </h1>
            <LogoutButton />
          </div>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading faculty preferences...</p>
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
            Coordinator • Faculty Preferences
          </h1>
          <LogoutButton />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Faculty</h3>
            <p className="text-2xl font-bold text-blue-600">{faculty.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Preferences Submitted
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {preferences.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Pending Submissions
            </h3>
            <p className="text-2xl font-bold text-orange-600">
              {getFacultyWithoutPreferences().length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Courses</h3>
            <p className="text-2xl font-bold text-purple-600">
              {courses.length}
            </p>
          </div>
        </div>

        {/* Faculty with Preferences */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Faculty with Submitted Preferences
          </h2>
          {preferences.length === 0 ? (
            <p className="text-gray-500">
              No faculty preferences submitted yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preferences.map((preference) => (
                <div
                  key={preference._id}
                  className="border rounded-lg p-4 bg-green-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-green-800">
                        {preference.facultyId.name}
                      </h3>
                      <p className="text-sm text-green-600">
                        {preference.facultyId.department}
                      </p>
                      <p className="text-xs text-green-500">
                        {preference.facultyId.designation}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditPreference(preference)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      Submitted:{" "}
                      {new Date(preference.submittedAt).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {preference.courses.slice(0, 3).map((course) => (
                        <span
                          key={course._id}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                        >
                          {course.code}
                        </span>
                      ))}
                      {preference.courses.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          +{preference.courses.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty without Preferences */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Faculty Without Preferences
          </h2>
          {getFacultyWithoutPreferences().length === 0 ? (
            <p className="text-gray-500">
              All faculty have submitted their preferences!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFacultyWithoutPreferences().map((facultyMember) => (
                <div
                  key={facultyMember._id}
                  className="border rounded-lg p-4 bg-red-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-red-800">
                        {facultyMember.name}
                      </h3>
                      <p className="text-sm text-red-600">
                        {facultyMember.department}
                      </p>
                      <p className="text-xs text-red-500">
                        {facultyMember.designation}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddPreference(facultyMember)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Add Preferences
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">{facultyMember.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Preference Modal */}
        <FacultyPreferenceModal
          open={modalOpen}
          setOpen={setModalOpen}
          faculty={selectedFaculty}
          courses={courses}
          onComplete={fetchData}
        />
      </div>
    </ProtectedRoute>
  );
}
