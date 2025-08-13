import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonAceptar from "./BotonAceptar";
import "../styles/tablaProductos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";

// Componente TablaProductos con referencias para control externo (e.g., abrir modales)
const TablaProductos = forwardRef(
    ({ registrosMateria, lotesMateriaPrima, setRegistrosMateria, setLotesMateriaPrima, proveedores, token }, ref) => {
        const [registros, setRegistros] = useState([]);
        const [productoSeleccionado, setProductoSeleccionado] = useState(null);
        const [modalAbierta, setModalAbierta] = useState(false);
        const [materiasProducto, setMateriasProducto] = useState([]);
        const [modalMateriaAbierta, setModalMateriaAbierta] = useState(false);
        const [materiaNueva, setMateriaNueva] = useState({ idMateria: 0, cantidad: 0 });
        const [modoEdicionMateria, setModoEdicionMateria] = useState(false);
        const [indiceEdicionMateria, setIndiceEdicionMateria] = useState(null);
        const [modalStock, setModalStock] = useState(false);
        const [productoStock, setProductoStock] = useState(null);
        const [lotesUsadosEnProductos, setLotesUsadosEnProductos] = useState([]);
        const [producciones, setProducciones] = useState([]);
        const [produccionesLotes, setProduccionesLotes] = useState([]);
        const [costoTotal, setCostoTotal] = useState(0);
        const [costoModificadoManually, setCostoModificadoManually] = useState(false);
        const [formularioTemp, setFormularioTemp] = useState({ porcentajeGanancia: 15 });
        const [maxFabricable, setMaxFabricable] = useState(null);
        const [currentPage, setCurrentPage] = useState(1); // Paginación productos
        const [itemsPerPage] = useState(5); // Cantidad de items por página (productos)
        const [error, setError] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const [modalAdvertenciaPocoStock, setModalAdvertenciaPocoStock] = useState(false);
        const [modalAdvertenciaIdInvalido, setModalAdvertenciaIdInvalido] = useState(false);
        const [modalAdvertenciaMateriaAgregada, setModalAdvertenciaMateriaAgregada] = useState(false);
        const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] = useState(false);
        const [modalLotesUsados, setModalLotesUsados] = useState(false);
        const [lotesUsadosProducto, setLotesUsadosProducto] = useState([]);
        const [modalErrorStockInsuficiente, setModalErrorStockInsuficiente] = useState(false); // Modal para cantidad > maxFabricable
        const [costoInput, setCostoInput] = useState(0); // Estado temporal para costo
        const [precioInput, setPrecioInput] = useState(0); // Estado temporal para precio
        const [nuevaCantidad, setNuevaCantidad] = useState(0); // Ahora representa "cantidad a fabricar" (incremento)

        // Estados de categorías
        const [categorias, setCategorias] = useState([]); // Categorías dinámicas
        const [modalCategoriaAbierta, setModalCategoriaAbierta] = useState(false);
        const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
        const [nuevaCategoria, setNuevaCategoria] = useState({ idCategoria: 0, nombre: "" });
        const [modoEdicionCategoria, setModoEdicionCategoria] = useState(false);
        const [modalConfirmDeleteCategoria, setModalConfirmDeleteCategoria] = useState(false);
        const [categoriaToDelete, setCategoriaToDelete] = useState(null);
        const [productosAsociadosToDelete, setProductosAsociadosToDelete] = useState([]);

        // Paginacion para categorias
        const [currentPageCategorias, setCurrentPageCategorias] = useState(1);
        const [itemsPerPageCategorias] = useState(5);

        // Validar datos de localStorage
        const validateData = (data, key) => {
            try {
                return data && Array.isArray(JSON.parse(data)) ? JSON.parse(data) : [];
            } catch {
                console.warn(`Datos corruptos en localStorage para ${key}`);
                return [];
            }
        };

        // helper para headers (usa accessToken en localStorage o token prop)
        const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken") || token}` });

        // const handleApiError = (err, context) => {
        //     console.error(`Error en ${context}:`, {
        //         status: err.response?.status,
        //         data: err.response?.data,
        //         message: err.message,
        //     });
        //     if (err.response?.status === 401) {
        //         setError("Sesión expirada o permisos insuficientes. Por favor, inicia sesión nuevamente.");
        //         localStorage.removeItem("accessToken");
        //         window.location.href = "/login";
        //     } else {
        //         setError(err.response?.data?.message || `Error en ${context}. Intenta de nuevo.`);
        //     }
        // };

        // Cargar datos iniciales desde el backend
        useEffect(() => {
            const fetchData = async () => {
                if (!token) {
                    setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                    setIsLoading(false);
                    return;
                }

                try {
                    const headers = authHeaders();
                    const [productosRes, lotesUsadosRes, produccionesRes, produccionesLotesRes] = await Promise.all([
                        api.get("/inventarioProducto", { headers }),
                        api.get("/lotes-usados", { headers }).catch(() => ({ data: [] })),
                        api.get("/producciones", { headers }).catch(() => ({ data: [] })),
                        api.get("/producciones-lotes", { headers }).catch(() => ({ data: [] })),
                    ]);

                    setRegistros(productosRes.data);
                    setLotesUsadosEnProductos(lotesUsadosRes.data);
                    setProducciones(produccionesRes.data);
                    setProduccionesLotes(produccionesLotesRes.data);
                    localStorage.setItem("productos", JSON.stringify(productosRes.data));
                    setIsLoading(false);
                } catch (err) {
                    handleApiError(err, "carga de datos de productos");
                    setRegistros(validateData(localStorage.getItem("productos"), "productos"));
                    setIsLoading(false);
                }
            };
            fetchData();
        }, [token]);

        // Cargar categorías dinámicamente desde el backend
        useEffect(() => {
            const fetchCategorias = async () => {
                if (!token) return;
                try {
                    const headers = authHeaders();
                    const response = await api.get("/categorias", { headers });
                    setCategorias(response.data);
                } catch (err) {
                    handleApiError(err, "carga de categorías");
                }
            };
            fetchCategorias();
        }, [token]);

        // Exponer método para abrir modal de agregar desde el padre
        useImperativeHandle(ref, () => ({
            abrirModalAgregar: () => {
                setProductoSeleccionado(null);
                setMateriasProducto([]);
                setCostoTotal(0);
                setCostoModificadoManually(false);
                setFormularioTemp({ porcentajeGanancia: 15 });
                setCostoInput(0);
                setPrecioInput(0);
                setModalAbierta(true);
            },
        }));

        // Calcular costo total y precio basado en materias (redondeando a múltiplos de 50)
        useEffect(() => {
            if (!costoModificadoManually) {
                const nuevoCosto = materiasProducto.reduce((acc, mat) => {
                    const inv = registrosMateria.find((m) => m.idMateria === mat.idMateria);
                    return acc + (inv?.costo || 0) * mat.cantidad;
                }, 0);
                const costoRedondeado = Math.round(nuevoCosto / 50) * 50; // Redondear a múltiplo de 50
                setCostoTotal(costoRedondeado);
                setCostoInput(costoRedondeado);
                setPrecioInput(Math.round(costoRedondeado * (1 + (formularioTemp.porcentajeGanancia || 15) / 100) / 50) * 50); // Redondear precio a múltiplo de 50
                setFormularioTemp((prev) => ({
                    ...prev,
                    precio: Math.round(costoRedondeado * (1 + (prev.porcentajeGanancia || 15) / 100) / 50) * 50, // Redondear a múltiplo de 50
                }));
            }
        }, [materiasProducto, costoModificadoManually, registrosMateria, formularioTemp.porcentajeGanancia]);

        // Formatear fechas y monedas
        const formatDateTime = (dateString) => {
            if (!dateString || dateString === "N/A") return "N/A";
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("es-CO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).format(date);
        };

        const formatCurrency = (value) => {
            return new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
            }).format(value);
        };

        // Abrir modal de edición
        const abrirModalEditar = (producto) => {
            setProductoSeleccionado(producto);
            setMateriasProducto(producto.materias || []);
            setCostoTotal(producto.costo || 0);
            setCostoModificadoManually(true);
            setFormularioTemp({
                idProducto: producto.idProducto,
                nombre: producto.nombre,
                precio: producto.precio || 0,
                porcentajeGanancia: producto.costo > 0 ? Math.round(((producto.precio / producto.costo) - 1) * 100) : 15,
                idCategoria: producto.idCategoria?.idCategoria || "", // Cargar la categoría por defecto
            });
            setCostoInput(producto.costo || 0);
            setPrecioInput(producto.precio || 0);
            setModalAbierta(true);
        };

        // Abrir modal de stock con cálculo de máximo fabricable
        const abrirModalStock = (producto) => {
            setProductoStock(producto);
            if (producto?.materias?.length) {
                const cantidadesPosibles = producto.materias.map((mat) => {
                    const lotes = lotesMateriaPrima
                        .filter((lote) => lote.idMateria === mat.idMateria && lote.cantidadDisponible > 0)
                        .sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));
                    let cantidadNecesaria = mat.cantidad;
                    let unidadesPosibles = Infinity;
                    for (const lote of lotes) {
                        if (cantidadNecesaria <= 0) break;
                        const disponible = lote.cantidadDisponible;
                        const unidades = Math.floor(disponible / mat.cantidad);
                        unidadesPosibles = Math.min(unidadesPosibles, unidades);
                        cantidadNecesaria -= disponible;
                    }
                    return cantidadNecesaria <= 0 ? unidadesPosibles : 0;
                });
                setMaxFabricable(Math.min(...cantidadesPosibles));
            } else {
                setMaxFabricable(0);
            }
            setNuevaCantidad(0); // Reiniciamos la "cantidad a fabricar"
            setModalStock(true);
        };

        // Abrir modal de lotes usados
        const abrirModalLotesUsados = (producto) => {
            const lotesUsados = lotesUsadosEnProductos
                .filter((lu) => lu.idProducto === producto.idProducto)
                .map((lu) => {
                    const lote = lotesMateriaPrima.find((l) => l.idLote === lu.idLote);
                    const produccionLote = produccionesLotes.find(
                        (pl) => pl.idLote === lu.idLote && pl.cantidadUsadaDelLote === lu.cantidadUsada
                    );
                    return {
                        ...lu,
                        materiaNombre: registrosMateria.find((m) => m.idMateria === lote?.idMateria)?.nombre || "N/A",
                        proveedorNombre: lote?.idProveedor
                            ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                            : "Manual",
                        cantidadInicial: lote?.cantidad || 0,
                        cantidadDisponible: lote?.cantidadDisponible || 0,
                        fechaIngreso: formatDateTime(lote?.fechaIngreso),
                        fechaProduccion: formatDateTime(lu.fechaProduccion),
                        idProduccion: produccionLote?.idProduccion || "N/A",
                    };
                })
                .sort((a, b) => new Date(a.fechaProduccion) - new Date(b.fechaProduccion));
            setLotesUsadosProducto(lotesUsados);
            setModalLotesUsados(true);
        };

        // Verificar si un producto puede eliminarse (sin lotes usados ni producciones)
        const canDeleteProduct = (idProducto) => {
            const hasLotesUsados = lotesUsadosEnProductos.some((lu) => lu.idProducto === idProducto);
            const hasProducciones = producciones.some((p) => p.idProducto === idProducto);
            return !hasLotesUsados && !hasProducciones;
        };

        const abrirModalCategoria = (categoria = null) => {
            setCategoriaSeleccionada(categoria);
            setModoEdicionCategoria(!!categoria);
            setNuevaCategoria(categoria ? { idCategoria: categoria.idCategoria, nombre: categoria.nombre } : { idCategoria: 0, nombre: "" });
            setModalCategoriaAbierta(true);
        };

        const guardarCategoria = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }
            if (!nuevaCategoria.nombre.trim()) {
                setError("El nombre de la categoría no puede estar vacío.");
                return;
            }

            try {
                const headers = authHeaders();
                if (modoEdicionCategoria) {
                    await api.put(`/categorias/${nuevaCategoria.idCategoria}`, { nombre: nuevaCategoria.nombre }, { headers });
                    setCategorias((prev) =>
                        prev.map((c) => (c.idCategoria === nuevaCategoria.idCategoria ? { ...c, nombre: nuevaCategoria.nombre } : c))
                    );
                } else {
                    const response = await api.post("/categorias", { nombre: nuevaCategoria.nombre }, { headers });
                    setCategorias((prev) => [...prev, response.data]);
                }
                setModalCategoriaAbierta(false);
                setNuevaCategoria({ idCategoria: 0, nombre: "" });
            } catch (err) {
                handleApiError(err, "gestión de categoría");
            }
        };

        const eliminarCategoria = async (idCategoria, options = { force: false }) => {
            // Si solo se llamó desde botón "Confirmar" del modal, options.force debería ser true
            const asociados = registros.filter((p) => p.idCategoria?.idCategoria === idCategoria);

            if (!options.force && asociados.length > 0) {
                setCategoriaToDelete(idCategoria);
                setProductosAsociadosToDelete(asociados);
                setModalConfirmDeleteCategoria(true);
                return;
            }

            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }

            try {
                const headers = { Authorization: `Bearer ${token}` };

                // Si hay productos asociados y se forza la eliminación, actualizarlos a idCategoria = null
                if (asociados.length > 0 && options.force) {
                    await Promise.all(
                        asociados.map((p) => {
                            const body = {
                                idProducto: p.idProducto,
                                nombre: p.nombre,
                                costo: p.costo ?? 0,
                                precio: p.precio ?? 0,
                                stock: p.stock ?? 0,
                                iva: p.iva ?? 0,
                                idCategoria: null,
                                materias: p.materias ?? [],
                            };
                            return api.put(`/inventarioProducto/${p.idProducto}`, body, { headers });
                        })
                    );
                }

                // Eliminar la categoría
                await api.delete(`/categorias/${idCategoria}`, { headers });

                // Refrescar datos
                const [productosRes, categoriasRes] = await Promise.all([
                    api.get("/inventarioProducto", { headers }),
                    api.get("/categorias", { headers }),
                ]);
                setRegistros(productosRes.data);
                localStorage.setItem("productos", JSON.stringify(productosRes.data));
                setCategorias(categoriasRes.data);
                setModalConfirmDeleteCategoria(false);
                setCategoriaToDelete(null);
                setProductosAsociadosToDelete([]);
            } catch (err) {
                console.error("Error eliminando categoría:", err);
                setError(
                    err.response?.data?.message ||
                    (err.code === "ERR_NETWORK" ? "Error de conexión con el servidor. Verifica tu red o el backend." : "Error eliminando categoría.")
                );
            }
        };

        // Guardar producto
        const guardarProducto = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }
            const idProducto = Number(formularioTemp.idProducto);
            if (idProducto <= 0) {
                setError("El ID del producto debe ser mayor que 0");
                return;
            }
            const costoRedondeado = Math.round(costoInput / 50) * 50;
            const precioRedondeado = Math.round(precioInput / 50) * 50;
            if (costoRedondeado < 0 || precioRedondeado < 0) {
                setError("El costo y el precio deben ser mayores o iguales a 0");
                return;
            }
            if (!productoSeleccionado && registros.some((p) => p.idProducto === idProducto)) {
                setModalAdvertenciaIdDuplicado(true);
                return;
            }
            const nuevo = {
                idProducto,
                nombre: formularioTemp.nombre,
                costo: costoRedondeado,
                precio: precioRedondeado,
                idCategoria: formularioTemp.idCategoria ? { idCategoria: Number(formularioTemp.idCategoria) } : null,
                materias: materiasProducto,
            };

            console.log("Objeto enviado:", nuevo);
            try {
                const headers = authHeaders();
                if (productoSeleccionado) {
                    await api.put(`/inventarioProducto/${idProducto}`, nuevo, { headers });
                    setRegistros((prev) => prev.map((p) => (p.idProducto === idProducto ? nuevo : p)));
                } else {
                    const response = await api.post("/inventarioProducto", nuevo, { headers });
                    setRegistros((prev) => [...prev, response.data]);
                }
                localStorage.setItem("productos", JSON.stringify(registros));
                setModalAbierta(false);
                setProductoSeleccionado(null);
                setMateriasProducto([]);
                setCostoTotal(costoRedondeado);
                setCostoModificadoManually(false);
                setFormularioTemp({ porcentajeGanancia: 15 });
                setCostoInput(costoRedondeado);
                setPrecioInput(precioRedondeado);
            } catch (err) {
                handleApiError(err, "guardado de producto");
            }
        };

        // Agregar o editar materia al producto
        const agregarMateriaAlProducto = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const idMateria = Number(materiaNueva.idMateria);
            const cantidad = Number(materiaNueva.cantidad);
            if (idMateria <= 0) {
                setError("El ID de la materia prima debe ser mayor que 0");
                return;
            }
            if (cantidad <= 0) {
                setError("La cantidad debe ser mayor que 0");
                return;
            }
            const materia = registrosMateria.find((m) => m.idMateria === idMateria);
            if (!materia) {
                setModalAdvertenciaIdInvalido(true);
                return;
            }
            const nuevaMateria = { idMateria, nombre: materia.nombre, cantidad };
            const nuevasMaterias = [...materiasProducto];

            if (modoEdicionMateria && indiceEdicionMateria !== null) {
                nuevasMaterias[indiceEdicionMateria] = nuevaMateria;
            } else {
                if (materiasProducto.find((m) => m.idMateria === idMateria)) {
                    setModalAdvertenciaMateriaAgregada(true);
                    return;
                }
                nuevasMaterias.push(nuevaMateria);
            }

            setMateriasProducto(nuevasMaterias);
            setModoEdicionMateria(false);
            setIndiceEdicionMateria(null);
            setMateriaNueva({ idMateria: 0, cantidad: 0 });
            setModalMateriaAbierta(false);
            setCostoModificadoManually(false);
        };

        // Actualizar stock delegando al backend
        // Ahora: el input representa "cantidad a fabricar" (incremento), no el stock absoluto.
        const actualizarStock = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }

            // Evitar shadowing: nuevaCantidadInt es el número de unidades a fabricar (incremento)
            const nuevaCantidadInt = parseInt(nuevaCantidad, 10);
            if (isNaN(nuevaCantidadInt) || nuevaCantidadInt < 0) {
                setError("La cantidad debe ser mayor o igual a 0");
                return;
            }
            // Verificamos contra maxFabricable el incremento (no el stock absoluto)
            if (maxFabricable !== null && nuevaCantidadInt > maxFabricable) {
                setModalErrorStockInsuficiente(true);
                return;
            }

            try {
                const headers = authHeaders();
                // Calcular nuevo stock sumando el incremento al stock actual (evita sobrescribir con el valor pequeño)
                const currentStock = productoStock?.stock || 0;
                const newStockToSend = currentStock + nuevaCantidadInt;

                const response = await api.put(
                    `/inventarioProducto/${productoStock.idProducto}/stock`,
                    { nuevaCantidad: newStockToSend },
                    { headers }
                );

                // Usar el stock que devuelve el backend si viene, sino usar el newStockToSend calculado
                const updatedStockValue = response?.data?.stock ?? newStockToSend;

                // Actualizar registros inmediatamente y localStorage
                setRegistros((prev) => {
                    const updated = prev.map((p) =>
                        p.idProducto === productoStock.idProducto ? { ...p, stock: updatedStockValue } : p
                    );
                    localStorage.setItem("productos", JSON.stringify(updated));
                    return updated;
                });

                // Refrescar lotes y producciones para reflejar cambios
                const [lotesUsadosRes, produccionesRes, produccionesLotesRes, lotesMateriaPrimaRes] = await Promise.all([
                    api.get("/lotes-usados", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones-lotes", { headers }).catch(() => ({ data: [] })),
                    api.get("/lotes-materia-prima", { headers }).catch(() => ({ data: [] })) // Nueva consulta
                ]);
                setLotesUsadosEnProductos(lotesUsadosRes.data);
                setProducciones(produccionesRes.data);
                setProduccionesLotes(produccionesLotesRes.data);
                // Actualizamos los lotes de materia prima en el padre (prop)
                if (typeof setLotesMateriaPrima === "function") {
                    setLotesMateriaPrima(lotesMateriaPrimaRes.data);
                }

                setModalStock(false);
                setNuevaCantidad(0);
            } catch (err) {
                handleApiError(err, "actualización de stock");
            }
        };

        // Paginación: Calcular índices (productos)
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = registros.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(registros.length / itemsPerPage);

        // Paginacion de las categorias
        const indexOfLastCategoria = currentPageCategorias * itemsPerPageCategorias;
        const indexOfFirstCategoria = indexOfLastCategoria - itemsPerPageCategorias;
        const currentCategorias = categorias.slice(indexOfFirstCategoria, indexOfLastCategoria);
        const totalPagesCategorias = Math.ceil(categorias.length / itemsPerPageCategorias);

        if (isLoading) {
            return <div className="text-center mt-5">Cargando productos...</div>;
        }

        return (
            <div className="container inventario">
                <button
                    type="button"
                    className="btn btn-primary mb-3"
                    onClick={() => abrirModalCategoria()}
                    style={{ position: "relative", zIndex: 0 }}
                >
                    Gestionar Categorías
                </button>
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
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Costo</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Categoría</th>
                            <th>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((p) => (
                            <tr key={p.idProducto}>
                                <td>{p.idProducto}</td>
                                <td>{p.nombre}</td>
                                <td>{formatCurrency(p.costo)}</td>
                                <td>{formatCurrency(p.precio)}</td>
                                <td>{p.stock || 0}</td>
                                <td>{categorias.find((cat) => cat.idCategoria === p.idCategoria?.idCategoria)?.nombre || "Sin categoría"}</td>
                                <td>
                                    <BotonEditar onClick={() => abrirModalEditar(p)}>Editar</BotonEditar>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => abrirModalStock(p)}
                                    >
                                        Stock
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-info"
                                        onClick={() => abrirModalLotesUsados(p)}
                                    >
                                        Lotes Usados
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Paginación productos */}
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

                <div className="mt-4">
                    <h5>Categorías Existentes</h5>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCategorias.map((c) => (
                                <tr key={c.idCategoria}>
                                    <td>{c.idCategoria}</td>
                                    <td>{c.nombre}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-1"
                                            onClick={() => abrirModalCategoria(c)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => eliminarCategoria(c.idCategoria)}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Paginador de categorías */}
                    <nav>
                        <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPageCategorias === 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPageCategorias(currentPageCategorias - 1)}>
                                    Anterior
                                </button>
                            </li>
                            {Array.from({ length: totalPagesCategorias }, (_, i) => (
                                <li key={i + 1} className={`page-item ${currentPageCategorias === i + 1 ? "active" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPageCategorias(i + 1)}>
                                        {i + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPageCategorias === totalPagesCategorias ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPageCategorias(currentPageCategorias + 1)}>
                                    Siguiente
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                {modalAbierta && (
                    <Modal isOpen={modalAbierta} onClose={() => setModalAbierta(false)}>
                        <form onSubmit={guardarProducto}>
                            <div className="mb-3 text-center">
                                <h4>{productoSeleccionado ? "Editar" : "Agregar"} Producto</h4>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Nombre</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formularioTemp.nombre || ""}
                                    required
                                    onChange={(e) =>
                                        setFormularioTemp((prev) => ({ ...prev, nombre: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Costo Unitario (COP)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={costoInput}
                                    min="0"
                                    onChange={(e) => {
                                        const value = Number(e.target.value) || 0;
                                        setCostoInput(value);
                                        setCostoModificadoManually(true);
                                    }}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Porcentaje de Ganancia (%)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formularioTemp.porcentajeGanancia || 15}
                                    min="0"
                                    step="1"
                                    required
                                    onChange={(e) => {
                                        const porcentaje = Math.round(Number(e.target.value) || 15);
                                        setFormularioTemp((prev) => ({
                                            ...prev,
                                            porcentajeGanancia: porcentaje,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Precio Unitario (COP)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={precioInput}
                                    min="0"
                                    required
                                    onChange={(e) => {
                                        const value = Number(e.target.value) || 0;
                                        setPrecioInput(value);
                                    }}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Categoría</label>
                                <select
                                    className="form-select"
                                    value={formularioTemp.idCategoria || ""}
                                    onChange={(e) =>
                                        setFormularioTemp((prev) => ({ ...prev, idCategoria: Number(e.target.value) || null }))
                                    }
                                >
                                    <option value="">Sin categoría</option>
                                    {categorias.map((c) => (
                                        <option key={c.idCategoria} value={c.idCategoria}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <h6 className="text-center">Materias Primas</h6>
                            <table className="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Cantidad</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materiasProducto.map((m, i) => {
                                        const materia = registrosMateria.find((rm) => rm.idMateria === m.idMateria);
                                        return (
                                            <tr key={i}>
                                                <td>{m.idMateria}</td>
                                                <td>{materia ? materia.nombre : "N/A"}</td>
                                                <td>{m.cantidad}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-1"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setModoEdicionMateria(true);
                                                            setIndiceEdicionMateria(i);
                                                            setMateriaNueva({ idMateria: m.idMateria, cantidad: m.cantidad });
                                                            setModalMateriaAbierta(true);
                                                        }}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const copia = [...materiasProducto];
                                                            copia.splice(i, 1);
                                                            setMateriasProducto(copia);
                                                            setCostoModificadoManually(false);
                                                        }}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <button
                                type="button"
                                className="btn btn-success mt-2"
                                onClick={() => {
                                    setModoEdicionMateria(false);
                                    setMateriaNueva({ idMateria: 0, cantidad: 0 });
                                    setModalMateriaAbierta(true);
                                }}
                            >
                                Agregar Materia Prima
                            </button>
                            <div className="d-flex justify-content-end mt-3">
                                <BotonCancelar onClick={() => setModalAbierta(false)} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}

                {modalMateriaAbierta && (
                    <Modal isOpen={modalMateriaAbierta} onClose={() => setModalMateriaAbierta(false)}>
                        <form onSubmit={agregarMateriaAlProducto}>
                            <h5 className="text-center">{modoEdicionMateria ? "Editar" : "Agregar"} Materia Prima</h5>
                            <div className="mb-3">
                                <label className="form-label">Materia Prima</label>
                                <select
                                    className="form-select"
                                    value={materiaNueva.idMateria || ""}
                                    disabled={modoEdicionMateria}
                                    onChange={(e) => setMateriaNueva({ ...materiaNueva, idMateria: Number(e.target.value) || 0 })}
                                    required
                                >
                                    <option value="">Selecciona una materia prima</option>
                                    {registrosMateria.map((m) => (
                                        <option key={m.idMateria} value={m.idMateria}>
                                            {m.nombre} (ID: {m.idMateria})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Cantidad Requerida</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={materiaNueva.cantidad || ""}
                                    min="1"
                                    required
                                    onChange={(e) =>
                                        setMateriaNueva({
                                            ...materiaNueva,
                                            cantidad: e.target.value === "" ? 0 : Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <div className="d-flex justify-content-end">
                                <BotonCancelar onClick={() => setModalMateriaAbierta(false)} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}

                {modalStock && (
                    <Modal isOpen={modalStock} onClose={() => setModalStock(false)}>
                        <form onSubmit={actualizarStock}>
                            <h5 className="text-center">Fabricar unidades de {productoStock?.nombre}</h5>
                            {maxFabricable !== null && (
                                <div className="alert alert-info">
                                    Puedes fabricar hasta <strong>{maxFabricable}</strong> unidades con el inventario actual.
                                </div>
                            )}
                            <div className="alert alert-primary">
                                Cantidad actual es <strong>{productoStock?.stock}</strong> unidades.
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Cantidad a fabricar</label>
                                <input
                                    name="stockCantidad"
                                    type="number"
                                    required
                                    className="form-control"
                                    min="0"
                                    value={nuevaCantidad}
                                    onChange={(e) => setNuevaCantidad(Number(e.target.value) || 0)}
                                />
                                <div className="form-text">Introduce cuántas unidades quieres fabricar (incremento).</div>
                            </div>
                            <div className="d-flex justify-content-end">
                                <BotonCancelar onClick={() => setModalStock(false)} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}

                {modalAdvertenciaPocoStock && (
                    <Modal isOpen={modalAdvertenciaPocoStock} onClose={() => setModalAdvertenciaPocoStock(false)}>
                        <div className="encabezado-modal">
                            <h2>Advertencia</h2>
                        </div>
                        <p className="text-center">¡Materia prima <strong>Insuficiente</strong> para aumentar el stock!</p>
                        <div className="modal-footer">
                            <BotonAceptar onClick={() => setModalAdvertenciaPocoStock(false)} />
                        </div>
                    </Modal>
                )}

                {modalAdvertenciaIdInvalido && (
                    <Modal isOpen={modalAdvertenciaIdInvalido} onClose={() => setModalAdvertenciaIdInvalido(false)}>
                        <div className="encabezado-modal">
                            <h2>Advertencia</h2>
                        </div>
                        <p className="text-center">
                            ¡No existe ninguna Materia prima con el ID <strong>{materiaNueva.idMateria}</strong>!
                        </p>
                        <div className="modal-footer">
                            <BotonAceptar onClick={() => setModalAdvertenciaIdInvalido(false)} />
                        </div>
                    </Modal>
                )}

                {modalAdvertenciaMateriaAgregada && (
                    <Modal
                        isOpen={modalAdvertenciaMateriaAgregada}
                        onClose={() => setModalAdvertenciaMateriaAgregada(false)}
                    >
                        <div className="encabezado-modal">
                            <h2>Advertencia</h2>
                        </div>
                        <p className="text-center">
                            ¡La materia prima con el ID <strong>{materiaNueva.idMateria}</strong> ya está agregada!
                        </p>
                        <div className="modal-footer">
                            <BotonAceptar onClick={() => setModalAdvertenciaMateriaAgregada(false)} />
                        </div>
                    </Modal>
                )}

                {modalAdvertenciaIdDuplicado && (
                    <Modal
                        isOpen={modalAdvertenciaIdDuplicado}
                        onClose={() => setModalAdvertenciaIdDuplicado(false)}
                    >
                        <div className="encabezado-modal">
                            <h2>Advertencia</h2>
                        </div>
                        <p className="text-center">
                            ¡Ya existe un producto con el ID <strong>{formularioTemp.idProducto}</strong>!
                        </p>
                        <div className="modal-footer">
                            <BotonAceptar onClick={() => setModalAdvertenciaIdDuplicado(false)} />
                        </div>
                    </Modal>
                )}

                {modalErrorStockInsuficiente && (
                    <Modal isOpen={modalErrorStockInsuficiente} onClose={() => setModalErrorStockInsuficiente(false)}>
                        <div className="encabezado-modal">
                            <h2>Error</h2>
                        </div>
                        <p className="text-center">No cuentas con la materia prima suficiente para crear esa cantidad de productos</p>
                        <div className="modal-footer">
                            <BotonAceptar onClick={() => setModalErrorStockInsuficiente(false)} />
                        </div>
                    </Modal>
                )}

                {modalLotesUsados && (
                    <Modal isOpen={modalLotesUsados} onClose={() => setModalLotesUsados(false)}>
                        <div style={{ position: "relative" }}>
                            <button
                                type="button"
                                className="btn-close"
                                style={{ position: "absolute", top: "10px", right: "10px" }}
                                onClick={() => setModalLotesUsados(false)}
                                aria-label="Close"
                            ></button>
                            <h2 className="mb-3">Lotes Usados en Producto</h2>
                            <div className="row g-3">
                                {lotesUsadosProducto.map((lu) => (
                                    <div key={lu.id} className="col-md-12">
                                        <div className="card shadow-sm h-100">
                                            <div className="card-body">
                                                <h5 className="card-title">Lote #{lu.idLote}</h5>
                                                <p className="card-text">
                                                    <strong>Materia Prima:</strong> {lu.materiaNombre}
                                                    <br />
                                                    <strong>Cantidad Inicial:</strong> {lu.cantidadInicial} unidades
                                                    <br />
                                                    <strong>Cantidad Disponible:</strong> {lu.cantidadDisponible} unidades
                                                    <br />
                                                    <strong>Cantidad Usada:</strong> {lu.cantidadUsada} unidades
                                                    <br />
                                                    <strong>ID Producción:</strong> {lu.idProduccion}
                                                    <br />
                                                    <strong>Fecha Ingreso:</strong> {lu.fechaIngreso}
                                                    <br />
                                                    <strong>Fecha Producción:</strong> {lu.fechaProduccion}
                                                    <br />
                                                    <strong>Proveedor:</strong> {lu.proveedorNombre}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer mt-4">
                                <BotonAceptar onClick={() => setModalLotesUsados(false)} />
                            </div>
                        </div>
                    </Modal>
                )}

                {modalCategoriaAbierta && (
                    <Modal isOpen={modalCategoriaAbierta} onClose={() => setModalCategoriaAbierta(false)}>
                        <form onSubmit={guardarCategoria}>
                            <h5 className="text-center">{modoEdicionCategoria ? "Editar" : "Agregar"} Categoría</h5>
                            <div className="mb-3">
                                <label className="form-label">Nombre de la Categoría</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nuevaCategoria.nombre}
                                    required
                                    onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
                                />
                            </div>
                            <div className="d-flex justify-content-end">
                                <BotonCancelar onClick={() => setModalCategoriaAbierta(false)} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}

                {modalConfirmDeleteCategoria && (
                    <Modal isOpen={modalConfirmDeleteCategoria} onClose={() => setModalConfirmDeleteCategoria(false)}>
                        <div className="encabezado-modal">
                            <h2>Advertencia</h2>
                        </div>
                        <p className="text-center">
                            Esta categoría está presente en los productos: {productosAsociadosToDelete.map((p) => p.nombre).join(", ")}. ¿Desea eliminarla y asignar 'Sin categoría' a estos productos?
                        </p>
                        <div className="d-flex justify-content-end">
                            <BotonCancelar onClick={() => setModalConfirmDeleteCategoria(false)} />
                            <BotonAceptar
                                onClick={() => eliminarCategoria(categoriaToDelete, { force: true })}>
                            </BotonAceptar>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }
);

export default TablaProductos;
