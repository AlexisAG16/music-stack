import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contrasena: {
      type: String,
      required: true,
    },
    rol: {
      type: String,
      enum: ["usuario", "admin"],
      default: "usuario",
    },
  },
  {
    collection: "usuarios",
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
