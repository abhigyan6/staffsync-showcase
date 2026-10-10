import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const attendanceSchema = new Schema(
  {
    employee: ref("Employee", true),
    date: { type: String, required: true },
    checkIn: Date,
    checkOut: Date,
    status: {
      type: String,
      enum: ["present", "late", "absent", "leave", "half-day"],
      default: "present",
    },
    note: { type: String, default: "" },
    correctedBy: ref("User"),
  },
  options,
);
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });
export default mongoose.model("Attendance", attendanceSchema);
