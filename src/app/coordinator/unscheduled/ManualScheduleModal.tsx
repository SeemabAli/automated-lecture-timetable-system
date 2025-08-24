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
  onComplete: () => void;
}

export default function ManualScheduleModal({
  open,
  setOpen,
  onComplete,
}: Props) {
  const [form, setForm] = useState({
    courseId: "",
    facultyId: "",
    classroomId: "",
    timeslotId: "",
    day: "",
  });
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Fetch all data
  const fetchData = async () => {
    try {
      const [
        coursesRes,
        facultyRes,
        classroomsRes,
        timeslotsRes,
        unscheduledRes,
      ] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/faculty"),
        fetch("/api/classrooms"),
        fetch("/api/timeslots"),
        fetch("/api/timetable/unscheduled"),
      ]);

      const [
        coursesData,
        facultyData,
        classroomsData,
        timeslotsData,
        unscheduledData,
      ] = await Promise.all([
        coursesRes.json(),
        facultyRes.json(),
        classroomsRes.json(),
        timeslotsRes.json(),
        unscheduledRes.json(),
      ]);

      setCourses(coursesData);
      setFaculty(facultyData);
      setClassrooms(classroomsData);
      setTimeslots(timeslotsData);
      setAvailableSlots(unscheduledData.unscheduled?.slots || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (
      !form.courseId ||
      !form.facultyId ||
      !form.classroomId ||
      !form.timeslotId ||
      !form.day
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/timetable/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule course");
      }

      toast.success("Course scheduled successfully!");
      onComplete();
      setOpen(false);
      setForm({
        courseId: "",
        facultyId: "",
        classroomId: "",
        timeslotId: "",
        day: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error scheduling course");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setForm({
      courseId: "",
      facultyId: "",
      classroomId: "",
      timeslotId: "",
      day: "",
    });
  };

  // Filter available slots based on selected classroom and timeslot
  const filteredSlots = availableSlots.filter((slot) => {
    if (form.classroomId && slot.classroom._id !== form.classroomId)
      return false;
    if (form.timeslotId && slot.timeslot._id !== form.timeslotId) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Schedule Course</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Course *</label>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              disabled={loading}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.title} ({course.creditHours} credits)
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Faculty *</label>
            <select
              value={form.facultyId}
              onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
              disabled={loading}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select faculty</option>
              {faculty.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.designation}) - {f.department}
                </option>
              ))}
            </select>
          </div>

          {/* Classroom Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Classroom *</label>
            <select
              value={form.classroomId}
              onChange={(e) =>
                setForm({ ...form, classroomId: e.target.value })
              }
              disabled={loading}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select classroom</option>
              {classrooms.map((classroom) => (
                <option key={classroom._id} value={classroom._id}>
                  {classroom.classroomId} ({classroom.building}) - Capacity:{" "}
                  {classroom.capacity}
                </option>
              ))}
            </select>
          </div>

          {/* Timeslot Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Timeslot *</label>
            <select
              value={form.timeslotId}
              onChange={(e) => setForm({ ...form, timeslotId: e.target.value })}
              disabled={loading}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select timeslot</option>
              {timeslots.map((timeslot) => (
                <option key={timeslot._id} value={timeslot._id}>
                  {timeslot.day} {timeslot.start} - {timeslot.end}
                </option>
              ))}
            </select>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Day *</label>
            <select
              value={form.day}
              onChange={(e) => setForm({ ...form, day: e.target.value })}
              disabled={loading}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select day</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Available Slots Preview */}
          {filteredSlots.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Available Slots</label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                {filteredSlots.slice(0, 5).map((slot, index) => (
                  <div key={index} className="text-xs text-gray-600 py-1">
                    {slot.classroom.classroomId} - {slot.day}{" "}
                    {slot.timeslot.start}-{slot.timeslot.end}
                  </div>
                ))}
                {filteredSlots.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ... and {filteredSlots.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={
              loading ||
              !form.courseId ||
              !form.facultyId ||
              !form.classroomId ||
              !form.timeslotId ||
              !form.day
            }
          >
            {loading ? "Scheduling..." : "Schedule Course"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
