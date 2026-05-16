"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function ContactoPage() {
  const [mensaje, setMensaje] = useState("");

  function enviarContacto(event) {
    event.preventDefault();
    setMensaje("Gracias por contactarnos. Revisaremos tu mensaje pronto.");
    event.currentTarget.reset();
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Contacto
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hablemos de musica.</h1>
          <p className="mt-4 leading-7 text-zinc-600">
            Envia tus dudas, sugerencias o comentarios sobre la plataforma. Este formulario es
            una base visual lista para conectar con un endpoint cuando lo necesites.
          </p>
        </section>

        <form onSubmit={enviarContacto} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <input
              name="nombre"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Nombre"
            />
            <input
              name="email"
              type="email"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Email"
            />
            <textarea
              name="mensaje"
              className="min-h-36 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Mensaje"
            />
          </div>
          <button className="mt-5 rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            Enviar
          </button>
          {mensaje && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{mensaje}</p>}
        </form>
      </main>
    </div>
  );
}
