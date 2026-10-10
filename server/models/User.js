import bcrypt from "bcrypt";
import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["hr", "manager", "employee"], required: true },
    active: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
  },
  options,
);
userSchema.virtual("password").set(function (value) {
  this._password = value;
});
userSchema.pre("validate", async function () {
  if (this._password !== undefined) {
    if (
      typeof this._password !== "string" ||
      this._password.length < 10 ||
      Buffer.byteLength(this._password, "utf8") > 72
    )
      throw new Error(
        "Password must have at least 10 characters and at most 72 UTF-8 bytes.",
      );
    this.passwordHash = await bcrypt.hash(this._password, 12);
    this._password = undefined;
  }
});
userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};
export default mongoose.model("User", userSchema);
