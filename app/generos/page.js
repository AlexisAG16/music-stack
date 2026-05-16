"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";

const generoInicial = { nombre: "", descripcion: "" };

function leerCookie(nombre) {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${nombre}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

function decodificarJWT(token) {
  if (!token) return null;
  try {
    return JSON.parse(window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export default function GenerosPage() {
  const [token] = useState(() => leerCookie("token"));
  const [usuario] = useState(() => decodificarJWT(leerCookie("token")));
  const [generos, setGeneros] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState(generoInicial);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const esAdmin = usuario?.rol === "admin";

  async function cargarGeneros() {
    setCargando(true);
    try {
      const respuesta = await fetch("/api/generos");
      const data = await respuesta.json();
      setGeneros(data.generos || []);
    } catch {
      setMensaje("No se pudieron cargar los generos.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(cargarGeneros, 0);
    return () => window.clearTimeout(id);
  }, []);

  const generosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return generos.filter((genero) => genero.nombre.toLowerCase().includes(texto));
  }, [generos, busqueda]);

  function abrirCrear() {
    if (!esAdmin) return;
    setFormulario(generoInicial);
    setModalCrear(true);
  }

  async function crearGenero(event) {
    event.preventDefault();
    if (!esAdmin) return;
    const respuesta = await fetch("/api/generos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formulario),
    });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(data.mensaje || "No se pudo crear el genero.");
      return;
    }
    setFormulario(generoInicial);
    setModalCrear(false);
    await cargarGeneros();
  }

  function abrirEditar(genero) {
    if (!esAdmin) return;
    setFormulario({
      _id: genero._id,
      nombre: genero.nombre || "",
      descripcion: genero.descripcion || "",
    });
    setModalEditar(true);
  }

  async function guardarCambios(event) {
    event.preventDefault();
    if (!esAdmin) return;
    const id = formulario._id;
    const datos = { nombre: formulario.nombre, descripcion: formulario.descripcion };
    const respuesta = await fetch(`/api/generos?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(datos),
    });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(data.mensaje || "No se pudo editar el genero.");
      return;
    }
    setGeneros((lista) => lista.map((item) => (item._id === id ? data.genero : item)));
    setFormulario(generoInicial);
    setModalEditar(false);
  }

  async function borrarGenero(genero) {
    if (!esAdmin) return;
    if (!confirm(`Seguro que quieres borrar "${genero.nombre}"?`)) return;

    const respuesta = await fetch(`/api/generos?id=${genero._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(data.mensaje || "No se pudo borrar el genero.");
      return;
    }
    setGeneros((lista) => lista.filter((item) => item._id !== genero._id));
  }

  function renderFormulario({ titulo, onSubmit, textoBoton }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
        <form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <input value={formulario.nombre || ""} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} className="mt-5 w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre" />
          <textarea value={formulario.descripcion || ""} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} className="mt-3 min-h-28 w-full rounded-md border px-3 py-2 text-sm" placeholder="Descripcion" />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => { setModalCrear(false); setModalEditar(false); }} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{textoBoton}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-5 py-8">
        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Generos</h1>
            <p className="mt-2 text-zinc-600">Explora generos musicales por nombre.</p>
          </div>
          {esAdmin && (
            <button onClick={abrirCrear} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              + Crear Genero
            </button>
          )}
        </section>

        <input
          value={busqueda || ""}
          onChange={(event) => setBusqueda(event.target.value)}
          className="mb-6 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          placeholder="Buscar genero"
        />

        {mensaje && <p className="mb-5 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{mensaje}</p>}

        {cargando ? (
          <p className="py-10 text-center text-sm text-zinc-500">Cargando generos...</p>
        ) : (
          <section className="space-y-3">
            {generosFiltrados.map((genero) => (
              <article
                key={genero._id}
                onClick={() => setDetalle(genero)}
                className="grid cursor-pointer gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm lg:grid-cols-[minmax(180px,260px)_1fr_auto]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Genero</p>
                  <h2 className="truncate text-xl font-semibold">{genero.nombre}</h2>
                </div>
                <p className="text-sm leading-6 text-zinc-600 lg:pr-6">{genero.descripcion}</p>
                {esAdmin && (
                  <div className="flex items-center gap-2 lg:justify-end" onClick={(event) => event.stopPropagation()}>
                    <button onClick={() => abrirEditar(genero)} className="rounded-md border px-3 py-1.5 text-sm">
                      Editar
                    </button>
                    <button onClick={() => borrarGenero(genero)} className="rounded-md border px-3 py-1.5 text-sm text-red-700">
                      Borrar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}

        {esAdmin && modalCrear && renderFormulario({ titulo: "Crear genero", onSubmit: crearGenero, textoBoton: "Guardar" })}

        {detalle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
            <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-3xl font-semibold">{detalle.nombre}</h2>
              <p className="mt-4 leading-7 text-zinc-600">{detalle.descripcion}</p>
              <p className="mt-4 text-xs text-zinc-400">ID: {detalle._id}</p>
              <button onClick={() => setDetalle(null)} className="mt-6 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {esAdmin && modalEditar && renderFormulario({ titulo: "Editar genero", onSubmit: guardarCambios, textoBoton: "Guardar cambios" })}
      </main>
    </div>
  );
}
