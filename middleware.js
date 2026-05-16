import { NextResponse } from "next/server";

const rutasPrivadas = ["/canciones", "/artistas", "/generos", "/favoritos"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const esRutaPrivada = rutasPrivadas.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );

  if (!esRutaPrivada) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/canciones/:path*", "/artistas/:path*", "/generos/:path*", "/favoritos/:path*"],
};
