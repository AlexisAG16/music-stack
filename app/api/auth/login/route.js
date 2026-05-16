import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

function validarLogin(body = {}) {
  const { correo, contrasena } = body || {};
  const errores = {};
  const datos = {
    correo: typeof correo === "string" ? correo.trim().toLowerCase() : "",
    contrasena: typeof contrasena === "string" ? contrasena : "",
  };

  if (!datos.correo) {
    errores.correo = "El correo es obligatorio.";
  }

  if (!datos.contrasena.trim()) {
    errores.contrasena = "La contrasena es obligatoria.";
  }

  return { datos, errores };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const { datos, errores } = validarLogin(body);

    if (Object.keys(errores).length > 0) {
      return Response.json(
        { mensaje: "Datos de login invalidos.", errores },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return Response.json(
        { mensaje: "JWT_SECRET no esta configurado." },
        { status: 500 }
      );
    }

    await connectDB();

    const usuario = await User.findOne({ correo: datos.correo });

    if (!usuario) {
      return Response.json(
        { mensaje: "Credenciales invalidas." },
        { status: 401 }
      );
    }

    const contrasenaValida = await bcrypt.compare(datos.contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      return Response.json(
        { mensaje: "Credenciales invalidas." },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return Response.json(
      {
        mensaje: "Login correcto.",
        token,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { mensaje: "Error al iniciar sesion.", error: error.message },
      { status: 500 }
    );
  }
}
