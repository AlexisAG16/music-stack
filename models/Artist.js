import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    imagen: {
      type: String,
      default: "https://placehold.co/600x600?text=Artista",
      trim: true,
    },
    pais: {
      type: String,
      required: true,
      trim: true,
    },
    esGrupo: {
      type: Boolean,
      required: true,
    },
    numeroIntegrantes: {
      type: Number,
      default: 1,
      min: 1,
      required() {
        return this.esGrupo === true;
      },
    },
    tieneGrupo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      default: null,
    },
    estaVivo: {
      type: Boolean,
      default: true,
    },
    edad: {
      type: Number,
      required() {
        return this.esGrupo === false && this.estaVivo === true;
      },
      min: 0,
    },
    sexo: {
      type: String,
      required() {
        return this.esGrupo === false;
      },
      trim: true,
    },
    generoMusical: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
      required: true,
    },
    biografia: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "artistas",
    timestamps: true,
  }
);

export default mongoose.models.Artist || mongoose.model("Artist", artistSchema);
