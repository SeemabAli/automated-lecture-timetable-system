import { z } from "zod";

export const facultySchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  department: z.string().min(2, "Department is required"),
});

export const studentSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  batch: z.string().min(2, "Batch is required"),
});

export const coordinatorSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  department: z.string().min(2, "Department is required"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const courseSchema = z.object({
  code: z.string().min(2, "Course code is required"),
  title: z.string().min(3, "Course title is required"),
  enrollment: z.number().min(1, "Enrollment must be at least 1"),
  multimediaRequired: z.boolean(),
  creditHours: z
    .number()
    .min(1, "Credit hours must be at least 1")
    .max(6, "Credit hours cannot exceed 6"),
  department: z.string().min(2, "Department is required"),
});

export const classroomSchema = z.object({
  classroomId: z.string().min(2, "Classroom ID is required"),
  building: z.string().min(2, "Building is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  multimedia: z.boolean(),
});

export const facultyPreferenceSchema = z.object({
  courses: z.array(z.string()).min(5, "You must select at least 5 courses"),
});
