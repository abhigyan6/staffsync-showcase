import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const trainingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "Professional development" },
    dueDate: { type: String, required: true },
    date: { type: String, default: "" },
    trainer: { type: String, default: "TBD" },
    duration: { type: String, default: "1 hour" },
    resourceUrl: { type: String, default: "" },
    owner: ref("User", true),
    assignments: [
      {
        employee: ref("Employee", true),
        status: {
          type: String,
          enum: ["assigned", "in-progress", "completed"],
          default: "assigned",
        },
        completedAt: Date,
      },
    ],
  },
  options,
);
trainingSchema.index({ owner: 1 });
trainingSchema.index({ "assignments.employee": 1 });
export default mongoose.model("TrainingProgram", trainingSchema);
