import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const employeeSchema = new Schema(
  {
    user: ref("User", true),
    employeeId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    jobTitle: { type: String, required: true },
    salary: { type: Number, min: 0, default: null, select: false },
    address: { type: String, default: "", select: false },
    manager: ref("User"),
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },
    joiningDate: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    avatar: { type: String, default: "" },
    leaveLockUntil: { type: Date, default: null, select: false },
    performance: {
      rating: { type: Number, min: 1, max: 5 },
      note: String,
      reviewedAt: Date,
      reviewedBy: ref("User"),
    },
  },
  options,
);
employeeSchema.index({ user: 1 }, { unique: true });
employeeSchema.index({ manager: 1, status: 1 });
employeeSchema.index({ department: 1, status: 1 });
export default mongoose.model("Employee", employeeSchema);
