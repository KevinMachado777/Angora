import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonAceptar from "./BotonAceptar";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";

// Componente de tabla de materias primas
const TablaMaterias = forwardRef(
    ({ registrosMateria, setRegistrosMateria, lotesMateriaPrima, setLotesMateriaPrima, proveedores }, ref) => {
        const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
        const [modalAbiertaMateria, setModalAbiertaMateria] = useState(false);
        const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] = useState(false);
        const [modalAdvertenciaCosto, setModalAdvertenciaCosto] = useState(false);
        const [modalLotesMateria, setModalLotesMateria] = useState(false);
        const [lotesMateriaSeleccionada, setLotesMateriaSeleccionada] = useState([]);
        const [modalLoteAbierto, setModalLoteAbierto] = useState(false);
        const [loteSeleccionado, setLoteSeleccionado] = useState(null);
        const [loteNuevo, setLoteNuevo] = useState({
            idMateria: 0,
            costoUnitario: "",
            cantidad: "",
            cantidadDisponible: "",
            idProveedor: null,
        });
        const [error, setError] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const [currentPage, setCurrentPage] = useState(1);
        const [itemsPerPage] = useState(5);

        // Función para obtener el token desde localStorage
        const getAuthToken = () => {
            const localToken = localStorage.getItem("accessToken");
            return localToken;
        };

        // Función auxiliar para manejar errores
        const handleApiError = (err, context) => {
            console.error(`Error en ${context}:`, {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
            });
            if (err.response?.status === 401) {
                setError("Sesión expirada o token inválido. Por favor, inicia sesión nuevamente.");
                localStorage.removeItem("accessToken");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else if (err.response?.status === 403) {
                setError("No tienes permisos para realizar esta acción. Contacta al administrador.");
            } else {
                setError(err.response?.data?.message || `Error en ${context}. Intenta de nuevo.`);
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

        // Paginación: Calcular índices
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = registrosMateria.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(registrosMateria.length / itemsPerPage);

        const guardarMateria = async (e) => {
            e.preventDefault();
            const authToken = getAuthToken();
            if (!authToken) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                console.log("No token found in guardarMateria");
                return;
            }
            const datos = new FormData(e.target);
            const nueva = {
                idMateria: materiaSeleccionada ? materiaSeleccionada.idMateria : undefined,
                nombre: datos.get("nombre").trim(),
                venta: Number(datos.get("venta")),
                cantidad: materiaSeleccionada ? materiaSeleccionada.cantidad : 0,
                costo: materiaSeleccionada ? materiaSeleccionada.costo : 0
            };

            if (!nueva.nombre) {
                setError("El nombre de la materia prima es obligatorio");
                return;
            }
            if (isNaN(nueva.venta) || nueva.venta < 0) {
                setError("El precio de venta debe ser mayor o igual a 0");
                return;
            }

            try {
                const headers = { Authorization: `Bearer ${authToken}` };
                let updatedMaterias;
                if (materiaSeleccionada) {
                    // PUT: actualizar solo nombre/venta (costo y cantidad son gestionados por lotes)
                    const payload = { ...materiaSeleccionada, nombre: nueva.nombre, venta: nueva.venta };
                    await api.put(`/inventarioMateria`, payload, { headers });
                    updatedMaterias = registrosMateria.map((p) =>
                        p.idMateria === materiaSeleccionada.idMateria ? { ...p, ...payload } : p
                    );
                } else {
                    const body = { nombre: nueva.nombre, venta: nueva.venta };
                    const response = await api.post("/inventarioMateria", body, { headers });
                    const nuevaMateria = {
                        ...response.data,
                        costo: response.data.costo || 0,
                        cantidad: response.data.cantidad || 0,
                    };
                    updatedMaterias = [...registrosMateria, nuevaMateria];
                }
                setRegistrosMateria(updatedMaterias);
                localStorage.setItem("registrosMateria", JSON.stringify(updatedMaterias));
                setModalAbiertaMateria(false);
                setMateriaSeleccionada(null);
            } catch (err) {
                if (err.response?.status === 409) {
                    setModalAdvertenciaIdDuplicado(true);
                } else {
                    handleApiError(err, "guardado de materia prima");
                }
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
                idMateria: materia.idMateria,
                costoUnitario: "",
                cantidad: "",
                cantidadDisponible: "",
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
            });
            setModalLoteAbierto(true);
        };

        const guardarLote = async (e) => {
            e.preventDefault();
            const authToken = getAuthToken();
            if (!authToken) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                console.log("No token found in guardarLote");
                return;
            }
            const datos = new FormData(e.target);
            const costoUnitario = Number(datos.get("costoUnitario"));
            const cantidadIngresada = Number(datos.get(loteSeleccionado ? "cantidadDisponible" : "cantidad"));

            const nuevoLote = {
                idMateria: Number(loteNuevo.idMateria),
                costoUnitario: costoUnitario,
                cantidad: loteSeleccionado ? loteSeleccionado.cantidad : cantidadIngresada,
                cantidadDisponible: loteSeleccionado ? cantidadIngresada : cantidadIngresada,
                idProveedor: datos.get("idProveedor") ? Number(datos.get("idProveedor")) : null,
            };

            if (loteSeleccionado) {
                nuevoLote.idLote = loteSeleccionado.idLote;
                // NOTA: no modificamos fechaIngreso ni proveedor para lote existente
                if (nuevoLote.cantidadDisponible > nuevoLote.cantidad) {
                    setError("La cantidad disponible no puede ser mayor que la cantidad inicial del lote");
                    return;
                }
            }

            if (isNaN(costoUnitario) || isNaN(cantidadIngresada) || costoUnitario < 0 || cantidadIngresada < 0) {
                setError("Costo unitario y cantidad deben ser números válidos mayores o iguales a 0");
                return;
            }

            try {
                const headers = { Authorization: `Bearer ${authToken}` };
                let updatedLotes;
                let responseData;

                if (loteSeleccionado) {
                    responseData = await api.put(`/lotes`, { ...loteSeleccionado, ...nuevoLote }, { headers });
                    // mapear con la información enviada
                    updatedLotes = lotesMateriaPrima.map((l) =>
                        l.idLote === nuevoLote.idLote ? { ...l, ...nuevoLote } : l
                    );
                } else {
                    responseData = await api.post("/lotes", nuevoLote, { headers });
                    responseData = {
                        ...responseData.data,
                        costoUnitario: responseData.data.costoUnitario ?? nuevoLote.costoUnitario,
                        cantidad: responseData.data.cantidad ?? nuevoLote.cantidad,
                        cantidadDisponible: responseData.data.cantidadDisponible ?? nuevoLote.cantidad,
                        idMateria: nuevoLote.idMateria,
                        idProveedor: nuevoLote.idProveedor,
                    };
                    updatedLotes = [...lotesMateriaPrima, responseData];
                }

                setLotesMateriaPrima(updatedLotes);

                // Actualizar también el estado `lotesMateriaSeleccionada`
                const nuevosLotesParaModal = updatedLotes.filter(lote => lote.idMateria === nuevoLote.idMateria);
                setLotesMateriaSeleccionada(nuevosLotesParaModal);

                // Actualizar costo promedio y cantidad total en registrosMateria (si existe)
                const lotesMateria = updatedLotes.filter((l) => l.idMateria === nuevoLote.idMateria);
                const totalDisponible = lotesMateria.reduce((sum, l) => sum + (l.cantidadDisponible || 0), 0);
                const costoPromedio =
                    totalDisponible > 0
                        ? lotesMateria.reduce(
                            (sum, l) => sum + (l.costoUnitario || 0) * (l.cantidadDisponible || 0),
                            0
                        ) / totalDisponible
                        : 0;

                const materiaActualizada = registrosMateria.find((m) => m.idMateria === nuevoLote.idMateria);
                if (materiaActualizada) {
                    const updatedMateria = { ...materiaActualizada, costo: costoPromedio, cantidad: totalDisponible };
                    await api.put(`/inventarioMateria`, updatedMateria, { headers });
                    setRegistrosMateria((prev) =>
                        prev.map((m) => (m.idMateria === nuevoLote.idMateria ? updatedMateria : m))
                    );
                }

                localStorage.setItem("lotesMateriaPrima", JSON.stringify(updatedLotes));
                localStorage.setItem("registrosMateria", JSON.stringify(registrosMateria));

                setModalLoteAbierto(false);
                setLoteSeleccionado(null);
                setLoteNuevo({ idMateria: 0, costoUnitario: "", cantidad: "", cantidadDisponible: "", idProveedor: null });
            } catch (err) {
                if (err.response?.status === 409) {
                    setModalAdvertenciaIdDuplicado(true);
                } else {
                    handleApiError(err, "guardado de lote");
                }
            }
        };

        const formatCurrency = (value) => {
            return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(
                value
            );
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
                        {currentItems.map((materia) => (
                            <tr key={materia.idMateria}>
                                <td>{materia.idMateria}</td>
                                <td>{materia.nombre}</td>
                                <td>{formatCurrency(materia.costo)}</td>
                                <td>{materia.venta}</td>
                                <td>{materia.cantidad}</td>
                                <td>
                                    <BotonEditar
                                        onClick={() => {
                                            setMateriaSeleccionada(materia);
                                            setModalAbiertaMateria(true);
                                        }}
                                    >
                                        Editar
                                    </BotonEditar>
                                    <button
                                        className="btn btn-sm btn-outline-info me-1"
                                        onClick={() => abrirModalLotesMateria(materia)}
                                    >
                                        Ver Lotes
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => abrirModalAgregarLote(materia)}
                                    >
                                        Agregar Lote
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <nav>
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                Anterior
                            </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                    {i + 1}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                                Siguiente
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* MODAL: Agregar / Editar Materia */}
                {modalAbiertaMateria && (
                    <Modal isOpen={modalAbiertaMateria} onClose={() => setModalAbiertaMateria(false)}>
                        <form onSubmit={guardarMateria}>
                            <h2 className="mb-4">{materiaSeleccionada ? "Editar" : "Agregar"} Materia Prima</h2>

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

                            {/* Mostrar mensaje de costo si la materia ya existe */}
                            {materiaSeleccionada && (
                                <div className="mb-3">
                                    <label className="form-label">Costo Unitario (COP)</label>
                                    <input
                                        name="costo"
                                        type="text"
                                        value={formatCurrency(materiaSeleccionada.costo)}
                                        className="form-control"
                                        disabled
                                    />
                                    <small className="form-text text-muted">
                                        El costo depende del promedio de los costos de los lotes. Para modificarlo, edita los lotes.
                                    </small>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label">Precio de Venta (COP)</label>
                                <input
                                    name="venta"
                                    type="number"
                                    defaultValue={materiaSeleccionada?.venta ?? ""}
                                    className="form-control"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <BotonCancelar onClick={() => setModalAbiertaMateria(false)} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}

                {/* MODAL: Lotes de materia */}
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
                                        <td>
                                            {lote.idProveedor
                                                ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre ||
                                                "N/A"
                                                : "Sin proveedor"}
                                        </td>
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

                {/* MODAL: Agregar / Editar Lote */}
                {modalLoteAbierto && (
                    <Modal isOpen={modalLoteAbierto} onClose={() => setModalLoteAbierto(false)}>
                        <form onSubmit={guardarLote}>
                            <h2 className="mb-4">{loteSeleccionado ? "Editar" : "Agregar"} Lote</h2>

                            {loteSeleccionado && (
                                <div className="mb-3">
                                    <label className="form-label">ID Lote</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={loteNuevo.idLote}
                                        disabled
                                    />
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label">Costo Unitario (COP)</label>
                                <input
                                    name="costoUnitario"
                                    type="number"
                                    value={loteNuevo.costoUnitario}
                                    className="form-control"
                                    required
                                    min="0"
                                    step="0.01"
                                    onChange={(e) =>
                                        setLoteNuevo({ ...loteNuevo, costoUnitario: e.target.value })
                                    }
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{loteSeleccionado ? "Cantidad Disponible" : "Cantidad"}</label>
                                <input
                                    name={loteSeleccionado ? "cantidadDisponible" : "cantidad"}
                                    type="number"
                                    value={loteSeleccionado ? loteNuevo.cantidadDisponible : loteNuevo.cantidad}
                                    className="form-control"
                                    required
                                    min="0"
                                    max={loteSeleccionado ? loteSeleccionado.cantidad : undefined}
                                    onChange={(e) =>
                                        setLoteNuevo({
                                            ...loteNuevo,
                                            [loteSeleccionado ? "cantidadDisponible" : "cantidad"]: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            {/* Para nuevo lote permitimos seleccionar proveedor; para editar lote no mostramos este input */}
                            {!loteSeleccionado ? (
                                <div className="mb-3">
                                    <label className="form-label">Proveedor</label>
                                    <select
                                        name="idProveedor"
                                        className="form-select"
                                        value={loteNuevo.idProveedor || ""}
                                        onChange={(e) =>
                                            setLoteNuevo({ ...loteNuevo, idProveedor: e.target.value || null })
                                        }
                                    >
                                        <option value="">Sin proveedor</option>
                                        {proveedores.map((p) => (
                                            <option key={p.idProveedor} value={p.idProveedor}>
                                                {p.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

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
                        <p className="text-center">¡Ya existe una materia prima con el mismo nombre!</p>
                        <div className="d-flex justify-content-end">
                            <BotonAceptar onClick={() => setModalAdvertenciaIdDuplicado(false)} />
                        </div>
                    </Modal>
                )}
                {modalAdvertenciaCosto && (
                    <Modal isOpen={modalAdvertenciaCosto} onClose={() => setModalAdvertenciaCosto(false)}>
                        <div className="encabezado-modal">
                            <h2>Advertencia</h2>
                        </div>
                        <p className="text-center">
                            El costo depende del promedio de los costos de los lotes. Para modificarlo, edita los lotes.
                        </p>
                        <div className="d-flex justify-content-end">
                            <BotonAceptar onClick={() => setModalAdvertenciaCosto(false)} />
                        </div>
                    </Modal>
                )}
            </div>
        );
    }
);

export default TablaMaterias;
