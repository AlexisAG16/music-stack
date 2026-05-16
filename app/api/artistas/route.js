import mongoose from "mongoose";
import { verificarAdmin } from "@/lib/authMiddleware";
import connectDB from "@/lib/mongodb";
import Artist from "@/models/Artist";

export const runtime = "nodejs";

function validarArtista(body = {}) {
  const { nombre, imagen, pais, esGrupo, numeroIntegrantes, tieneGrupo, estaVivo, edad, sexo, generoMusical, biografia } =
    body || {};
  const errores = {};
  const datos = {
    nombre: typeof nombre === "string" ? nombre.trim() : "",
    imagen:
      typeof imagen === "string" && imagen.trim()
        ? imagen.trim()
        : "https://placehold.co/600x600?text=Artista",
    pais: typeof pais === "string" ? pais.trim() : "",
    esGrupo,
    numeroIntegrantes: esGrupo === true ? Number(numeroIntegrantes) : 1,
    tieneGrupo: typeof tieneGrupo === "string" && tieneGrupo.trim() ? tieneGrupo.trim() : null,
    estaVivo: typeof estaVivo === "boolean" ? estaVivo : true,
    generoMusical: typeof generoMusical === "string" ? generoMusical.trim() : "",
    biografia: typeof biografia === "string" ? biografia.trim() : "",
  };

  if (!datos.nombre) {
    errores.nombre = "El nombre es obligatorio.";
  }

  if (!datos.pais) {
    errores.pais = "El pais es obligatorio.";
  }

  if (typeof datos.esGrupo !== "boolean") {
    errores.esGrupo = "El campo esGrupo debe ser booleano.";
  }

  if (typeof datos.estaVivo !== "boolean") {
    errores.estaVivo = "El campo estaVivo debe ser booleano.";
  }

  if (datos.esGrupo === true) {
    if (!Number.isInteger(datos.numeroIntegrantes) || datos.numeroIntegrantes < 2) {
      errores.numeroIntegrantes = "Los grupos deben tener al menos 2 integrantes.";
    }
    datos.tieneGrupo = null;
  }

  if (datos.esGrupo === false && datos.tieneGrupo && !mongoose.Types.ObjectId.isValid(datos.tieneGrupo)) {
    errores.tieneGrupo = "El grupo vinculado debe ser un ID valido de MongoDB.";
  }

  if (!datos.generoMusical) {
    errores.generoMusical = "El genero musical es obligatorio.";
  } else if (!mongoose.Types.ObjectId.isValid(datos.generoMusical)) {
    errores.generoMusical = "El genero musical debe ser un ID valido de MongoDB.";
  }

  if (!datos.biografia) {
    errores.biografia = "La biografia es obligatoria.";
  }

  if (datos.esGrupo === false) {
    const edadNumerica = Number(edad);
    const sexoLimpio = typeof sexo === "string" ? sexo.trim() : "";

    if (datos.estaVivo && (edad === undefined || edad === null || edad === "")) {
      errores.edad = "La edad es obligatoria para artistas solistas.";
    } else if (datos.estaVivo && (!Number.isFinite(edadNumerica) || edadNumerica <= 0)) {
      errores.edad = "La edad debe ser un numero positivo.";
    } else if (datos.estaVivo) {
      datos.edad = edadNumerica;
    }

    if (!sexoLimpio) {
      errores.sexo = "El sexo es obligatorio para artistas solistas.";
    } else {
      datos.sexo = sexoLimpio;
    }
  } else {
    datos.estaVivo = true;
    datos.numeroIntegrantes = Math.max(datos.numeroIntegrantes || 2, 2);
  }

  return { datos, errores };
}

export async function GET() {
  try {
    await connectDB();

    const artistas = await Artist.find()
      .populate("generoMusical", "nombre descripcion")
      .populate("tieneGrupo", "nombre imagen pais numeroIntegrantes")
      .sort({ nombre: 1 });

    return Response.json({ artistas }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al obtener los artistas.", error: error.message },
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
    const { datos, errores } = validarArtista(body);

    if (Object.keys(errores).length > 0) {
      return Response.json(
        { mensaje: "Datos del artista invalidos.", errores },
        { status: 400 }
      );
    }

    await connectDB();

    const artistaCreado = await Artist.create(datos);
    const artista = await Artist.findById(artistaCreado._id)
      .populate("generoMusical", "nombre descripcion")
      .populate("tieneGrupo", "nombre imagen pais numeroIntegrantes");

    return Response.json(
      {
        mensaje: "Artista creado correctamente.",
        artista,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { mensaje: "Error al crear el artista.", error: error.message },
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
      return Response.json({ mensaje: "ID de artista invalido." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const { datos, errores } = validarArtista(body);

    if (Object.keys(errores).length > 0) {
      return Response.json({ mensaje: "Datos del artista invalidos.", errores }, { status: 400 });
    }

    if (!body?.imagen?.trim()) {
      delete datos.imagen;
    }

    const update = { ...datos };
    const unset = {};

    if (datos.esGrupo || !datos.estaVivo) {
      delete update.edad;
      unset.edad = "";
    }

    if (datos.esGrupo) {
      delete update.sexo;
      unset.sexo = "";
    }

    await connectDB();

    const artista = await Artist.findByIdAndUpdate(
      id,
      Object.keys(unset).length > 0 ? { $set: update, $unset: unset } : update,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("generoMusical", "nombre descripcion")
      .populate("tieneGrupo", "nombre imagen pais numeroIntegrantes");

    if (!artista) {
      return Response.json({ mensaje: "Artista no encontrado." }, { status: 404 });
    }

    return Response.json({ mensaje: "Artista actualizado correctamente.", artista }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al actualizar el artista.", error: error.message },
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
      return Response.json({ mensaje: "ID de artista invalido." }, { status: 400 });
    }

    await connectDB();

    const artista = await Artist.findByIdAndDelete(id);

    if (!artista) {
      return Response.json({ mensaje: "Artista no encontrado." }, { status: 404 });
    }

    return Response.json({ mensaje: "Artista borrado correctamente." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al borrar el artista.", error: error.message },
      { status: 500 }
    );
  }
}
