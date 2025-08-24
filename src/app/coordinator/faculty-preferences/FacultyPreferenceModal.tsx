/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  faculty: any;
  courses: any[];
  onComplete: () => void;
}

export default function FacultyPreferenceModal({
  open,
  setOpen,
  faculty,
  courses,
  onComplete,
}: Props) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingPreference, setExistingPreference] = useState<any>(null);

  useEffect(() => {
    if (open && faculty) {
      fetchExistingPreference();
    }
  }, [open, faculty]);

  const fetchExistingPreference = async () => {
    if (!faculty?._id) return;

    try {
      const res = await fetch(`/api/preferences/faculty/${faculty._id}`);
      if (res.ok) {
        const data = await res.json();
        setExistingPreference(data);
        const courseIds = data.courses.map((course: any) =>
          typeof course === "string" ? course : course._id
        );
        setSelectedCourses(courseIds);
      } else {
        setExistingPreference(null);
        setSelectedCourses([]);
      }
    } catch (error) {
      console.error("Error fetching existing preference:", error);
      setExistingPreference(null);
      setSelectedCourses([]);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSave = async () => {
    if (!faculty?._id) {
      toast.error("Faculty not found");
      return;
    }

    if (selectedCourses.length < 5) {
      toast.error("You must select at least 5 courses");
      return;
    }

    setLoading(true);
    try {
      const method = existingPreference ? "PUT" : "POST";
      const url = `/api/preferences/faculty/${faculty._id}`;

      const body = {
        courses: selectedCourses,
        submittedAt: new Date().toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save preferences");

      toast.success(
        `Preferences ${existingPreference ? "updated" : "saved"} successfully`
      );
      onComplete();
      setOpen(false);
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      toast.error(err.message || "Error saving preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedCourses([]);
    setExistingPreference(null);
  };

  if (!faculty) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {existingPreference ? "Edit" : "Add"} Preferences for {faculty.name}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Select at least 5 courses for {faculty.name} ({faculty.designation}{" "}
            - {faculty.department})
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Available Courses */}
          <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
            <h3 className="font-medium">Available Courses</h3>
            {courses.map((course) => {
              const isSelected = selectedCourses.includes(course._id);
              return (
                <div
                  key={course._id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  onClick={() => handleCourseToggle(course._id)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-blue-600"
                    />
                    <span className="font-medium text-blue-600">
                      {course.code}
                    </span>
                  </div>
                  <h4 className="font-medium mt-1">{course.title}</h4>
                  <p className="text-sm text-gray-600">{course.department}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {course.creditHours} credit hours
                    </span>
                    <span className="text-xs text-gray-500">
                      {course.enrollment} students
                    </span>
                    {course.multimediaRequired && (
                      <span className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded text-xs">
                        Multimedia
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Courses Preview */}
          <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
            <h3 className="font-medium">
              Selected Courses ({selectedCourses.length}/5 minimum)
            </h3>
            {selectedCourses.length === 0 ? (
              <p className="text-gray-500 text-sm">No courses selected yet</p>
            ) : (
              selectedCourses.map((courseId, index) => {
                const course = courses.find((c) => c._id === courseId);
                if (!course) return null;
                return (
                  <div
                    key={courseId}
                    className="border rounded-lg p-3 bg-blue-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-blue-600">
                        {course.code}
                      </span>
                    </div>
                    <h4 className="font-medium mt-1">{course.title}</h4>
                    <p className="text-sm text-gray-600">{course.department}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        {course.creditHours} credit hours
                      </span>
                      <span className="text-xs text-gray-500">
                        {course.enrollment} students
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <button
            className="px-4 py-2 border rounded hover:bg-gray-50"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
            disabled={loading || selectedCourses.length < 5}
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
