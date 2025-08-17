import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonAceptar from "./BotonAceptar";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";

const TablaMaterias = forwardRef(
    ({ registrosMateria, setRegistrosMateria, lotesMateriaPrima, setLotesMateriaPrima, proveedores }, ref) => {
        const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
        const [modalAbiertaMateria, setModalAbiertaMateria] = useState(false);
        const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] = useState(false);
        const [modalAdvertenciaCosto, setModalAdvertenciaCosto] = useState(false);
        const [modalLotesMateria, setModalLotesMateria] = useState(false);
        const [modalHistoricoLotes, setModalHistoricoLotes] = useState(false);
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
        const [currentPageLotes, setCurrentPageLotes] = useState(1);
        const [itemsPerPageLotes] = useState(5);
        const [fechaInicio, setFechaInicio] = useState("");
        const [fechaFin, setFechaFin] = useState("");
        const [isMounted, setIsMounted] = useState(false);
        const [cantidadActualLote, setCantidadActualLote] = useState(null);

        // Función para obtener el token de autenticación del localStorage
        const getAuthToken = () => {
            const localToken = localStorage.getItem("accessToken");
            return localToken;
        };

        // Manejo de errores de la API
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

        // Carga inicial de materias
        useEffect(() => {
            if (!isMounted) {
                const fetchUpdatedMaterias = async () => {
                    try {
                        const authToken = getAuthToken();
                        if (authToken) {
                            const headers = { Authorization: `Bearer ${authToken}` };
                            const response = await api.get("/inventarioMateria", { headers });
                            setRegistrosMateria(response.data);
                            setIsMounted(true);
                        }
                    } catch (err) {
                        handleApiError(err, "sincronización de materias");
                    } finally {
                        setIsLoading(false);
                    }
                };
                fetchUpdatedMaterias();
            }
        }, [isMounted, setRegistrosMateria]);

        useImperativeHandle(ref, () => ({
            abrirModalAgregar: () => {
                setMateriaSeleccionada(null);
                setModalAbiertaMateria(true);
            },
        }));

        // Paginación de materias
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = registrosMateria.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(registrosMateria.length / itemsPerPage);

        // Filtrado y paginación de lotes
        const filtrarLotes = (lotes) => {
            return lotes.filter((lote) => {
                const loteDate = new Date(lote.fechaIngreso);
                const start = fechaInicio ? new Date(fechaInicio) : null;
                const end = fechaFin ? new Date(fechaFin) : null;
                return (!start || loteDate >= start) && (!end || loteDate <= end);
            });
        };

        // Paginación de lotes filtrados
        const indexOfLastItemLotes = currentPageLotes * itemsPerPageLotes;
        const indexOfFirstItemLotes = indexOfLastItemLotes - itemsPerPageLotes;
        const currentLotes = filtrarLotes(lotesMateriaSeleccionada).slice(indexOfFirstItemLotes, indexOfLastItemLotes);
        const totalPagesLotes = Math.ceil(filtrarLotes(lotesMateriaSeleccionada).length / itemsPerPageLotes);

        // Función para guardar o editar una materia
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

        // Funciones para abrir los modales de lotes
        const abrirModalLotesMateria = (materia) => {
            const lotesDisponibles = lotesMateriaPrima.filter(
                (lote) => lote.idMateria === materia.idMateria && lote.cantidadDisponible > 0
            );
            setLotesMateriaSeleccionada(lotesDisponibles);
            setModalLotesMateria(true);
        };


        const abrirModalHistoricoLotes = (materia) => {
            const lotesHistoricos = lotesMateriaPrima.filter((lote) => lote.idMateria === materia.idMateria);
            setLotesMateriaSeleccionada(lotesHistoricos);
            setModalHistoricoLotes(true);
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
            setCantidadActualLote(lote.cantidadDisponible); // Guardar la cantidad actual del lote
            setLoteNuevo({
                idLote: lote.idLote,
                idMateria: lote.idMateria,
                costoUnitario: lote.costoUnitario,
                cantidad: lote.cantidad, // Cantidad inicial fija
                cantidadDisponible: lote.cantidadDisponible, // Cantidad actual disponible
            });
            setModalLoteAbierto(true);
        };

        // Función para guardar o editar un lote
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

            // VALIDACIÓN 1: No puede ser mayor que la cantidad original del lote
            if (loteSeleccionado && cantidadIngresada > Number(loteSeleccionado.cantidad)) {
                setError(`La cantidad disponible no puede ser mayor que la cantidad inicial del lote (${loteSeleccionado.cantidad})`);
                return;
            }

            // VALIDACIÓN 2: ¡LA NUEVA! No puede ser mayor que la cantidad actual
            if (loteSeleccionado && cantidadIngresada > Number(cantidadActualLote)) {
                setError(`Este lote cuenta con ${cantidadActualLote} unidades. No puedes poner una cantidad mayor a esa.`);
                return;
            }

            // Validación: La cantidad disponible no puede ser negativa
            if (cantidadIngresada < 0) {
                setError("La cantidad disponible no puede ser negativa");
                return;
            }

            if (loteSeleccionado) {
                nuevoLote.idLote = loteSeleccionado.idLote;
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
                    responseData = await api.put(`/lotes/${loteSeleccionado.idLote}`, { ...loteSeleccionado, ...nuevoLote }, { headers });
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

                // Obtener la materia actualizada desde el backend para tener el costo correcto
                const materiaResponse = await api.get(`/inventarioMateria/${nuevoLote.idMateria}`, { headers });
                const materiaActualizada = materiaResponse.data;

                // Llamar al endpoint PUT para que se ejecute el recálculo de productos
                await api.put(`/inventarioMateria`, materiaActualizada, { headers });

                // Obtener la materia actualizada NUEVAMENTE después del PUT
                const materiaFinalResponse = await api.get(`/inventarioMateria/${nuevoLote.idMateria}`, { headers });
                const materiaFinal = materiaFinalResponse.data;

                // Actualizar el estado local con los datos finales del backend
                setRegistrosMateria((prev) =>
                    prev.map((m) => (m.idMateria === nuevoLote.idMateria ? materiaFinal : m))
                );

                const nuevosLotesParaModal = updatedLotes.filter(
                    (lote) => lote.idMateria === nuevoLote.idMateria && lote.cantidadDisponible > 0
                );
                setLotesMateriaSeleccionada(nuevosLotesParaModal);

                localStorage.setItem("lotesMateriaPrima", JSON.stringify(updatedLotes));
                localStorage.setItem("registrosMateria", JSON.stringify(registrosMateria));

                setModalLoteAbierto(false);
                setLoteSeleccionado(null);
                setCantidadActualLote(null); // Limpiar la cantidad actual
                setLoteNuevo({ idMateria: 0, costoUnitario: "", cantidad: "", cantidadDisponible: "", idProveedor: null });
            } catch (err) {
                if (err.response?.status === 409) {
                    setModalAdvertenciaIdDuplicado(true);
                } else {
                    handleApiError(err, "guardado de lote");
                }
            }
        };

        // Función para formatear números como moneda
        const formatCurrency = (value) => {
            return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);
        };

        // Función para formatear fechas
        const formatDate = (dateString) => {
            if (!dateString || dateString === "N/A") return "N/A";
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("es-CO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }).format(date);
        };

        // Agregar esta función en tu componente TablaMaterias
        const limpiarFechas = () => {
            setFechaInicio("");
            setFechaFin("");
            setCurrentPageLotes(1);
        };

        if (isLoading) {
            return <div className="text-center mt-5">Cargando materias primas...</div>;
        }

        return (
            <div className="container inventario">
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
                                    <button
                                        className="btn btn-sm btn-outline-secondary ms-1"
                                        onClick={() => abrirModalHistoricoLotes(materia)}
                                    >
                                        Ver Histórico
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

                {modalLotesMateria && (
                    <Modal isOpen={modalLotesMateria} onClose={() => setModalLotesMateria(false)}>
                        <h2 className="mb-4">Lotes de Materia Prima</h2>
                        <div className="mb-3">
                            <label>Fecha Inicio:</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="form-control mb-2"
                            />
                            <label>Fecha Fin:</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="form-control mb-2"
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={limpiarFechas}
                            >
                                Limpiar Fechas
                            </button>
                        </div>
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
                                {currentLotes.map((lote) => (
                                    <tr key={lote.idLote}>
                                        <td>{lote.idLote}</td>
                                        <td>{formatCurrency(lote.costoUnitario)}</td>
                                        <td>{lote.cantidad}</td>
                                        <td>{lote.cantidadDisponible}</td>
                                        <td>{formatDate(lote.fechaIngreso)}</td>
                                        <td>
                                            {lote.idProveedor
                                                ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                                                : "Sin proveedor"}
                                        </td>
                                        <td>
                                            <BotonEditar onClick={() => abrirModalEditarLote(lote)}>Editar</BotonEditar>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPageLotes === 1 ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPageLotes(currentPageLotes - 1)}>
                                        Anterior
                                    </button>
                                </li>
                                {Array.from({ length: totalPagesLotes }, (_, i) => {
                                    if (i < 5 || i >= totalPagesLotes - 5 || Math.abs(i - currentPageLotes + 1) < 2) {
                                        return (
                                            <li key={i + 1} className={`page-item ${currentPageLotes === i + 1 ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => setCurrentPageLotes(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        );
                                    } else if (i === 5 && currentPageLotes > 7) {
                                        return <li key="ellipsis1" className="page-item disabled"><span className="page-link">…</span></li>;
                                    } else if (i === totalPagesLotes - 6 && currentPageLotes < totalPagesLotes - 6) {
                                        return <li key="ellipsis2" className="page-item disabled"><span className="page-link">…</span></li>;
                                    }
                                    return null;
                                })}
                                <li className={`page-item ${currentPageLotes === totalPagesLotes ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPageLotes(currentPageLotes + 1)}>
                                        Siguiente
                                    </button>
                                </li>
                            </ul>
                        </nav>
                        <div className="d-flex justify-content-end">
                            <BotonAceptar onClick={() => setModalLotesMateria(false)} />
                        </div>
                    </Modal>
                )}

                {modalHistoricoLotes && (
                    <Modal isOpen={modalHistoricoLotes} onClose={() => setModalHistoricoLotes(false)}>
                        <h2 className="mb-4">Histórico de Lotes</h2>
                        <div className="mb-3">
                            <label>Fecha Inicio:</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="form-control mb-2"
                            />
                            <label>Fecha Fin:</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="form-control mb-2"
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={limpiarFechas}
                            >
                                Limpiar Fechas
                            </button>
                        </div>
                        <table className="table table-bordered tabla-materias">
                            <thead>
                                <tr>
                                    <th>ID Lote</th>
                                    <th>Costo Unitario</th>
                                    <th>Cantidad Inicial</th>
                                    <th>Cantidad Disponible</th>
                                    <th>Fecha Ingreso</th>
                                    <th>Proveedor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLotes.map((lote) => (
                                    <tr key={lote.idLote}>
                                        <td>{lote.idLote}</td>
                                        <td>{formatCurrency(lote.costoUnitario)}</td>
                                        <td>{lote.cantidad}</td>
                                        <td>{lote.cantidadDisponible}</td>
                                        <td>{formatDate(lote.fechaIngreso)}</td>
                                        <td>
                                            {lote.idProveedor
                                                ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                                                : "Sin proveedor"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPageLotes === 1 ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPageLotes(currentPageLotes - 1)}>
                                        Anterior
                                    </button>
                                </li>
                                {Array.from({ length: totalPagesLotes }, (_, i) => {
                                    if (i < 5 || i >= totalPagesLotes - 5 || Math.abs(i - currentPageLotes + 1) < 2) {
                                        return (
                                            <li key={i + 1} className={`page-item ${currentPageLotes === i + 1 ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => setCurrentPageLotes(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        );
                                    } else if (i === 5 && currentPageLotes > 7) {
                                        return <li key="ellipsis1" className="page-item disabled"><span className="page-link">…</span></li>;
                                    } else if (i === totalPagesLotes - 6 && currentPageLotes < totalPagesLotes - 6) {
                                        return <li key="ellipsis2" className="page-item disabled"><span className="page-link">…</span></li>;
                                    }
                                    return null;
                                })}
                                <li className={`page-item ${currentPageLotes === totalPagesLotes ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPageLotes(currentPageLotes + 1)}>
                                        Siguiente
                                    </button>
                                </li>
                            </ul>
                        </nav>
                        <div className="d-flex justify-content-end">
                            <BotonAceptar onClick={() => setModalHistoricoLotes(false)} />
                        </div>
                    </Modal>
                )}

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
            </div>
        );
    }
);

export default TablaMaterias;