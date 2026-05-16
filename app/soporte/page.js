"use client";

import Navbar from "@/components/Navbar";

const faqs = [
  {
    pregunta: "Como entro al catalogo?",
    respuesta: "Debes iniciar sesion. El middleware protege canciones, artistas, generos y favoritos.",
  },
  {
    pregunta: "Como guardo favoritos?",
    respuesta: "En la pagina de canciones, presiona la estrella de una tarjeta. El Navbar los mostrara en su modal.",
  },
  {
    pregunta: "Quien puede crear contenido?",
    respuesta: "Solo los usuarios con rol admin ven los botones de creacion y pueden enviar formularios.",
  },
  {
    pregunta: "Por que no veo acciones admin?",
    respuesta: "Tu token debe incluir rol admin. Si no lo incluye, navegaras como usuario regular.",
  },
];

export default function SoportePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-5 py-12">
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Soporte
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Preguntas frecuentes</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            Una guia rapida para entender las reglas principales de Music Stack.
          </p>
        </section>

        <section className="space-y-4">
          {faqs.map((faq) => (
            <article key={faq.pregunta} className="rounded-lg border border-zinc-200 bg-white p-5">
              <h2 className="font-semibold">{faq.pregunta}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{faq.respuesta}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
