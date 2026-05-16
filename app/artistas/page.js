"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";

const inicial = {
  nombre: "",
  imagen: "",
  imagenActual: "",
  pais: "",
  esGrupo: false,
  numeroIntegrantes: 2,
  tieneGrupo: "",
  estaVivo: true,
  edad: "",
  sexo: "",
  generoMusical: "",
  biografia: "",
};

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

function normalizarUrlImagen(valor) {
  const limpia = String(valor || "").trim();
  if (!limpia) return "";
  if (limpia.startsWith("data:image/")) return limpia;
  if (/^https?:\/\//i.test(limpia)) return limpia;
  return `https://${limpia}`;
}

export default function ArtistasPage() {
  const [token] = useState(() => leerCookie("token"));
  const [usuario] = useState(() => decodificarJWT(leerCookie("token")));
  const [vista, setVista] = useState("solistas");
  const [artistas, setArtistas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [form, setForm] = useState(inicial);
  const [modoImagen, setModoImagen] = useState("archivo");
  const [errorImagen, setErrorImagen] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    texto: "",
    sexo: "",
    genero: "",
    pais: "",
    banda: "todos",
    vida: "todos",
    tamano: "todos",
  });
  const esAdmin = usuario?.rol === "admin";

  async function cargarDatos() {
    setCargando(true);
    try {
      const [artistasRes, generosRes] = await Promise.all([fetch("/api/artistas"), fetch("/api/generos")]);
      const [artistasData, generosData] = await Promise.all([artistasRes.json(), generosRes.json()]);
      setArtistas(artistasData.artistas || []);
      setGeneros(generosData.generos || []);
    } catch {
      setMensaje("No se pudieron cargar los artistas.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(cargarDatos, 0);
    return () => window.clearTimeout(id);
  }, []);

  const grupos = useMemo(() => artistas.filter((a) => a.esGrupo), [artistas]);
  const solistas = useMemo(() => artistas.filter((a) => !a.esGrupo), [artistas]);
  const paises = useMemo(() => {
    return [...new Set(artistas.map((a) => a.pais).filter(Boolean))].sort();
  }, [artistas]);

  const listaFiltrada = useMemo(() => {
    const texto = filtros.texto.trim().toLowerCase();
    const base = vista === "solistas" ? solistas : grupos;
    return base.filter((item) => {
      const coincideTexto = !texto || item.nombre.toLowerCase().includes(texto);
      const coincideGenero = !filtros.genero || item.generoMusical?._id === filtros.genero;
      const coincidePais = !filtros.pais || item.pais === filtros.pais;

      if (vista === "solistas") {
        const coincideSexo = !filtros.sexo || item.sexo === filtros.sexo;
        const coincideVida =
          filtros.vida === "todos" ||
          (filtros.vida === "vivos" && item.estaVivo !== false) ||
          (filtros.vida === "no-vivos" && item.estaVivo === false);
        const coincideBanda =
          filtros.banda === "todos" ||
          (filtros.banda === "con" && item.tieneGrupo) ||
          (filtros.banda === "sin" && !item.tieneGrupo);
        return coincideTexto && coincideGenero && coincidePais && coincideSexo && coincideVida && coincideBanda;
      }

      const n = item.numeroIntegrantes || 0;
      const coincideTamano =
        filtros.tamano === "todos" ||
        (filtros.tamano === "duos" && n === 2) ||
        (filtros.tamano === "trios" && n === 3) ||
        (filtros.tamano === "grandes" && n >= 4);
      return coincideTexto && coincideGenero && coincidePais && coincideTamano;
    });
  }, [vista, solistas, grupos, filtros]);

  function abrirCrear(tipo) {
    if (!esAdmin) return;
    setForm({ ...inicial, esGrupo: tipo === "grupo", numeroIntegrantes: tipo === "grupo" ? 2 : 1 });
    setModoImagen("archivo");
    setErrorImagen(false);
    setModalCrear(true);
  }

  function abrirEditar(artista) {
    if (!esAdmin) return;
    setForm({
      _id: artista._id,
      nombre: artista.nombre || "",
      imagen: "",
      imagenActual: artista.imagen || "",
      pais: artista.pais || "",
      esGrupo: Boolean(artista.esGrupo),
      numeroIntegrantes: artista.numeroIntegrantes || (artista.esGrupo ? 2 : 1),
      tieneGrupo: artista.tieneGrupo?._id || "",
      estaVivo: artista.estaVivo !== false,
      edad: artista.edad || "",
      sexo: artista.sexo || "",
      generoMusical: artista.generoMusical?._id || "",
      biografia: artista.biografia || "",
    });
    setModoImagen("archivo");
    setErrorImagen(false);
    setModalEditar(true);
  }

  function normalizarDatos() {
    const datos = { ...form, esGrupo: Boolean(form.esGrupo), estaVivo: Boolean(form.estaVivo) };
    delete datos._id;
    delete datos.imagenActual;
    datos.imagen = normalizarUrlImagen(datos.imagen);
    if (datos.esGrupo) {
      datos.numeroIntegrantes = Number(datos.numeroIntegrantes);
      datos.tieneGrupo = "";
      datos.estaVivo = true;
      delete datos.edad;
      delete datos.sexo;
    } else {
      datos.numeroIntegrantes = 1;
      if (!datos.tieneGrupo) datos.tieneGrupo = "";
      if (!datos.estaVivo) delete datos.edad;
    }
    return datos;
  }

  function cambiarModoImagen(modo) {
    setModoImagen(modo);
    setErrorImagen(false);
    setForm((valores) => ({ ...valores, imagen: "" }));
  }

  function procesarArchivoImagen(event) {
    const archivo = event.target.files?.[0];

    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      setErrorImagen(false);
      setForm((valores) => ({ ...valores, imagen: reader.result || "" }));
    };
    reader.readAsDataURL(archivo);
  }

  async function guardar(event) {
    event.preventDefault();
    if (!esAdmin) return;
    const editando = Boolean(form._id);
    const url = editando ? `/api/artistas?id=${form._id}` : "/api/artistas";
    const respuesta = await fetch(url, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(normalizarDatos()),
    });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setMensaje(data.mensaje || "No se pudo guardar el artista.");
      return;
    }
    if (editando) {
      setArtistas((lista) => lista.map((item) => (item._id === form._id ? data.artista : item)));
      setModalEditar(false);
    } else {
      setArtistas((lista) => [...lista, data.artista]);
      setModalCrear(false);
    }
    setForm(inicial);
  }

  async function borrar(artista) {
    if (!esAdmin) return;
    if (!confirm(`Seguro que quieres borrar "${artista.nombre}"?`)) return;
    const respuesta = await fetch(`/api/artistas?id=${artista._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!respuesta.ok) {
      const data = await respuesta.json();
      setMensaje(data.mensaje || "No se pudo borrar el artista.");
      return;
    }
    setArtistas((lista) => lista.filter((item) => item._id !== artista._id));
  }

  function renderFormulario(titulo) {
    const vistaPrevia = normalizarUrlImagen(form.imagen) || form.imagenActual;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4">
        <form onSubmit={guardar} className="max-h-[90vh] w-[95%] max-w-3xl overflow-auto rounded-lg bg-white p-4 shadow-xl md:w-full md:p-6">
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="rounded-md border px-3 py-2 text-sm" placeholder="Nombre" />
            <input value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} className="rounded-md border px-3 py-2 text-sm" placeholder="Pais" />
            <div className="rounded-md border border-zinc-200 p-4 md:col-span-2">
              <p className="text-sm font-medium text-zinc-800">Imagen opcional</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => cambiarModoImagen("archivo")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${modoImagen === "archivo" ? "bg-zinc-950 text-white" : "border bg-white text-zinc-700"}`}
                >
                  Archivo Local
                </button>
                <button
                  type="button"
                  onClick={() => cambiarModoImagen("url")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${modoImagen === "url" ? "bg-zinc-950 text-white" : "border bg-white text-zinc-700"}`}
                >
                  URL Externa
                </button>
              </div>

              {modoImagen === "archivo" ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={procesarArchivoImagen}
                  className="mt-4 block w-full rounded-md border px-3 py-2 text-sm"
                />
              ) : (
                <input
                  value={form.imagen || ""}
                  onChange={(e) =>
                    setForm((valores) => ({ ...valores, imagen: e.target.value || "" }))
                  }
                  onBlur={(e) => {
                    setErrorImagen(false);
                    setForm((valores) => ({ ...valores, imagen: normalizarUrlImagen(e.target.value) }));
                  }}
                  className="mt-4 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              )}

              {vistaPrevia && (
                <div className="mt-4 overflow-hidden rounded-md border bg-zinc-100">
                  {errorImagen ? (
                    <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-zinc-500">
                      No se pudo cargar la imagen. Revisa que la URL sea publica y apunte directo a una imagen.
                    </div>
                  ) : (
                    <img
                      key={vistaPrevia}
                      src={vistaPrevia}
                      alt="Vista previa"
                      className="h-40 w-full object-cover"
                      onLoad={() => setErrorImagen(false)}
                      onError={() => setErrorImagen(true)}
                    />
                  )}
                </div>
              )}
            </div>
            <select value={form.generoMusical} onChange={(e) => setForm({ ...form, generoMusical: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
              <option value="">Genero musical</option>
              {generos.map((g) => <option key={g._id} value={g._id}>{g.nombre}</option>)}
            </select>
            {form.esGrupo ? (
              <input type="number" min="2" value={form.numeroIntegrantes} onChange={(e) => setForm({ ...form, numeroIntegrantes: e.target.value })} className="rounded-md border px-3 py-2 text-sm" placeholder="Cantidad de integrantes" />
            ) : (
              <>
                <select value={form.tieneGrupo} onChange={(e) => setForm({ ...form, tieneGrupo: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
                  <option value="">No pertenece a ningun grupo</option>
                  {grupos.map((g) => <option key={g._id} value={g._id}>{g.nombre}</option>)}
                </select>
                <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
                  <option value="">Sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
                <select value={form.estaVivo ? "true" : "false"} onChange={(e) => setForm({ ...form, estaVivo: e.target.value === "true", edad: e.target.value === "true" ? form.edad : "" })} className="rounded-md border px-3 py-2 text-sm">
                  <option value="true">Esta vivo</option>
                  <option value="false">No esta vivo</option>
                </select>
                {form.estaVivo && <input type="number" min="1" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} className="rounded-md border px-3 py-2 text-sm" placeholder="Edad" />}
              </>
            )}
            <textarea value={form.biografia} onChange={(e) => setForm({ ...form, biografia: e.target.value })} className="min-h-28 rounded-md border px-3 py-2 text-sm md:col-span-2" placeholder="Biografia" />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => { setModalCrear(false); setModalEditar(false); }} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Guardar</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl p-4 md:p-8">
        <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Artistas</h1>
            <p className="mt-2 text-zinc-600">Administra solistas y grupos con relaciones reales.</p>
          </div>
          {esAdmin && <button onClick={() => abrirCrear(vista === "solistas" ? "solista" : "grupo")} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">+ Crear {vista === "solistas" ? "Solista" : "Grupo"}</button>}
        </section>

        <div className="mb-6 flex gap-2">
          <button onClick={() => setVista("solistas")} className={`rounded-md px-4 py-2 text-sm font-semibold ${vista === "solistas" ? "bg-zinc-950 text-white" : "border bg-white"}`}>Ver Solistas</button>
          <button onClick={() => setVista("grupos")} className={`rounded-md px-4 py-2 text-sm font-semibold ${vista === "grupos" ? "bg-zinc-950 text-white" : "border bg-white"}`}>Ver Grupos</button>
        </div>

        <section className="mb-6 grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 md:grid-cols-3 xl:grid-cols-6">
          <input value={filtros.texto} onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })} className="rounded-md border px-3 py-2 text-sm" placeholder="Buscar por nombre" />
          <select value={filtros.genero} onChange={(e) => setFiltros({ ...filtros, genero: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Todos los generos</option>
            {generos.map((g) => <option key={g._id} value={g._id}>{g.nombre}</option>)}
          </select>
          <select value={filtros.pais} onChange={(e) => setFiltros({ ...filtros, pais: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Todos los paises</option>
            {paises.map((pais) => <option key={pais} value={pais}>{pais}</option>)}
          </select>
          {vista === "solistas" ? (
            <>
              <select value={filtros.sexo} onChange={(e) => setFiltros({ ...filtros, sexo: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
                <option value="">Todos los sexos</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
              <select value={filtros.vida} onChange={(e) => setFiltros({ ...filtros, vida: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
                <option value="todos">Todos</option>
                <option value="vivos">Vivos</option>
                <option value="no-vivos">No vivos</option>
              </select>
              <select value={filtros.banda} onChange={(e) => setFiltros({ ...filtros, banda: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
                <option value="todos">Todos</option>
                <option value="con">Con Banda vinculada</option>
                <option value="sin">Solistas Independientes</option>
              </select>
            </>
          ) : (
            <select value={filtros.tamano} onChange={(e) => setFiltros({ ...filtros, tamano: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              <option value="duos">Duos</option>
              <option value="trios">Trios</option>
              <option value="grandes">Bandas Grandes</option>
            </select>
          )}
        </section>

        {mensaje && <p className="mb-5 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{mensaje}</p>}
        {cargando ? <p className="py-10 text-center text-sm text-zinc-500">Cargando artistas...</p> : (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listaFiltrada.map((a) => (
              <article key={a._id} onClick={() => setDetalle(a)} className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
                <h2 className="text-2xl font-semibold">{a.nombre}</h2>
                <div className="my-4 aspect-[16/10] overflow-hidden rounded-md bg-zinc-100">
                  <img src={a.imagen || "https://placehold.co/600x600?text=Artista"} alt={a.nombre} className="h-full w-full object-cover" />
                </div>
                <p className="text-sm text-zinc-600">{a.pais} · {a.generoMusical?.nombre || "Sin genero"}</p>
                {a.esGrupo ? (
                  <p className="mt-2 text-sm font-medium">Integrantes: {a.numeroIntegrantes}</p>
                ) : (
                  <p className="mt-2 text-sm font-medium">Banda: {a.tieneGrupo ? <span className="text-emerald-700">{a.tieneGrupo.nombre}</span> : "Ninguna"}</p>
                )}
                {esAdmin && (
                  <div className="mt-5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => abrirEditar(a)} className="rounded-md border px-3 py-1.5 text-sm">Editar</button>
                    <button onClick={() => borrar(a)} className="rounded-md border px-3 py-1.5 text-sm text-red-700">Borrar</button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}

        {esAdmin && modalCrear && renderFormulario(`Crear ${form.esGrupo ? "grupo" : "solista"}`)}
        {esAdmin && modalEditar && renderFormulario(`Editar ${form.esGrupo ? "grupo" : "solista"}`)}
        {detalle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4">
            <div className="max-h-[90vh] w-[95%] max-w-2xl overflow-auto rounded-lg bg-white p-4 shadow-xl md:w-full md:p-6">
              <h2 className="text-3xl font-semibold">{detalle.nombre}</h2>
              <img src={detalle.imagen || "https://placehold.co/600x600?text=Artista"} alt={detalle.nombre} className="mt-5 aspect-video w-full rounded-md object-cover" />
              <p className="mt-4 text-zinc-600">Pais: {detalle.pais}</p>
              <p className="mt-2 text-zinc-600">Genero: {detalle.generoMusical?.nombre || "Sin genero"}</p>
              {detalle.esGrupo ? (
                <p className="mt-2 text-zinc-600">Integrantes: {detalle.numeroIntegrantes}</p>
              ) : (
                <>
                  <p className="mt-2 text-zinc-600">Sexo: {detalle.sexo}</p>
                  <p className="mt-2 text-zinc-600">Estado: {detalle.estaVivo ? `Vivo · ${detalle.edad} anios` : "No vivo"}</p>
                  <p className="mt-2 text-zinc-600">Banda: {detalle.tieneGrupo?.nombre || "Ninguna"}</p>
                </>
              )}
              <p className="mt-5 leading-7 text-zinc-700">{detalle.biografia}</p>
              <button onClick={() => setDetalle(null)} className="mt-6 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
