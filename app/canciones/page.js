"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";

const FAVORITOS_KEY = "favoritos";
const cancionInicial = { nombre: "", anio: "", descripcion: "", artista: "", genero: "" };

function leerCookie(nombre) {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${nombre}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

function leerJSONLocalStorage(clave, valorInicial) {
  if (typeof window === "undefined") return valorInicial;
  try {
    return JSON.parse(localStorage.getItem(clave)) || valorInicial;
  } catch {
    return valorInicial;
  }
}

function decodificarJWT(token) {
  if (!token) return null;
  try {
    return JSON.parse(window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export default function CancionesPage() {
  const [token] = useState(() => leerCookie("token"));
  const [usuario] = useState(() => decodificarJWT(leerCookie("token")));
  const [canciones, setCanciones] = useState([]);
  const [artistas, setArtistas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [favoritos, setFavoritos] = useState(() => leerJSONLocalStorage(FAVORITOS_KEY, []));
  const [busqueda, setBusqueda] = useState("");
  const [genero, setGenero] = useState("");
  const [formulario, setFormulario] = useState(cancionInicial);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const esAdmin = usuario?.rol === "admin";

  async function cargarDatos() {
    setCargando(true);
    try {
      const [cancionesRes, artistasRes, generosRes] = await Promise.all([
        fetch("/api/canciones"),
        fetch("/api/artistas"),
        fetch("/api/generos"),
      ]);
      const [cancionesData, artistasData, generosData] = await Promise.all([
        cancionesRes.json(),
        artistasRes.json(),
        generosRes.json(),
      ]);
      setCanciones(cancionesData.canciones || []);
      setArtistas(artistasData.artistas || []);
      setGeneros(generosData.generos || []);
    } catch {
      setMensaje("No se pudieron cargar las canciones.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(cargarDatos, 0);
    return () => window.clearTimeout(id);
  }, []);

  const cancionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return canciones.filter((cancion) => {
      const coincideTexto = !texto || cancion.nombre.toLowerCase().includes(texto);
      const coincideGenero = !genero || cancion.genero?._id === genero;
      return coincideTexto && coincideGenero;
    });
  }, [canciones, busqueda, genero]);

  function alternarFavorito(cancion) {
    const existe = favoritos.some((favorito) => favorito._id === cancion._id);
    const nuevosFavoritos = existe
      ? favoritos.filter((favorito) => favorito._id !== cancion._id)
      : [...favoritos, cancion];
    setFavoritos(nuevosFavoritos);
    localStorage.setItem(FAVORITOS_KEY, JSON.stringify(nuevosFavoritos));
    window.dispatchEvent(new Event("favoritos-actualizados"));
  }

  function abrirCrear() {
    if (!esAdmin) return;
    setFormulario(cancionInicial);
    setModalCrear(true);
  }

  async function crearCancion(event) {
    event.preventDefault();
    if (!esAdmin) return;
    const respuesta = await fetch("/api/canciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formulario),
    });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(data.mensaje || "No se pudo crear la cancion.");
      return;
    }
    setFormulario(cancionInicial);
    setModalCrear(false);
    await cargarDatos();
  }

  function abrirEditar(cancion) {
    if (!esAdmin) return;
    setFormulario({
      _id: cancion._id,
      nombre: cancion.nombre || "",
      anio: cancion.anio || "",
      descripcion: cancion.descripcion || "",
      artista: cancion.artista?._id || "",
      genero: cancion.genero?._id || "",
    });
    setModalEditar(true);
  }

  async function guardarCambios(event) {
    event.preventDefault();
    if (!esAdmin) return;
    const id = formulario._id;
    const datos = {
      nombre: formulario.nombre,
      anio: formulario.anio,
      descripcion: formulario.descripcion,
      artista: formulario.artista,
      genero: formulario.genero,
    };
    const respuesta = await fetch(`/api/canciones?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(datos),
    });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(data.mensaje || "No se pudo editar la cancion.");
      return;
    }
    setCanciones((lista) => lista.map((item) => (item._id === id ? data.cancion : item)));
    setFormulario(cancionInicial);
    setModalEditar(false);
  }

  async function borrarCancion(cancion) {
    if (!esAdmin) return;
    if (!confirm(`Seguro que quieres borrar "${cancion.nombre}"?`)) return;

    const respuesta = await fetch(`/api/canciones?id=${cancion._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(data.mensaje || "No se pudo borrar la cancion.");
      return;
    }
    setCanciones((lista) => lista.filter((item) => item._id !== cancion._id));
  }

  function renderFormulario({ titulo, onSubmit, textoBoton }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4">
        <form onSubmit={onSubmit} className="max-h-[90vh] w-[95%] max-w-2xl overflow-auto rounded-lg bg-white p-4 shadow-xl md:w-full md:p-6">
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input value={formulario.nombre || ""} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} className="rounded-md border px-3 py-2 text-sm" placeholder="Nombre" />
            <input value={formulario.anio || ""} onChange={(e) => setFormulario({ ...formulario, anio: e.target.value })} className="rounded-md border px-3 py-2 text-sm" placeholder="Anio" />
            <select value={formulario.artista || ""} onChange={(e) => setFormulario({ ...formulario, artista: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
              <option value="">Artista</option>
              {artistas.map((artista) => <option key={artista._id} value={artista._id}>{artista.nombre}</option>)}
            </select>
            <select value={formulario.genero || ""} onChange={(e) => setFormulario({ ...formulario, genero: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
              <option value="">Genero</option>
              {generos.map((item) => <option key={item._id} value={item._id}>{item.nombre}</option>)}
            </select>
            <textarea value={formulario.descripcion || ""} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} className="min-h-28 rounded-md border px-3 py-2 text-sm md:col-span-2" placeholder="Descripcion" />
          </div>
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
      <main className="mx-auto w-full max-w-7xl p-4 md:p-8">
        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Canciones</h1>
            <p className="mt-2 text-zinc-600">Busca por nombre, filtra por genero y guarda favoritos.</p>
          </div>
          {esAdmin && <button onClick={abrirCrear} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">+ Crear Cancion</button>}
        </section>

        <section className="mb-6 grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 md:grid-cols-2">
          <input value={busqueda || ""} onChange={(e) => setBusqueda(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Buscar cancion" />
          <select value={genero || ""} onChange={(e) => setGenero(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Todos los generos</option>
            {generos.map((item) => <option key={item._id} value={item._id}>{item.nombre}</option>)}
          </select>
        </section>

        {mensaje && <p className="mb-5 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{mensaje}</p>}

        {cargando ? (
          <p className="py-10 text-center text-sm text-zinc-500">Cargando canciones...</p>
        ) : (
          <section className="space-y-3">
            {cancionesFiltradas.map((cancion) => {
              const esFavorita = favoritos.some((favorito) => favorito._id === cancion._id);
              return (
                <article
                  key={cancion._id}
                  onClick={() => setDetalle(cancion)}
                  className="flex cursor-pointer flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap"
                >
                  <div className="min-w-0 sm:flex-[1.4_1_220px]">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Cancion</p>
                    <h2 className="truncate text-xl font-semibold">{cancion.nombre}</h2>
                  </div>
                  <div className="min-w-0 sm:flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Artista</p>
                    <p className="truncate text-sm font-medium text-zinc-700">{cancion.artista?.nombre || "Sin artista"}</p>
                  </div>
                  <div className="min-w-0 sm:flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Genero</p>
                    <p className="truncate text-sm font-medium text-zinc-700">{cancion.genero?.nombre || "Sin genero"}</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:ml-auto" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => alternarFavorito(cancion)} className="flex h-10 w-10 items-center justify-center rounded-md border text-lg hover:bg-zinc-100" aria-label="Alternar favorito">
                      {esFavorita ? "★" : "⭐"}
                    </button>
                    {esAdmin && (
                      <>
                        <button onClick={() => abrirEditar(cancion)} className="rounded-md border px-3 py-1.5 text-sm">Editar</button>
                        <button onClick={() => borrarCancion(cancion)} className="rounded-md border px-3 py-1.5 text-sm text-red-700">Borrar</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {esAdmin && modalCrear && renderFormulario({ titulo: "Crear cancion", onSubmit: crearCancion, textoBoton: "Guardar" })}

        {detalle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4">
            <div className="max-h-[90vh] w-[95%] max-w-2xl overflow-auto rounded-lg bg-white p-4 shadow-xl md:w-full md:p-6">
              <h2 className="text-3xl font-semibold">{detalle.nombre}</h2>
              <p className="mt-3 text-zinc-600">Anio: {detalle.anio}</p>
              <p className="mt-2 text-zinc-600">Artista: {detalle.artista?.nombre || "Sin artista"}</p>
              <p className="mt-2 text-zinc-600">Genero: {detalle.genero?.nombre || "Sin genero"}</p>
              <p className="mt-5 leading-7 text-zinc-700">{detalle.descripcion}</p>
              <p className="mt-4 text-xs text-zinc-400">ID: {detalle._id}</p>
              <button onClick={() => setDetalle(null)} className="mt-6 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">Cerrar</button>
            </div>
          </div>
        )}

        {esAdmin && modalEditar && renderFormulario({ titulo: "Editar cancion", onSubmit: guardarCambios, textoBoton: "Guardar cambios" })}
      </main>
    </div>
  );
}
