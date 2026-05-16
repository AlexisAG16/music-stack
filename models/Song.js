import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    anio: {
      type: Number,
      required: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    artista: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    genero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
      required: true,
    },
  },
  {
    collection: "canciones",
    timestamps: true,
  }
);

export default mongoose.models.Song || mongoose.model("Song", songSchema);
