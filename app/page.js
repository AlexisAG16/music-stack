"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const accesosPublicos = [
  {
    href: "/nosotros",
    titulo: "Nosotros",
    texto: "Conoce el proposito de Music Stack y como organizamos el catalogo.",
  },
  {
    href: "/contacto",
    titulo: "Contacto",
    texto: "Escribenos para consultas, sugerencias o soporte del proyecto.",
  },
  {
    href: "/soporte",
    titulo: "Soporte",
    texto: "Encuentra ayuda para navegar la app y resolver dudas frecuentes.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Catalogo musical full stack
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Descubre canciones, artistas y generos en una experiencia simple y segura.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Music Stack separa el contenido publico de las secciones privadas para que
              puedas explorar la propuesta, iniciar sesion y administrar el catalogo con
              permisos claros.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Crear cuenta
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Que puedes hacer</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-md border border-zinc-100 bg-zinc-50 p-4">
                <p className="font-medium">Explorar informacion publica</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Accede a la landing, contacto, soporte y detalles del proyecto sin iniciar sesion.
                </p>
              </div>
              <div className="rounded-md border border-zinc-100 bg-zinc-50 p-4">
                <p className="font-medium">Entrar al catalogo protegido</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Las secciones de canciones, artistas, generos y favoritos requieren token activo.
                </p>
              </div>
              <div className="rounded-md border border-zinc-100 bg-zinc-50 p-4">
                <p className="font-medium">Administrar con rol admin</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Los formularios de creacion quedan reservados para usuarios administradores.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-10 md:grid-cols-3">
            {accesosPublicos.map((acceso) => (
              <Link
                key={acceso.href}
                href={acceso.href}
                className="rounded-lg border border-zinc-200 p-5 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <h2 className="text-lg font-semibold">{acceso.titulo}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{acceso.texto}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
