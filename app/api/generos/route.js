import { verificarAdmin } from "@/lib/authMiddleware";
import connectDB from "@/lib/mongodb";
import Genre from "@/models/Genre";
import mongoose from "mongoose";

export const runtime = "nodejs";

function validarGenero(body = {}) {
  const { nombre, descripcion } = body || {};
  const errores = {};
  const datos = {
    nombre: typeof nombre === "string" ? nombre.trim() : "",
    descripcion: typeof descripcion === "string" ? descripcion.trim() : "",
  };

  if (!datos.nombre) {
    errores.nombre = "El nombre del genero es obligatorio.";
  } else if (datos.nombre.length < 3) {
    errores.nombre = "El nombre del genero debe tener al menos 3 caracteres.";
  }

  if (!datos.descripcion) {
    errores.descripcion = "La descripcion es obligatoria.";
  }

  return { datos, errores };
}

export async function GET() {
  try {
    await connectDB();

    const generos = await Genre.find().sort({ nombre: 1 });

    return Response.json({ generos }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al obtener los generos.", error: error.message },
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
    const { datos, errores } = validarGenero(body);

    if (Object.keys(errores).length > 0) {
      return Response.json(
        { mensaje: "Datos del genero invalidos.", errores },
        { status: 400 }
      );
    }

    await connectDB();

    const genero = await Genre.create(datos);

    return Response.json(
      {
        mensaje: "Genero creado correctamente.",
        genero,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { mensaje: "Error al crear el genero.", error: error.message },
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
      return Response.json({ mensaje: "ID de genero invalido." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const { datos, errores } = validarGenero(body);

    if (Object.keys(errores).length > 0) {
      return Response.json({ mensaje: "Datos del genero invalidos.", errores }, { status: 400 });
    }

    await connectDB();

    const genero = await Genre.findByIdAndUpdate(id, datos, { new: true, runValidators: true });

    if (!genero) {
      return Response.json({ mensaje: "Genero no encontrado." }, { status: 404 });
    }

    return Response.json({ mensaje: "Genero actualizado correctamente.", genero }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al actualizar el genero.", error: error.message },
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
      return Response.json({ mensaje: "ID de genero invalido." }, { status: 400 });
    }

    await connectDB();

    const genero = await Genre.findByIdAndDelete(id);

    if (!genero) {
      return Response.json({ mensaje: "Genero no encontrado." }, { status: 404 });
    }

    return Response.json({ mensaje: "Genero borrado correctamente." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { mensaje: "Error al borrar el genero.", error: error.message },
      { status: 500 }
    );
  }
}
