import { useRef, useState, useEffect } from "react";
import axios from "axios";
import TablaProductos from "../components/TablaProductos";
import BotonAgregar from "../components/BotonAgregar";
import BotonExportar from "../components/BotonExportar";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import BotonAceptar from "../components/BotonAceptar";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import "bootstrap/dist/css/bootstrap.min.css";

const api = axios.create({
    baseURL: "http://localhost:8080/angora/api/v1",
    headers: { "Content-Type": "application/json" },
});

export const Inventario = () => {
    const [opcionSeleccionada, setOpcionSeleccionada] = useState("opcion1");
    const tablaProductosRef = useRef(null);
    const [modalAbiertaMateria, setModalAbiertaMateria] = useState(false);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
    const [materiaEliminar, setMateriaEliminar] = useState(null);
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const [modalLotesMateria, setModalLotesMateria] = useState(false);
    const [lotesMateriaSeleccionada, setLotesMateriaSeleccionada] = useState([]);
    const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] = useState(false);
    const [modalLoteAbierto, setModalLoteAbierto] = useState(false);
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [loteNuevo, setLoteNuevo] = useState({
        idLote: 0,
        idMateria: 0,
        costoUnitario: 0,
        cantidad: 0,
        cantidadDisponible: 0,
        fechaIngreso: new Date().toISOString().split('T')[0],
        idProveedor: null,
    });
    const [registrosMateria, setRegistrosMateria] = useState([]);
    const [lotesMateriaPrima, setLotesMateriaPrima] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [error, setError] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [materiasRes, lotesRes, proveedoresRes] = await Promise.all([
                    api.get("/materias"),
                    api.get("/lotes"),
                    api.get("/proveedores"),
                ]);
                setRegistrosMateria(materiasRes.data);
                setLotesMateriaPrima(lotesRes.data);
                setProveedores(proveedoresRes.data);
                localStorage.setItem("registrosMateria", JSON.stringify(materiasRes.data));
                localStorage.setItem("lotesMateriaPrima", JSON.stringify(lotesRes.data));
                localStorage.setItem("proveedores", JSON.stringify(proveedoresRes.data));
            } catch (err) {
                setError(err.response?.data?.message || "Error al conectar con el backend");
                const savedMaterias = localStorage.getItem("registrosMateria");
                const savedLotes = localStorage.getItem("lotesMateriaPrima");
                const savedProveedores = localStorage.getItem("proveedores");
                if (savedMaterias) setRegistrosMateria(JSON.parse(savedMaterias));
                if (savedLotes) setLotesMateriaPrima(JSON.parse(savedLotes));
                if (savedProveedores) setProveedores(JSON.parse(savedProveedores));
            }
        };
        fetchData();
    }, []);

    const manejarAgregar = () => {
        if (opcionSeleccionada === "opcion1") {
            tablaProductosRef.current?.abrirModalAgregar();
        } else {
            abrirModalAgregarMateria();
        }
    };

    const abrirModalAgregarMateria = () => {
        setMateriaSeleccionada(null);
        setModalAbiertaMateria(true);
    };

    const abrirModalEditarMateria = (dato) => {
        setMateriaSeleccionada(dato);
        setModalAbiertaMateria(true);
    };

    const abrirModalEliminarMateria = (dato) => {
        setMateriaEliminar(dato);
        setConfirmarEliminacion(true);
    };

    const abrirModalLotesMateria = (materia) => {
        const lotes = lotesMateriaPrima.filter((lote) => lote.idMateria === materia.idMateria);
        setLotesMateriaSeleccionada(lotes);
        setModalLotesMateria(true);
    };

    const abrirModalAgregarLote = (materia) => {
        setLoteSeleccionado(null);
        setLoteNuevo({
            idLote: lotesMateriaPrima.length > 0 ? Math.max(...lotesMateriaPrima.map((l) => l.idLote)) + 1 : 1,
            idMateria: materia.idMateria,
            costoUnitario: materia.costo,
            cantidad: 0,
            cantidadDisponible: 0,
            fechaIngreso: new Date().toISOString().split('T')[0],
            idProveedor: null,
        });
        setModalLoteAbierto(true);
    };

    const abrirModalEditarLote = (lote) => {
        setLoteSeleccionado(lote);
        setLoteNuevo({
            idLote: lote.idLote,
            idMateria: lote.idMateria,
            costoUnitario: lote.costoUnitario,
            cantidad: lote.cantidad,
            cantidadDisponible: lote.cantidadDisponible,
            fechaIngreso: lote.fechaIngreso,
            idProveedor: lote.idProveedor,
        });
        setModalLoteAbierto(true);
    };

    const guardarMateria = async (e) => {
        e.preventDefault();
        const datos = new FormData(e.target);
        const nueva = {
            idMateria: Number(datos.get("idMateria")),
            nombre: datos.get("nombre"),
            costo: Number(datos.get("costo")),
            venta: Number(datos.get("venta")),
            cantidad: Number(datos.get("cantidad")),
        };

        try {
            if (!materiaSeleccionada && registrosMateria.some((m) => m.idMateria === nueva.idMateria)) {
                setModalAdvertenciaIdDuplicado(true);
                return;
            }

            if (materiaSeleccionada) {
                await api.put(`/materias/${nueva.idMateria}`, nueva);
                setRegistrosMateria((prev) => prev.map((p) => (p.idMateria === nueva.idMateria ? nueva : p)));
            } else {
                await api.post("/materias", nueva);
                setRegistrosMateria((prev) => [...prev, nueva]);
                const nuevoLote = {
                    idLote: lotesMateriaPrima.length > 0 ? Math.max(...lotesMateriaPrima.map((l) => l.idLote)) + 1 : 1,
                    idMateria: nueva.idMateria,
                    costoUnitario: nueva.costo,
                    cantidad: nueva.cantidad,
                    cantidadDisponible: nueva.cantidad,
                    fechaIngreso: new Date().toISOString().split('T')[0],
                    idProveedor: null,
                };
                await api.post("/lotes", nuevoLote);
                setLotesMateriaPrima((prev) => [...prev, nuevoLote]);
            }
            localStorage.setItem("registrosMateria", JSON.stringify([...registrosMateria, ...(materiaSeleccionada ? [] : [nueva])]));
            localStorage.setItem("lotesMateriaPrima", JSON.stringify(lotesMateriaPrima));
            setModalAbiertaMateria(false);
            setMateriaSeleccionada(null);
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar la materia prima");
        }
    };

    const guardarLote = async (e) => {
        e.preventDefault();
        const nuevoLote = {
            idLote: Number(loteNuevo.idLote),
            idMateria: Number(loteNuevo.idMateria),
            costoUnitario: Number(loteNuevo.costoUnitario),
            cantidad: Number(loteNuevo.cantidad),
            cantidadDisponible: Number(loteNuevo.cantidadDisponible),
            fechaIngreso: loteNuevo.fechaIngreso,
            idProveedor: loteNuevo.idProveedor ? Number(loteNuevo.idProveedor) : null,
        };

        try {
            if (!loteSeleccionado && lotesMateriaPrima.some((l) => l.idLote === nuevoLote.idLote)) {
                setModalAdvertenciaIdDuplicado(true);
                return;
            }

            if (loteSeleccionado) {
                await api.put(`/lotes/${nuevoLote.idLote}`, nuevoLote);
                setLotesMateriaPrima((prev) => prev.map((l) => (l.idLote === nuevoLote.idLote ? nuevoLote : l)));
            } else {
                await api.post("/lotes", nuevoLote);
                setLotesMateriaPrima((prev) => [...prev, nuevoLote]);
            }

            // Actualizar cantidad total en registrosMateria
            const totalDisponible = lotesMateriaPrima
                .filter((l) => l.idMateria === nuevoLote.idMateria && l.idLote !== (loteSeleccionado?.idLote || 0))
                .reduce((sum, l) => sum + l.cantidadDisponible, 0) + nuevoLote.cantidadDisponible;
            const materiaActualizada = registrosMateria.find((m) => m.idMateria === nuevoLote.idMateria);
            if (materiaActualizada) {
                const updatedMateria = { ...materiaActualizada, cantidad: totalDisponible };
                await api.put(`/materias/${materiaActualizada.idMateria}`, updatedMateria);
                setRegistrosMateria((prev) =>
                    prev.map((m) => (m.idMateria === nuevoLote.idMateria ? updatedMateria : m))
                );
            }

            localStorage.setItem("lotesMateriaPrima", JSON.stringify([...lotesMateriaPrima, ...(loteSeleccionado ? [] : [nuevoLote])]));
            localStorage.setItem("registrosMateria", JSON.stringify(registrosMateria));
            setModalLoteAbierto(false);
            setLoteSeleccionado(null);
            setLoteNuevo({
                idLote: 0,
                idMateria: 0,
                costoUnitario: 0,
                cantidad: 0,
                cantidadDisponible: 0,
                fechaIngreso: new Date().toISOString().split('T')[0],
                idProveedor: null,
            });
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar el lote");
        }
    };

    const eliminarMateria = async () => {
        try {
            await api.delete(`/materias/${materiaEliminar.idMateria}`);
            setRegistrosMateria((prev) => prev.filter((p) => p.idMateria !== materiaEliminar.idMateria));
            setLotesMateriaPrima((prev) => prev.filter((l) => l.idMateria !== materiaEliminar.idMateria));
            localStorage.setItem("registrosMateria", JSON.stringify(registrosMateria.filter((p) => p.idMateria !== materiaEliminar.idMateria)));
            localStorage.setItem("lotesMateriaPrima", JSON.stringify(lotesMateriaPrima.filter((l) => l.idMateria !== materiaEliminar.idMateria)));
            setConfirmarEliminacion(false);
            setMateriaEliminar(null);
        } catch (err) {
            setError(err.response?.data?.message || "Error al eliminar la materia prima");
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === "N/A") return "N/A";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    return (
        <main className='main-home inventario'>
            <div className="container">
                <h2 className='inventario'>Inventarios</h2>
            </div>
            {error && (
                <Modal isOpen={!!error} onClose={() => setError(null)}>
                    <div className="encabezado-modal"><h2>Error</h2></div>
                    <p className="text-center">{error}</p>
                    <div className="pie-modal"><BotonAceptar onClick={() => setError(null)} /></div>
                </Modal>
            )}
            <div className="container inventario-div-checks">
                <BotonAgregar onClick={manejarAgregar} />
                <div className="inventario-div-checks d-flex gap-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkProductos"
                            checked={opcionSeleccionada === "opcion1"}
                            onChange={() => setOpcionSeleccionada("opcion1")}
                        />
                        <label className="form-check-label" htmlFor="checkProductos">Productos</label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkMateriaPrima"
                            checked={opcionSeleccionada === "opcion2"}
                            onChange={() => setOpcionSeleccionada("opcion2")}
                        />
                        <label className="form-check-label" htmlFor="checkMateriaPrima">Materia Prima</label>
                    </div>
                </div>
                <BotonExportar />
            </div>
            {opcionSeleccionada === "opcion1" ? (
                <TablaProductos
                    ref={tablaProductosRef}
                    registrosMateria={registrosMateria}
                    lotesMateriaPrima={lotesMateriaPrima}
                    setRegistrosMateria={setRegistrosMateria}
                    setLotesMateriaPrima={setLotesMateriaPrima}
                    proveedores={proveedores}
                />
            ) : (
                <div className="container inventario">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Costo Unitario</th>
                                <th>Precio de Venta</th>
                                <th>Cantidad</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrosMateria.map((materia) => (
                                <tr key={materia.idMateria}>
                                    <td>{materia.idMateria}</td>
                                    <td>{materia.nombre}</td>
                                    <td>{formatCurrency(materia.costo)}</td>
                                    <td>{formatCurrency(materia.venta)}</td>
                                    <td>{materia.cantidad}</td>
                                    <td>
                                        <BotonEditar onClick={() => abrirModalEditarMateria(materia)}>Editar</BotonEditar>
                                        <BotonEliminar onClick={() => abrirModalEliminarMateria(materia)}>Eliminar</BotonEliminar>
                                        <button className="btn btn-sm btn-outline-info" onClick={() => abrirModalLotesMateria(materia)}>Ver Lotes</button>
                                        <button className="btn btn-sm btn-outline-success" onClick={() => abrirModalAgregarLote(materia)}>Agregar Lote</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {modalAbiertaMateria && (
                <Modal isOpen={modalAbiertaMateria} onClose={() => setModalAbiertaMateria(false)}>
                    <form onSubmit={guardarMateria}>
                        <h2>{materiaSeleccionada ? "Editar" : "Agregar"} Materia Prima</h2>
                        <div className="mb-3">
                            <label className="form-label">ID</label>
                            <input
                                name="idMateria"
                                type="number"
                                defaultValue={materiaSeleccionada?.idMateria || ""}
                                className="form-control"
                                required
                                disabled={materiaSeleccionada !== null}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nombre</label>
                            <input
                                name="nombre"
                                type="text"
                                defaultValue={materiaSeleccionada?.nombre || ""}
                                className="form-control"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Costo Unitario (COP)</label>
                            <input
                                name="costo"
                                type="number"
                                defaultValue={materiaSeleccionada?.costo || ""}
                                className="form-control"
                                required
                                min={0}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Precio de Venta (COP)</label>
                            <input
                                name="venta"
                                type="number"
                                defaultValue={materiaSeleccionada?.venta || ""}
                                className="form-control"
                                required
                                min={0}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Cantidad</label>
                            <input
                                name="cantidad"
                                type="number"
                                defaultValue={materiaSeleccionada?.cantidad || ""}
                                className="form-control"
                                required
                                min={0}
                                disabled={materiaSeleccionada !== null}
                            />
                        </div>
                        <div className="pie-modal">
                            <BotonCancelar onClick={() => setModalAbiertaMateria(false)} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}
            {confirmarEliminacion && (
                <Modal isOpen={confirmarEliminacion} onClose={() => setConfirmarEliminacion(false)}>
                    <div className="encabezado-modal"><h2>Confirmar Eliminación</h2></div>
                    <p>¿Desea eliminar la materia prima <strong>{materiaEliminar?.nombre}</strong>?</p>
                    <div className="pie-modal">
                        <BotonCancelar onClick={() => setConfirmarEliminacion(false)} />
                        <BotonAceptar onClick={eliminarMateria} />
                    </div>
                </Modal>
            )}
            {modalLotesMateria && (
                <Modal isOpen={modalLotesMateria} onClose={() => setModalLotesMateria(false)}>
                    <h2>Lotes de Materia Prima</h2>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>ID Lote</th>
                                <th>Costo Unitario</th>
                                <th>Cantidad Inicial</th>
                                <th>Cantidad Disponible</th>
                                <th>Fecha Ingreso</th>
                                <th>Proveedor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotesMateriaSeleccionada.map((lote) => (
                                <tr key={lote.idLote}>
                                    <td>{lote.idLote}</td>
                                    <td>{formatCurrency(lote.costoUnitario)}</td>
                                    <td>{lote.cantidad}</td>
                                    <td>{lote.cantidadDisponible}</td>
                                    <td>{formatDate(lote.fechaIngreso)}</td>
                                    <td>{lote.idProveedor ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre : "Manual"}</td>
                                    <td><BotonEditar onClick={() => abrirModalEditarLote(lote)}>Editar</BotonEditar></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pie-modal"><BotonAceptar onClick={() => setModalLotesMateria(false)} /></div>
                </Modal>
            )}
            {modalLoteAbierto && (
                <Modal isOpen={modalLoteAbierto} onClose={() => setModalLoteAbierto(false)}>
                    <form onSubmit={guardarLote}>
                        <h2>{loteSeleccionado ? "Editar" : "Agregar"} Lote</h2>
                        <div className="mb-3">
                            <label className="form-label">ID Lote</label>
                            <input
                                type="number"
                                className="form-control"
                                value={loteNuevo.idLote}
                                required
                                disabled={loteSeleccionado !== null}
                                onChange={(e) => setLoteNuevo({ ...loteNuevo, idLote: Number(e.target.value) })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Costo Unitario (COP)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={loteNuevo.costoUnitario}
                                required
                                min={0}
                                onChange={(e) => setLoteNuevo({ ...loteNuevo, costoUnitario: Number(e.target.value) })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Cantidad Inicial</label>
                            <input
                                type="number"
                                className="form-control"
                                value={loteNuevo.cantidad}
                                required
                                min={0}
                                onChange={(e) =>
                                    setLoteNuevo({
                                        ...loteNuevo,
                                        cantidad: Number(e.target.value),
                                        cantidadDisponible: loteSeleccionado ? loteNuevo.cantidadDisponible : Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Cantidad Disponible</label>
                            <input
                                type="number"
                                className="form-control"
                                value={loteNuevo.cantidadDisponible}
                                required
                                min={0}
                                disabled={!loteSeleccionado}
                                onChange={(e) => setLoteNuevo({ ...loteNuevo, cantidadDisponible: Number(e.target.value) })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Fecha de Ingreso</label>
                            <input
                                type="date"
                                className="form-control"
                                value={loteNuevo.fechaIngreso}
                                required
                                onChange={(e) => setLoteNuevo({ ...loteNuevo, fechaIngreso: e.target.value })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Proveedor</label>
                            <select
                                className="form-select"
                                value={loteNuevo.idProveedor || ""}
                                onChange={(e) =>
                                    setLoteNuevo({ ...loteNuevo, idProveedor: e.target.value ? Number(e.target.value) : null })
                                }
                            >
                                <option value="">Manual</option>
                                {proveedores.map((p) => (
                                    <option key={p.idProveedor} value={p.idProveedor}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pie-modal">
                            <BotonCancelar onClick={() => setModalLoteAbierto(false)} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}
            {modalAdvertenciaIdDuplicado && (
                <Modal isOpen={modalAdvertenciaIdDuplicado} onClose={() => setModalAdvertenciaIdDuplicado(false)}>
                    <div className="encabezado-modal"><h2>Advertencia</h2></div>
                    <p className="text-center">
                        ¡Ya existe una {loteSeleccionado || !materiaSeleccionada ? "lote" : "materia prima"} con ese ID!
                    </p>
                    <div className="pie-modal"><BotonAceptar type="button" onClick={() => setModalAdvertenciaIdDuplicado(false)} /></div>
                </Modal>
            )}
        </main>
    );
};