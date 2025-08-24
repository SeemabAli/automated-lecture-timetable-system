import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  code: string;
  title: string;
  enrollment: number;
  multimediaRequired: boolean;
  creditHours: number;
  department: string;
  studentBatch?: string; // For timetable
  preferredFacultyIds?: string[]; // Array of faculty IDs for preferences
}

const CourseSchema: Schema<ICourse> = new Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    enrollment: { type: Number, required: true },
    multimediaRequired: { type: Boolean, required: true },
    creditHours: { type: Number, required: true, default: 3 },
    department: { type: String, required: true },
    studentBatch: { type: String }, // Optional
    preferredFacultyIds: [{ type: Schema.Types.ObjectId, ref: "Faculty" }], // Optional array
  },
  { timestamps: true }
);

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
