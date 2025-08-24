/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { courseSchema } from "@/lib/zodSchemas";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  selected: any;
  refresh: () => void;
}

export default function CourseModal({
  open,
  setOpen,
  selected,
  refresh,
}: Props) {
  const [form, setForm] = useState({
    code: "",
    title: "",
    department: "",
    creditHours: "3",
    enrollment: "",
    multimediaRequired: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected) {
      setForm({
        code: selected.code || "",
        title: selected.title || "",
        department: selected.department || "",
        creditHours: selected.creditHours?.toString() || "3",
        enrollment: selected.enrollment?.toString() || "",
        multimediaRequired: selected.multimediaRequired || false,
      });
    } else {
      setForm({
        code: "",
        title: "",
        department: "",
        creditHours: "3",
        enrollment: "",
        multimediaRequired: false,
      });
    }
  }, [selected]);

  const handleSave = async () => {
    const parsed = courseSchema.safeParse({
      ...form,
      creditHours: parseInt(form.creditHours),
      enrollment: parseInt(form.enrollment),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

    setLoading(true);
    try {
      const method = selected ? "PUT" : "POST";
      const url = "/api/courses";

      const body = selected
        ? { _id: selected._id, ...parsed.data }
        : parsed.data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || `Failed to ${selected ? "update" : "create"} course`
        );

      toast.success(`Course ${selected ? "updated" : "created"} successfully`);
      refresh();
      setOpen(false);

      if (!selected)
        setForm({
          code: "",
          title: "",
          department: "",
          creditHours: "3",
          enrollment: "",
          multimediaRequired: false,
        });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selected ? "Edit Course" : "Add New Course"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Course Code *</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g., CS201, MATH101"
              disabled={loading}
            />
          </div>

          {/* Course Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Introduction to Programming"
              disabled={loading}
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input
              id="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g., Computer Science"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditHours">Credit Hours *</Label>
              <select
                id="creditHours"
                value={form.creditHours}
                onChange={(e) =>
                  setForm({ ...form, creditHours: e.target.value })
                }
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="1">1 Credit Hour</option>
                <option value="2">2 Credit Hours</option>
                <option value="3">3 Credit Hours</option>
                <option value="4">4 Credit Hours</option>
                <option value="5">5 Credit Hours</option>
                <option value="6">6 Credit Hours</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment">Student Enrollment *</Label>
              <Input
                id="enrollment"
                type="number"
                min="0"
                max="200"
                value={form.enrollment}
                onChange={(e) =>
                  setForm({ ...form, enrollment: e.target.value })
                }
                placeholder="e.g., 85, 65, 48"
                disabled={loading}
              />
            </div>
          </div>

          {/* Multimedia Requirement */}
          <div className="space-y-2">
            <Label htmlFor="multimediaRequired">Multimedia Required</Label>
            <div className="flex items-center space-x-2">
              <input
                id="multimediaRequired"
                type="checkbox"
                checked={form.multimediaRequired}
                onChange={(e) =>
                  setForm({ ...form, multimediaRequired: e.target.checked })
                }
                disabled={loading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label
                htmlFor="multimediaRequired"
                className="text-sm font-normal"
              >
                This course requires multimedia facilities (projector, audio,
                etc.)
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <button
            className="px-4 py-2 border rounded hover:bg-gray-50"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
            disabled={
              loading ||
              !form.code ||
              !form.title ||
              !form.department ||
              !form.enrollment
            }
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
