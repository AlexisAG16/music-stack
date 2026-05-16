import mongoose from "mongoose";
import { verificarAdmin } from "@/lib/authMiddleware";
import connectDB from "@/lib/mongodb";
import Song from "@/models/Song";

export const runtime = "nodejs";

function validarCancion(body = {}) {
  const { nombre, anio, descripcion, artista, genero } = body || {};
  const errores = {};
  const anioNumerico = Number(anio);
  const anioActual = new Date().getFullYear();
  const datos = {
    nombre: typeof nombre === "string" ? nombre.trim() : "",
    descripcion: typeof descripcion === "string" ? descripcion.trim() : "",
    artista: typeof artista === "string" ? artista.trim() : "",
    genero: typeof genero === "string" ? genero.trim() : "",
  };

  if (!datos.nombre) {
    errores.nombre = "El nombre de la cancion es obligatorio.";
  }

  if (!datos.descripcion) {
    errores.descripcion = "La descripcion es obligatoria.";
  }

  if (anio === undefined || anio === null || anio === "") {
    errores.anio = "El anio es obligatorio.";
  } else if (
    !Number.isInteger(anioNumerico) ||
    anioNumerico < 1900 ||
    anioNumerico > anioActual
  ) {
    errores.anio = `El anio debe ser un numero entero entre 1900 y ${anioActual}.`;
  } else {
    datos.anio = anioNumerico;
  }

  if (!datos.artista) {
    errores.artista = "El artista es obligatorio.";
  } else if (!mongoose.Types.ObjectId.isValid(datos.artista)) {
    errores.artista = "El artista debe ser un ID valido de MongoDB.";
  }

  if (!datos.genero) {
    errores.genero = "El genero es obligatorio.";
  } else if (!mongoose.Types.ObjectId.isValid(datos.genero)) {
    errores.genero = "El genero debe ser un ID valido de MongoDB.";
  }

  return { datos, errores };
}

export async function GET() {
  try {
    await connectDB();

    const canciones = await Song.find()
      .populate("artista")
      .populate("genero")
      .sort({ nombre: 1 });

    return Response.json({ canciones }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al obtener las canciones.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = verificarAdmin(request);

    if (!auth.autorizado) {
      return Response.json({ mensaje: auth.mensaje }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const { datos, errores } = validarCancion(body);

    if (Object.keys(errores).length > 0) {
      return Response.json(
        { mensaje: "Datos de la cancion invalidos.", errores },
        { status: 400 }
      );
    }

    await connectDB();

    const cancion = await Song.create(datos);

    return Response.json(
      {
        mensaje: "Cancion creada correctamente.",
        cancion,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { mensaje: "Error al crear la cancion.", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const auth = verificarAdmin(request);

    if (!auth.autorizado) {
      return Response.json({ mensaje: auth.mensaje }, { status: auth.status });
    }

    const id = new URL(request.url).searchParams.get("id");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ mensaje: "ID de cancion invalido." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const { datos, errores } = validarCancion(body);

    if (Object.keys(errores).length > 0) {
      return Response.json({ mensaje: "Datos de la cancion invalidos.", errores }, { status: 400 });
    }

    await connectDB();

    const cancion = await Song.findByIdAndUpdate(id, datos, {
      new: true,
      runValidators: true,
    })
      .populate("artista")
      .populate("genero");

    if (!cancion) {
      return Response.json({ mensaje: "Cancion no encontrada." }, { status: 404 });
    }

    return Response.json({ mensaje: "Cancion actualizada correctamente.", cancion }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al actualizar la cancion.", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = verificarAdmin(request);

    if (!auth.autorizado) {
      return Response.json({ mensaje: auth.mensaje }, { status: auth.status });
    }

    const id = new URL(request.url).searchParams.get("id");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ mensaje: "ID de cancion invalido." }, { status: 400 });
    }

    await connectDB();

    const cancion = await Song.findByIdAndDelete(id);

    if (!cancion) {
      return Response.json({ mensaje: "Cancion no encontrada." }, { status: 404 });
    }

    return Response.json({ mensaje: "Cancion borrada correctamente." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al borrar la cancion.", error: error.message },
      { status: 500 }
    );
  }
}
