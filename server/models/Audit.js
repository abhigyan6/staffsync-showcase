import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const auditSchema = new Schema(
  { actor: ref("User"), action: String, target: String, detail: String },
  options,
);
auditSchema.index({ createdAt: -1 });
export default mongoose.model("Audit", auditSchema);
