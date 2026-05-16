import mongoose from "mongoose";

const genreSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "generos",
    timestamps: true,
  }
);

export default mongoose.models.Genre || mongoose.model("Genre", genreSchema);
