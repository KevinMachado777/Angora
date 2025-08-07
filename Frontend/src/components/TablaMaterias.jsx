import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonEliminar from "./BotonEliminar";
import BotonAceptar from "./BotonAceptar";
import "../styles/tablaMaterias.css";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";

const TablaMaterias = forwardRef(
    ({ registrosMateria, setRegistrosMateria, lotesMateriaPrima, setLotesMateriaPrima, proveedores, token }, ref) => {
        const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
        const [modalAbiertaMateria, setModalAbiertaMateria] = useState(false);
        const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] = useState(false);
        const [materiaEliminar, setMateriaEliminar] = useState(null);
        const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
        const [modalLotesMateria, setModalLotesMateria] = useState(false);
        const [lotesMateriaSeleccionada, setLotesMateriaSeleccionada] = useState([]);
        const [modalLoteAbierto, setModalLoteAbierto] = useState(false);
        const [loteSeleccionado, setLoteSeleccionado] = useState(null);
        const [loteNuevo, setLoteNuevo] = useState({
            idLote: 0,
            idMateria: 0,
            costoUnitario: 0,
            cantidad: 0,
            cantidadDisponible: 0,
            fechaIngreso: new Date().toISOString().split("T")[0],
            idProveedor: null,
        });
        const [error, setError] = useState(null);
        const [isLoading, setIsLoading] = useState(true);

        // Función auxiliar para manejar errores
        const handleApiError = (err, context) => {
            console.error(`Error en ${context}:`, {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
            });
            if (err.response?.status === 401) {
                setError("Sesión expirada o permisos insuficientes. Por favor, inicia sesión nuevamente.");
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            } else {
                setError(err.response?.data?.message || `Error en ${context}`);
            }
        };

        useEffect(() => {
            if (registrosMateria.length > 0) {
                setIsLoading(false);
            }
        }, [registrosMateria]);

        useImperativeHandle(ref, () => ({
            abrirModalAgregar: () => {
                setMateriaSeleccionada(null);
                setModalAbiertaMateria(true);
            },
        }));

        const guardarMateria = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }
            const datos = new FormData(e.target);
            const nueva = {
                idMateria: Number(datos.get("idMateria")),
                nombre: datos.get("nombre").trim(),
                costo: Number(datos.get("costo")),
                venta: Number(datos.get("venta")),
                cantidad: Number(datos.get("cantidad")),
            };
            if (nueva.idMateria <= 0) {
                setError("El ID de la materia prima debe ser mayor que 0");
                return;
            }
            if (!nueva.nombre) {
                setError("El nombre de la materia prima es obligatorio");
                return;
            }
            if (nueva.costo < 0 || nueva.venta < 0 || nueva.cantidad < 0) {
                setError("Costo, precio de venta y cantidad deben ser mayores o iguales a 0");
                return;
            }

            try {
                const headers = { Authorization: `Bearer ${token}` };
                console.log("Guardando materia:", nueva);
                let updatedMaterias;
                if (materiaSeleccionada) {
                    await api.put(`/inventarioMateria/${nueva.idMateria}`, nueva, { headers });
                    updatedMaterias = registrosMateria.map((p) => (p.idMateria === nueva.idMateria ? nueva : p));
                    setRegistrosMateria(updatedMaterias);
                } else {
                    if (registrosMateria.some((m) => m.idMateria === nueva.idMateria)) {
                        setModalAdvertenciaIdDuplicado(true);
                        return;
                    }
                    const response = await api.post("/inventarioMateria", nueva, { headers });
                    updatedMaterias = [...registrosMateria, response.data];
                    setRegistrosMateria(updatedMaterias);
                    const nuevoLote = {
                        idLote: lotesMateriaPrima.length > 0 ? Math.max(...lotesMateriaPrima.map((l) => l.idLote)) + 1 : 1,
                        idMateria: response.data.idMateria,
                        costoUnitario: nueva.costo,
                        cantidad: nueva.cantidad,
                        cantidadDisponible: nueva.cantidad,
                        fechaIngreso: new Date().toISOString().split("T")[0],
                        idProveedor: null,
                    };
                    await api.post("/lotes", nuevoLote, { headers });
                    setLotesMateriaPrima((prev) => [...prev, nuevoLote]);
                }
                localStorage.setItem("registrosMateria", JSON.stringify(updatedMaterias));
                localStorage.setItem("lotesMateriaPrima", JSON.stringify(lotesMateriaPrima));
                setModalAbiertaMateria(false);
                setMateriaSeleccionada(null);
            } catch (err) {
                handleApiError(err, "guardado de materia prima");
            }
        };

        const eliminarMateria = async (materia) => {
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }
            try {
                const headers = { Authorization: `Bearer ${token}` };
                await api.delete(`/inventarioMateria/${materia.idMateria}`, { headers });
                const updatedMaterias = registrosMateria.filter((p) => p.idMateria !== materia.idMateria);
                const updatedLotes = lotesMateriaPrima.filter((l) => l.idMateria !== materia.idMateria);
                setRegistrosMateria(updatedMaterias);
                setLotesMateriaPrima(updatedLotes);
                localStorage.setItem("registrosMateria", JSON.stringify(updatedMaterias));
                localStorage.setItem("lotesMateriaPrima", JSON.stringify(updatedLotes));
                setConfirmarEliminacion(false);
                setMateriaEliminar(null);
            } catch (err) {
                handleApiError(err, "eliminación de materia prima");
            }
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
                fechaIngreso: new Date().toISOString().split("T")[0],
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

        const guardarLote = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }
            const nuevoLote = {
                idLote: Number(loteNuevo.idLote),
                idMateria: Number(loteNuevo.idMateria),
                costoUnitario: Number(loteNuevo.costoUnitario),
                cantidad: Number(loteNuevo.cantidad),
                cantidadDisponible: Number(loteNuevo.cantidad),
                fechaIngreso: loteNuevo.fechaIngreso,
                idProveedor: loteNuevo.idProveedor ? Number(loteNuevo.idProveedor) : null,
            };
            if (nuevoLote.idLote <= 0) {
                setError("El ID del lote debe ser mayor que 0");
                return;
            }
            if (nuevoLote.costoUnitario < 0 || nuevoLote.cantidad < 0 || nuevoLote.cantidadDisponible < 0) {
                setError("Costo unitario, cantidad y cantidad disponible deben ser mayores o iguales a 0");
                return;
            }

            try {
                const headers = { Authorization: `Bearer ${token}` };
                console.log("Guardando lote:", nuevoLote);
                let updatedLotes;
                if (loteSeleccionado) {
                    await api.put(`/lotes/${nuevoLote.idLote}`, nuevoLote, { headers });
                    updatedLotes = lotesMateriaPrima.map((l) => (l.idLote === nuevoLote.idLote ? nuevoLote : l));
                } else {
                    if (lotesMateriaPrima.some((l) => l.idLote === nuevoLote.idLote)) {
                        setModalAdvertenciaIdDuplicado(true);
                        return;
                    }
                    const response = await api.post("/lotes", nuevoLote, { headers });
                    updatedLotes = [...lotesMateriaPrima, response.data];
                }
                setLotesMateriaPrima(updatedLotes);

                // Actualizar cantidad total en registrosMateria
                const totalDisponible = updatedLotes
                    .filter((l) => l.idMateria === nuevoLote.idMateria)
                    .reduce((sum, l) => sum + l.cantidadDisponible, 0);
                const materiaActualizada = registrosMateria.find((m) => m.idMateria === nuevoLote.idMateria);
                if (materiaActualizada) {
                    const updatedMateria = { ...materiaActualizada, cantidad: totalDisponible };
                    await api.put(`/inventarioMateria/${materiaActualizada.idMateria}`, updatedMateria, { headers });
                    setRegistrosMateria((prev) =>
                        prev.map((m) => (m.idMateria === nuevoLote.idMateria ? updatedMateria : m))
                    );
                }

                localStorage.setItem("lotesMateriaPrima", JSON.stringify(updatedLotes));
                localStorage.setItem("registrosMateria", JSON.stringify(registrosMateria));
                setModalLoteAbierto(false);
                setLoteSeleccionado(null);
                setLoteNuevo({
                    idLote: 0,
                    idMateria: 0,
                    costoUnitario: 0,
                    cantidad: 0,
                    cantidadDisponible: 0,
                    fechaIngreso: new Date().toISOString().split("T")[0],
                    idProveedor: null,
                });
            } catch (err) {
                handleApiError(err, "guardado de lote");
            }
        };

        const formatCurrency = (value) => {
            return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);
        };

        const formatDate = (dateString) => {
            if (!dateString || dateString === "N/A") return "N/A";
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("es-CO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }).format(date);
        };

        if (isLoading) {
            return <div className="text-center mt-5">Cargando materias primas...</div>;
        }

        return (
            <div className="container inventario">
                {error && (
                    <Modal isOpen={!!error} onClose={() => setError(null)}>
                        <div className="encabezado-modal">
                            <h2>Error</h2>
                        </div>
                        <p className="text-center">{error}</p>
                        <div className="modal-footer">
                            <BotonAceptar onClick={() => setError(null)} />
                        </div>
                    </Modal>
                )}
                <table className="table table-bordered tabla-materias">
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
                                    <BotonEditar onClick={() => {
                                        setMateriaSeleccionada(materia);
                                        setModalAbiertaMateria(true);
                                    }}>
                                        Editar
                                    </BotonEditar>
                                    <BotonEliminar onClick={() => {
                                        setMateriaEliminar(materia);
                                        setConfirmarEliminacion(true);
                                    }}>
                                        Eliminar
                                    </BotonEliminar>
                                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => abrirModalLotesMateria(materia)}>
                                        Ver Lotes
                                    </button>
                                    <button className="btn btn-sm btn-outline-success" onClick={() => abrirModalAgregarLote(materia)}>
                                        Agregar Lote
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {modalAbiertaMateria && (
                    <Modal isOpen={modalAbiertaMateria} onClose={() => setModalAbiertaMateria(false)}>
                        <form onSubmit={guardarMateria}>
                            <h2 className="mb-4">{materiaSeleccionada ? "Editar" : "Agregar"} Materia Prima</h2>
                            <div className="mb-3">
                                <label className="form-label">ID</label>
                                <input
                                    name="idMateria"
                                    type="number"
                                    defaultValue={materiaSeleccionada?.idMateria || ""}
                                    className="form-control"
                                    required
                                    min="1"
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
                                    min="0"
                                    step="0.01"
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
                                    min="0"
                                    step="0.01"
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
                                    min="0"
                                    disabled={materiaSeleccionada !== null}
                                />
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                                <BotonCancelar onClick={() => setModalAbiertaMateria(false)} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}
                {confirmarEliminacion && (
                    <Modal isOpen={confirmarEliminacion} onClose={() => setConfirmarEliminacion(false)}>
                        <div className="encabezado-modal">
                            <h2>Confirmar Eliminación</h2>
                        </div>
                        <p className="text-center">
                            ¿Desea eliminar la materia prima <strong>{materiaEliminar?.nombre}</strong>?
                        </p>
                        <div className="d-flex justify-content-end gap-2">
                            <BotonCancelar onClick={() => setConfirmarEliminacion(false)} />
                            <BotonAceptar onClick={() => eliminarMateria(materiaEliminar)} />
                        </div>
                    </Modal>
                )}
                {modalLotesMateria && (
                    <Modal isOpen={modalLotesMateria} onClose={() => setModalLotesMateria(false)}>
                        <h2 className="mb-4">Lotes de Materia Prima</h2>
                        <table className="table table-bordered tabla-materias">
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
                                        <td>{lote.idProveedor ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A" : "Manual"}</td>
                                        <td>
                                            <BotonEditar onClick={() => abrirModalEditarLote(lote)}>Editar</BotonEditar>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="d-flex justify-content-end">
                            <BotonAceptar onClick={() => setModalLotesMateria(false)} />
                        </div>
                    </Modal>
                )}
                {modalLoteAbierto && (
                    <Modal isOpen={modalLoteAbierto} onClose={() => setModalLoteAbierto(false)}>
                        <form onSubmit={guardarLote}>
                            <h2 className="mb-4">{loteSeleccionado ? "Editar" : "Agregar"} Lote</h2>
                            <div className="mb-3">
                                <label className="form-label">ID Lote</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={loteNuevo.idLote}
                                    required
                                    min="1"
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
                                    min="0"
                                    step="0.01"
                                    onChange={(e) => setLoteNuevo({ ...loteNuevo, costoUnitario: Number(e.target.value) })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Cantidad</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={loteNuevo.cantidad}
                                    required
                                    min="0"
                                    onChange={(e) => setLoteNuevo({
                                        ...loteNuevo,
                                        cantidad: Number(e.target.value),
                                        cantidadDisponible: Number(e.target.value),
                                    })}
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
                                    onChange={(e) => setLoteNuevo({ ...loteNuevo, idProveedor: e.target.value || null })}
                                >
                                    <option value="">Sin proveedor</option>
                                    {proveedores.map((p) => (
                                        <option key={p.idProveedor} value={p.idProveedor}>
                                            {p.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                                <BotonCancelar onClick={() => setModalLoteAbierto(false)} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}
                {modalAdvertenciaIdDuplicado && (
                    <Modal isOpen={modalAdvertenciaIdDuplicado} onClose={() => setModalAdvertenciaIdDuplicado(false)}>
                        <div className="encabezado-modal">
                            <h2>Advertencia</h2>
                        </div>
                        <p className="text-center">
                            ¡Ya existe {loteSeleccionado ? "un lote" : "una materia prima"} con el ID <strong>{loteSeleccionado ? loteNuevo.idLote : materiaSeleccionada?.idMateria || loteNuevo.idLote}</strong>!
                        </p>
                        <div className="d-flex justify-content-end">
                            <BotonAceptar onClick={() => setModalAdvertenciaIdDuplicado(false)} />
                        </div>
                    </Modal>
                )}
            </div>
        );
    }
);

export default TablaMaterias;