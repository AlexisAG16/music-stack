import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

const nombreRegex = /^\p{L}+(?:[ '-]\p{L}+)*$/u;
const correoRegex =
  /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

function validarRegistro(body = {}) {
  const { nombre, correo, contrasena } = body || {};
  const errores = {};
  const datos = {
    nombre: typeof nombre === "string" ? nombre.trim() : "",
    correo: typeof correo === "string" ? correo.trim().toLowerCase() : "",
    contrasena: typeof contrasena === "string" ? contrasena : "",
  };

  if (!datos.nombre) {
    errores.nombre = "El nombre es obligatorio.";
  } else if (datos.nombre.length < 3) {
    errores.nombre = "El nombre debe tener al menos 3 caracteres.";
  } else if (!nombreRegex.test(datos.nombre)) {
    errores.nombre = "El nombre solo puede contener letras, espacios, apostrofes o guiones.";
  }

  if (!datos.correo) {
    errores.correo = "El correo es obligatorio.";
  } else if (!correoRegex.test(datos.correo)) {
    errores.correo = "El correo no tiene un formato valido.";
  }

  if (!datos.contrasena.trim()) {
    errores.contrasena = "La contrasena es obligatoria.";
  } else if (datos.contrasena.length < 8) {
    errores.contrasena = "La contrasena debe tener al menos 8 caracteres.";
  }

  return { datos, errores };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const { datos, errores } = validarRegistro(body);

    if (Object.keys(errores).length > 0) {
      return Response.json(
        { mensaje: "Datos de registro invalidos.", errores },
        { status: 400 }
      );
    }

    await connectDB();

    const usuarioExistente = await User.findOne({ correo: datos.correo });

    if (usuarioExistente) {
      return Response.json(
        {
          mensaje: "Datos de registro invalidos.",
          errores: { correo: "El correo ya esta registrado." },
        },
        { status: 400 }
      );
    }

    const contrasenaEncriptada = await bcrypt.hash(datos.contrasena, 10);

    const usuario = await User.create({
      nombre: datos.nombre,
      correo: datos.correo,
      contrasena: contrasenaEncriptada,
    });

    return Response.json(
      {
        mensaje: "Usuario registrado correctamente.",
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { mensaje: "Error al registrar el usuario.", error: error.message },
      { status: 500 }
    );
  }
}
