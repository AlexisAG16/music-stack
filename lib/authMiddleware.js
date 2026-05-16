import jwt from "jsonwebtoken";

function obtenerToken(request) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }

  return (
    request.cookies?.get("token")?.value ||
    request.cookies?.get("authToken")?.value ||
    request.cookies?.get("jwt")?.value ||
    null
  );
}

export function verificarToken(request) {
  const token = obtenerToken(request);

  if (!token) {
    return {
      autorizado: false,
      status: 401,
      mensaje: "Token no proporcionado.",
      usuario: null,
    };
  }

  if (!process.env.JWT_SECRET) {
    return {
      autorizado: false,
      status: 500,
      mensaje: "JWT_SECRET no esta configurado.",
      usuario: null,
    };
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    return {
      autorizado: true,
      status: 200,
      mensaje: "Token valido.",
      usuario,
    };
  } catch {
    return {
      autorizado: false,
      status: 401,
      mensaje: "Token invalido o expirado.",
      usuario: null,
    };
  }
}

export function verificarAdmin(request) {
  const auth = verificarToken(request);

  if (!auth.autorizado) {
    return auth;
  }

  if (auth.usuario?.rol !== "admin") {
    return {
      autorizado: false,
      status: 403,
      mensaje: "No autorizado. Se requiere rol admin.",
      usuario: auth.usuario,
    };
  }

  return auth;
}
