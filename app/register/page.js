"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
  });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  function manejarCambio(event) {
    const { name, value } = event.target;
    setFormulario((valores) => ({ ...valores, [name]: value }));
  }

  async function manejarEnvio(event) {
    event.preventDefault();
    setCargando(true);
    setErrores({});
    setMensaje("");

    try {
      const respuesta = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        setErrores(data.errores || {});
        setMensaje(data.mensaje || "No se pudo completar el registro.");
        return;
      }

      router.push("/login");
    } catch {
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Music Stack
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Crear cuenta</h1>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-zinc-800">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formulario.nombre}
              onChange={manejarCambio}
              className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
            {errores.nombre && <p className="mt-2 text-sm text-red-600">{errores.nombre}</p>}
          </div>

          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-zinc-800">
              Correo
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={formulario.correo}
              onChange={manejarCambio}
              className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
            {errores.correo && <p className="mt-2 text-sm text-red-600">{errores.correo}</p>}
          </div>

          <div>
            <label htmlFor="contrasena" className="block text-sm font-medium text-zinc-800">
              Contraseña
            </label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              value={formulario.contrasena}
              onChange={manejarCambio}
              className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
            {errores.contrasena && (
              <p className="mt-2 text-sm text-red-600">{errores.contrasena}</p>
            )}
          </div>

          {mensaje && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{mensaje}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cargando ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
