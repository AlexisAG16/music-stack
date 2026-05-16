"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const FAVORITOS_KEY = "favoritos";

const linksPublicos = [
  { href: "/", label: "Home" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
  { href: "/soporte", label: "Soporte" },
];

const linksPrivados = [
  { href: "/canciones", label: "Canciones" },
  { href: "/artistas", label: "Artistas" },
  { href: "/generos", label: "Generos" },
];

function leerCookie(nombre) {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${nombre}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

function leerJSONLocalStorage(clave, valorInicial) {
  if (typeof window === "undefined") return valorInicial;

  try {
    return JSON.parse(localStorage.getItem(clave)) || valorInicial;
  } catch {
    return valorInicial;
  }
}

function decodificarPayloadJWT(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  const isAdmin = usuario?.rol === "admin";

  useEffect(() => {
    function cargarEstadoVisual() {
      const token = leerCookie("token");
      const payload = decodificarPayloadJWT(token);
      const usuarioGuardado = leerJSONLocalStorage("usuario", null);

      setIsLoggedIn(Boolean(token));
      setUsuario(payload || usuarioGuardado);
      setFavoritos(leerJSONLocalStorage(FAVORITOS_KEY, []));
    }

    cargarEstadoVisual();
    window.addEventListener("focus", cargarEstadoVisual);
    window.addEventListener("favoritos-actualizados", cargarEstadoVisual);

    return () => {
      window.removeEventListener("focus", cargarEstadoVisual);
      window.removeEventListener("favoritos-actualizados", cargarEstadoVisual);
    };
  }, []);

  function logout() {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setIsLoggedIn(false);
    setUsuario(null);
    setModalAbierto(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="mr-2 text-lg font-semibold tracking-tight text-zinc-950">
            Music Stack
          </Link>

          {linksPublicos.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              {link.label}
            </Link>
          ))}

          {linksPrivados.map((link) =>
            isLoggedIn ? (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2.5 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.href}
                type="button"
                disabled
                className="cursor-not-allowed rounded-md px-2.5 py-2 text-sm font-medium text-zinc-400"
                title="Inicia sesion para acceder"
              >
                {link.label} 🔒
              </button>
            )
          )}
        </div>

        <div className="relative flex items-center gap-3 self-start lg:self-auto">
          {!isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Registrarse
              </Link>
            </>
          ) : (
            <>
              <span className="hidden text-sm font-medium text-zinc-700 sm:inline">
                {usuario?.nombre || "Usuario"}
                {isAdmin ? " · Admin" : ""}
              </span>
              <button
                type="button"
                onClick={() => setModalAbierto((abierto) => !abierto)}
                className="relative flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-lg transition hover:bg-zinc-100"
                aria-label="Favoritos"
              >
                ⭐
                {favoritos.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1 text-xs font-semibold text-white">
                    {favoritos.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
              >
                Cerrar Sesion
              </button>
            </>
          )}

          {modalAbierto && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-950">Favoritos</h2>
                <span className="text-xs text-zinc-500">{favoritos.length}</span>
              </div>

              {favoritos.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavia no agregaste canciones.</p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-auto">
                  {favoritos.map((cancion) => (
                    <li
                      key={cancion._id}
                      className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-zinc-950">{cancion.nombre}</p>
                      <p className="text-xs text-zinc-500">
                        {cancion.artista?.nombre || "Artista sin asignar"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
