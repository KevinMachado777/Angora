import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonAceptar from "./BotonAceptar";
import "../styles/tablaProductos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";

// Componente de tabla de productos
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
        const [formularioTemp, setFormularioTemp] = useState({ porcentajeGanancia: 15, nombre: "", idCategoria: "", iva: null });
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
        const [nuevaCantidad, setNuevaCantidad] = useState(0);

        // Estado para saber qué producto tiene abierta la modal de lotes usados
        const [productoLotesSeleccionado, setProductoLotesSeleccionado] = useState(null);

        // Estado que detecta si el usuario escribió manualmente el precio
        const [precioModificadoManually, setPrecioModificadoManually] = useState(false);

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

        // Paginación para lotes en modal
        const [currentPageLotes, setCurrentPageLotes] = useState(1);
        const [itemsPerPageLotes] = useState(2);

        // Filtro de fecha para lotes
        const [filterDate, setFilterDate] = useState("");

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

        // Manejo de errores
        const handleApiError = (err, context) => {
            console.error(`Error en ${context}:`, {
                status: err?.response?.status,
                data: err?.response?.data,
                message: err?.message,
            });
            if (err?.response?.status === 401) {
                setError("Sesión expirada o permisos insuficientes. Por favor, inicia sesión nuevamente.");
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            } else {
                setError(err?.response?.data?.message || `Error en ${context}. Intenta de nuevo.`);
            }
        };

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
                setFormularioTemp({ porcentajeGanancia: 15, nombre: "", idCategoria: "", iva: null });
                setCostoInput(0);
                setPrecioInput(0);
                setPrecioModificadoManually(false);
                setModalAbierta(true);
            },
        }));

        const getLoteCosto = (lote) => {
            if (!lote) return 0;
            return lote.costo ?? lote.precioUnitario ?? lote.precio ?? lote.valorUnitario ?? 0;
        };

        // Calcular costo total y precio basado en materias
        useEffect(() => {
            if (!costoModificadoManually) {
                const nuevoCosto = materiasProducto.reduce((acc, mat) => {
                    const inv = registrosMateria.find((m) => m.idMateria === mat.idMateria);
                    return acc + (inv?.costo || 0) * mat.cantidad;
                }, 0);
                const costoRedondeado = Math.round(nuevoCosto / 50) * 50; // Redondear a múltiplo de 50
                setCostoTotal(costoRedondeado);
                setCostoInput(costoRedondeado);
                // Solo recalcular precio si el usuario no lo modificó manualmente
                if (!precioModificadoManually) {
                    const precioCalc = Math.round(costoRedondeado * (1 + (formularioTemp.porcentajeGanancia || 15) / 100) / 50) * 50;
                    setPrecioInput(precioCalc);
                }
                setFormularioTemp((prev) => ({
                    ...prev,
                    precio: Math.round(costoRedondeado * (1 + (prev.porcentajeGanancia || 15) / 100) / 50) * 50,
                }));
            }
        }, [materiasProducto, costoModificadoManually, registrosMateria]);

        // Recalcular precio cuando cambia solo el porcentaje (y el usuario NO modificó precio manualmente)
        useEffect(() => {
            if (!precioModificadoManually) {
                const costo = Number(costoInput || 0);
                const porcentaje = Number(formularioTemp.porcentajeGanancia || 15);
                const nuevoPrecio = Math.round(costo * (1 + porcentaje / 100) / 50) * 50;
                setPrecioInput(nuevoPrecio);
            }
        }, [formularioTemp.porcentajeGanancia, costoInput]);

        // Cuando cambian lotesMateriaPrima -> actualizar costos por materia y recalcular productos
        useEffect(() => {
            if (!lotesMateriaPrima) return;

            // calcular mapa 
            const materiaCostMap = {};
            const lotesByMateria = {};
            for (const lote of lotesMateriaPrima) {
                const idM = lote.idMateria;
                if (!idM) continue;
                if (!lotesByMateria[idM]) lotesByMateria[idM] = [];
                lotesByMateria[idM].push(lote);
            }
            Object.keys(lotesByMateria).forEach((idM) => {
                const lotes = lotesByMateria[idM];
                let numer = 0;
                let denom = 0;
                for (const lote of lotes) {
                    const c = getLoteCosto(lote);
                    const q = (Number(lote.cantidad) || 0);
                    numer += c * q;
                    denom += q;
                }
                const avg = denom > 0 ? Math.round((numer / denom) / 1) : 0; // sin redondeo aún
                materiaCostMap[Number(idM)] = avg || 0;
            });

            // Recalcular productos que usan estas materias
            const updated = registros.map((p) => {
                if (!p.materias || p.materias.length === 0) return p;
                let changed = false;
                let newCostoRaw = 0;
                for (const m of p.materias) {
                    const costoMat = materiaCostMap[m.idMateria] ?? (registrosMateria.find(r => r.idMateria === m.idMateria)?.costo ?? 0);
                    newCostoRaw += (costoMat || 0) * (m.cantidad || 0);
                }
                const newCosto = Math.round(newCostoRaw / 50) * 50;
                const oldCosto = Number(p.costo || 0);
                const oldPrecio = Number(p.precio || 0);
                let newPrecio = oldPrecio;
                if (oldCosto > 0) {
                    const markup = oldPrecio / oldCosto;
                    newPrecio = Math.round(newCosto * markup / 50) * 50;
                } else {
                    // fallback: usar porcentaje default 15%
                    newPrecio = Math.round(newCosto * 1.15 / 50) * 50;
                }
                if (newCosto !== p.costo || newPrecio !== p.precio) {
                    changed = true;
                }
                return changed ? { ...p, costo: newCosto, precio: newPrecio } : p;
            });

            const changed = JSON.stringify(updated) !== JSON.stringify(registros);
            if (changed) {
                setRegistros(updated);
                localStorage.setItem("productos", JSON.stringify(updated));
            }
        }, [lotesMateriaPrima]);

        // También recalcular si cambian registrosMateria
        useEffect(() => {
            if (!registrosMateria || registrosMateria.length === 0) return;
            const updated = registros.map((p) => {
                if (!p.materias || p.materias.length === 0) return p;
                const newCostoRaw = p.materias.reduce((acc, m) => {
                    const mat = registrosMateria.find((rm) => rm.idMateria === m.idMateria);
                    return acc + ((mat?.costo || 0) * (m.cantidad || 0));
                }, 0);
                const newCosto = Math.round(newCostoRaw / 50) * 50;
                const oldCosto = Number(p.costo || 0);
                const oldPrecio = Number(p.precio || 0);
                let newPrecio = oldPrecio;
                if (oldCosto > 0) {
                    const markup = oldPrecio / oldCosto;
                    newPrecio = Math.round(newCosto * markup / 50) * 50;
                } else {
                    newPrecio = Math.round(newCosto * 1.15 / 50) * 50;
                }
                if (newCosto !== p.costo || newPrecio !== p.precio) {
                    return { ...p, costo: newCosto, precio: newPrecio };
                }
                return p;
            });
            const changed = JSON.stringify(updated) !== JSON.stringify(registros);
            if (changed) {
                setRegistros(updated);
                localStorage.setItem("productos", JSON.stringify(updated));
            }
        }, [registrosMateria]);

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
            const costoVal = Number(producto.costo || 0);
            const precioVal = Number(producto.precio || 0);
            const porcentajeComputed = costoVal > 0 ? Math.round(((precioVal / costoVal) - 1) * 100) : (formularioTemp.porcentajeGanancia || 15);

            setFormularioTemp({
                idProducto: producto.idProducto,
                nombre: producto.nombre,
                precio: precioVal,
                porcentajeGanancia: Number.isFinite(porcentajeComputed) ? porcentajeComputed : (formularioTemp.porcentajeGanancia || 15),
                idCategoria: producto.idCategoria?.idCategoria || "",
                iva: producto.iva === undefined || producto.iva === null ? false : Boolean(producto.iva),
            });
            setCostoInput(costoVal);
            setPrecioInput(precioVal);
            setPrecioModificadoManually(false);
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
                    let totalDisponible = 0;
                    for (const lote of lotes) {
                        totalDisponible += lote.cantidadDisponible;
                    }
                    return Math.floor(totalDisponible / mat.cantidad);
                });
                setMaxFabricable(Math.min(...cantidadesPosibles));
            } else {
                setMaxFabricable(0);
            }
            setNuevaCantidad(0); // Reiniciamos la "cantidad a fabricar"
            setModalStock(true);
        };

        const abrirModalLotesUsados = (producto) => {
            setProductoLotesSeleccionado(producto);
            setCurrentPageLotes(1); // reset paginación al abrir
            setModalLotesUsados(true);
        };

        // Resolución robusta de idProduccion para un registro de lote usado 
        const resolveIdProduccionForLu = (lu) => {
            if (lu.idProduccion !== undefined && lu.idProduccion !== null) {
                return lu.idProduccion;
            }

            if (producciones && producciones.length > 0 && lu.fechaProduccion) {
                try {
                    const fechaLu = new Date(lu.fechaProduccion).getTime();
                    // buscar produccion que tenga mismo idProducto y fecha dentro de 2 minutos (120000 ms)
                    const candidate = producciones.find(p => {
                        if (Number(p.idProducto) !== Number(lu.idProducto)) return false;
                        const fp = p.fechaProduccion ?? p.fecha ?? p.createdAt ?? null;
                        if (!fp) return false;
                        const diff = Math.abs(new Date(fp).getTime() - fechaLu);
                        return diff <= 120000; // 2 minutos de tolerancia
                    });
                    if (candidate) return candidate.idProduccion ?? candidate.id ?? candidate.id_produccion ?? "N/A";
                } catch {
                    // ignore parse errors
                }
            }

            // Intentar emparejar en produccionesLotes por idLote + cantidad + fecha cercana
            if (produccionesLotes && produccionesLotes.length > 0) {
                const qtyLu = Number(lu.cantidadUsada ?? lu.cantidad ?? 0);
                const fechaLu = lu.fechaProduccion ? new Date(lu.fechaProduccion).getTime() : null;
                let candidate = produccionesLotes.find(pl => Number(pl.idLote) === Number(lu.idLote) && Math.abs((Number(pl.cantidadUsadaDelLote ?? pl.cantidadUsada ?? 0) - qtyLu)) < 1e-6);
                if (!candidate && fechaLu) {
                    // fallback a proximidad temporal + idLote
                    candidate = produccionesLotes.find(pl => {
                        if (Number(pl.idLote) !== Number(lu.idLote)) return false;
                        const fp = pl.fechaProduccion ?? pl.fecha ?? null;
                        if (!fp) return false;
                        const diff = Math.abs(new Date(fp).getTime() - fechaLu);
                        return diff <= 120000;
                    });
                }
                if (candidate) return (candidate.idProduccion ?? candidate.id_produccion ?? candidate.id) || "N/A";
            }

            return "N/A";
        };

        // Reconstruye y filtra lotesUsadosProducto de forma reactiva,
        useEffect(() => {
            if (!modalLotesUsados || !productoLotesSeleccionado) {
                setLotesUsadosProducto([]);
                return;
            }

            // prefiltrar los lotes usados para este producto
            const lotesUsadosParaProducto = lotesUsadosEnProductos.filter((lu) => lu.idProducto === productoLotesSeleccionado.idProducto);

            // Mapear + calcular histórico 
            const mapped = lotesUsadosParaProducto.map((lu) => {
                const lote = lotesMateriaPrima.find((l) => l.idLote === lu.idLote) || {};

                const fechaProduccionRaw = lu.fechaProduccion; // raw timestamp desde backend
                const fechaIngresoRaw = lote.fechaIngreso; // raw timestamp desde lote

                // Formateadas para mostrar
                const fechaProduccion = formatDateTime(fechaProduccionRaw);
                const fechaIngreso = formatDateTime(fechaIngresoRaw);

                // Inicial del lote 
                const cantidadInicial = lote.cantidad ?? 0;

                // Suma acumulada de usos del mismo lote hasta la fecha de esta producción
                const usedUntilThis = lotesUsadosEnProductos
                    .filter((x) => x.idLote === lu.idLote && new Date(x.fechaProduccion) <= new Date(fechaProduccionRaw))
                    .reduce((s, x) => s + (x.cantidadUsada ?? 0), 0);

                // Antes de esta producción: restamos los usos anteriores 
                const cantidadAntesFabricacion = cantidadInicial - (usedUntilThis - (lu.cantidadUsada ?? 0));
                const cantidadUsada = lu.cantidadUsada ?? 0;
                const cantidadDespuesFabricacion = Math.max(0, cantidadAntesFabricacion - cantidadUsada);

                // proveedor
                const proveedorNombre = lote.idProveedor
                    ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                    : "Manual";

                // Buscar produccionLote para obtener idProduccion si existe 
                const idProduccionResolved = resolveIdProduccionForLu(lu);

                return {
                    id: lu.id,
                    idLote: lu.idLote,
                    materiaNombre: registrosMateria.find((m) => m.idMateria === lote?.idMateria)?.nombre || "N/A",
                    proveedorNombre,
                    cantidadInicial,
                    cantidadAntesFabricacion,
                    cantidadUsada,
                    cantidadDespuesFabricacion,
                    fechaIngreso,          // para mostrar
                    fechaProduccion,       // para mostrar
                    fechaIngresoRaw,
                    fechaProduccionRaw,
                    idProduccion: idProduccionResolved,
                    cantidadDisponibleActual: lote?.cantidadDisponible ?? 0,
                };
            });

            // Filtrado por filterDate (reactivo)
            const filtered = mapped.filter((lu) => {
                if (!filterDate) return true;
                if (!lu.fechaProduccionRaw) return false;
                const d = new Date(lu.fechaProduccionRaw);
                if (isNaN(d.getTime())) return false;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                const localDate = `${y}-${m}-${day}`; // YYYY-MM-DD
                return localDate === filterDate;
            });

            const sorted = filtered.sort((a, b) => new Date(a.fechaProduccionRaw) - new Date(b.fechaProduccionRaw));

            setLotesUsadosProducto(sorted);
            setCurrentPageLotes(1);
        }, [
            modalLotesUsados,
            productoLotesSeleccionado,
            filterDate,
            lotesUsadosEnProductos,
            lotesMateriaPrima,
            produccionesLotes,
            registrosMateria,
            proveedores,
            producciones
        ]);

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

            // Validar IVA seleccionado en creación
            if (!productoSeleccionado && (formularioTemp.iva === null || formularioTemp.iva === undefined)) {
                setError("Debes seleccionar si el producto tiene IVA (Sí/No).");
                return;
            }

            // Validar que tenga al menos 1 materia 
            if (!materiasProducto || materiasProducto.length === 0) {
                setError("El producto debe tener al menos 1 materia prima asociada.");
                return;
            }

            // Costos y precio en múltiplos de 50
            const costoRedondeado = Math.round(Number(costoInput || 0) / 50) * 50;
            // Si el usuario NO modificó manualmente el precio, calcular a partir del porcentaje
            const precioRedondeado = !precioModificadoManually
                ? Math.round(costoRedondeado * (1 + Number(formularioTemp.porcentajeGanancia || 15) / 100) / 50) * 50
                : Math.round(Number(precioInput || 0) / 50) * 50;

            if (costoRedondeado < 0 || precioRedondeado < 0) {
                setError("El costo y el precio deben ser mayores o iguales a 0");
                return;
            }

            try {
                const headers = authHeaders();

                if (productoSeleccionado) {
                    const payload = {
                        idProducto: productoSeleccionado.idProducto,
                        nombre: formularioTemp.nombre,
                        costo: costoRedondeado,
                        precio: precioRedondeado,
                        stock: productoSeleccionado.stock ?? 0, // preservamos stock
                        iva: productoSeleccionado.iva ? true : Boolean(formularioTemp.iva), 
                        materias: materiasProducto,
                    };
                    payload.idCategoria = formularioTemp.idCategoria ? { idCategoria: Number(formularioTemp.idCategoria) } : null;

                    await api.put(`/inventarioProducto/${productoSeleccionado.idProducto}`, payload, { headers });

                    // actualizar localmente sin alterar stock
                    setRegistros((prev) => {
                        const updated = prev.map((p) =>
                            p.idProducto === productoSeleccionado.idProducto ? { ...p, ...payload } : p
                        );
                        localStorage.setItem("productos", JSON.stringify(updated));
                        return updated;
                    });
                } else {
                    const payload = {
                        nombre: formularioTemp.nombre,
                        costo: costoRedondeado,
                        precio: precioRedondeado,
                        stock: 0,
                        iva: Boolean(formularioTemp.iva),
                        materias: materiasProducto,
                    };
                    payload.idCategoria = formularioTemp.idCategoria ? { idCategoria: Number(formularioTemp.idCategoria) } : null;

                    const response = await api.post("/inventarioProducto", payload, { headers });
                    const created = response?.data ?? payload;
                    setRegistros((prev) => {
                        const updated = [...prev, created];
                        localStorage.setItem("productos", JSON.stringify(updated));
                        return updated;
                    });
                }

                setModalAbierta(false);
                setProductoSeleccionado(null);
                setMateriasProducto([]);
                setCostoTotal(costoRedondeado);
                setCostoModificadoManually(false);
                setFormularioTemp({ porcentajeGanancia: formularioTemp.porcentajeGanancia ?? 15, nombre: "", idCategoria: "", iva: null });
                setCostoInput(costoRedondeado);
                setPrecioInput(precioRedondeado);
                setPrecioModificadoManually(false);
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
        const actualizarStock = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }

            const nuevaCantidadInt = parseInt(nuevaCantidad, 10);
            if (isNaN(nuevaCantidadInt) || nuevaCantidadInt < 0) {
                setError("La cantidad debe ser mayor o igual a 0");
                return;
            }
            if (maxFabricable !== null && nuevaCantidadInt > maxFabricable) {
                setModalErrorStockInsuficiente(true);
                return;
            }

            try {
                const headers = authHeaders();
                const currentStock = productoStock?.stock || 0;
                const newStockToSend = currentStock + nuevaCantidadInt;

                const response = await api.put(
                    `/inventarioProducto/${productoStock.idProducto}/stock`,
                    { nuevaCantidad: newStockToSend },
                    { headers }
                );

                const updatedStockValue = response?.data?.stock ?? newStockToSend;

                setRegistros((prev) => {
                    const updated = prev.map((p) =>
                        p.idProducto === productoStock.idProducto ? { ...p, stock: updatedStockValue } : p
                    );
                    localStorage.setItem("productos", JSON.stringify(updated));
                    return updated;
                });

                const [lotesUsadosRes, produccionesRes, produccionesLotesRes, lotesMateriaPrimaRes] = await Promise.all([
                    api.get("/lotes-usados", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones-lotes", { headers }).catch(() => ({ data: [] })),
                    api.get("/lotes-materia-prima", { headers }).catch(() => ({ data: [] }))
                ]);
                setLotesUsadosEnProductos(lotesUsadosRes.data);
                setProducciones(produccionesRes.data);
                setProduccionesLotes(produccionesLotesRes.data);
                if (typeof setLotesMateriaPrima === "function") {
                    setLotesMateriaPrima(lotesMateriaPrimaRes.data);
                }

                setModalStock(false);
                setNuevaCantidad(0);
            } catch (err) {
                handleApiError(err, "actualización de stock");
            }
        };

        // Paginación de los productos
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = registros.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(registros.length / itemsPerPage);

        // Paginación de las categorías
        const indexOfLastCategoria = currentPageCategorias * itemsPerPageCategorias;
        const indexOfFirstCategoria = indexOfLastCategoria - itemsPerPageCategorias;
        const currentCategorias = categorias.slice(indexOfFirstCategoria, indexOfLastCategoria);
        const totalPagesCategorias = Math.ceil(categorias.length / itemsPerPageCategorias);

        // Paginación de lotes en modal
        const indexOfLastLote = currentPageLotes * itemsPerPageLotes;
        const indexOfFirstLote = indexOfLastLote - itemsPerPageLotes;
        const currentLotes = lotesUsadosProducto.slice(indexOfFirstLote, indexOfLastLote);
        const totalPagesLotes = Math.ceil(lotesUsadosProducto.length / itemsPerPageLotes);

        if (isLoading) {
            return <div className="text-center mt-5">Cargando productos...</div>;
        }

        return (
            <div className="container inventario">
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
                    <button
                        type="button"
                        className="btn btn-primary mb-3"
                        onClick={() => abrirModalCategoria()}
                        style={{ position: "relative", zIndex: 0 }}
                    >
                        Gestionar Categorías
                    </button>
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
                                        setPrecioModificadoManually(true);
                                    }}
                                />
                                <small className="form-text text-muted">
                                    Si modificas el precio manualmente, ese valor se conservará; si solo cambias el porcentaje, el precio se recalculará automáticamente.
                                </small>
                            </div>

                            {/* IVA: obligatorio en creación, en edición no se puede desactivar si ya estaba activado */}
                            <div className="mb-3">
                                <label className="form-label">¿Tiene IVA?</label>
                                {!productoSeleccionado ? (
                                    <div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="ivaRadio"
                                                id="ivaSi"
                                                value="true"
                                                checked={formularioTemp.iva === true}
                                                onChange={() => setFormularioTemp((p) => ({ ...p, iva: true }))}
                                                required
                                            />
                                            <label className="form-check-label" htmlFor="ivaSi">Sí</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="ivaRadio"
                                                id="ivaNo"
                                                value="false"
                                                checked={formularioTemp.iva === false}
                                                onChange={() => setFormularioTemp((p) => ({ ...p, iva: false }))}
                                                required
                                            />
                                            <label className="form-check-label" htmlFor="ivaNo">No</label>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="ivaRadioEdit"
                                                id="ivaSiEdit"
                                                value="true"
                                                checked={Boolean(formularioTemp.iva)}
                                                onChange={() => {
                                                    // si ya tenía iva activado en el producto, no permitir desactivar
                                                    if (productoSeleccionado.iva) {
                                                        // ya tiene iva -> preserve true
                                                        setFormularioTemp((p) => ({ ...p, iva: true }));
                                                    } else {
                                                        setFormularioTemp((p) => ({ ...p, iva: true }));
                                                    }
                                                }}
                                            />
                                            <label className="form-check-label" htmlFor="ivaSiEdit">Sí</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="ivaRadioEdit"
                                                id="ivaNoEdit"
                                                value="false"
                                                checked={!formularioTemp.iva}
                                                onChange={() => {
                                                    // solo permitir desactivar si el producto no tenía iva previamente
                                                    if (productoSeleccionado.iva) {
                                                        // no permitir desactivar -> forzar true
                                                        setFormularioTemp((p) => ({ ...p, iva: true }));
                                                    } else {
                                                        setFormularioTemp((p) => ({ ...p, iva: false }));
                                                    }
                                                }}
                                                disabled={productoSeleccionado?.iva === true}
                                            />
                                            <label className="form-check-label" htmlFor="ivaNoEdit">No</label>
                                        </div>
                                        {productoSeleccionado?.iva === true && (
                                            <div className="form-text text-muted">El IVA ya está activado y no puede desactivarse.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Categoría</label>
                                <select
                                    className="form-select"
                                    value={formularioTemp.idCategoria || ""}
                                    onChange={(e) =>
                                        setFormularioTemp((prev) => ({ ...prev, idCategoria: e.target.value ? Number(e.target.value) : "" }))
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
                                    // size para que tenga scroll si hay muchas materias
                                    size={8}
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
                    <Modal isOpen={modalLotesUsados} onClose={() => { setModalLotesUsados(false); setProductoLotesSeleccionado(null); }}>
                        <div style={{ position: "relative" }}>
                            <button
                                type="button"
                                className="btn-close"
                                style={{ position: "absolute", top: "10px", right: "10px" }}
                                onClick={() => { setModalLotesUsados(false); setProductoLotesSeleccionado(null); }}
                                aria-label="Close"
                            ></button>
                            <h2 className="mb-3">Lotes Usados en Producto</h2>
                            <div className="mb-3">
                                <label className="form-label">Filtrar por fecha de producción:</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </div>
                            <div className="row g-3">
                                {currentLotes.map((lu) => (
                                    <div key={lu.id} className="col-md-12">
                                        <div className="card shadow-sm h-100">
                                            <div className="card-body">
                                                <h5 className="card-title">Lote #{lu.idLote}</h5>
                                                <p className="card-text">
                                                    <strong>Materia Prima:</strong> {lu.materiaNombre}
                                                    <br />
                                                    <strong>Cantidad Inicial:</strong> {lu.cantidadInicial} unidades
                                                    <br />
                                                    <strong>Cantidad antes de fabricación:</strong> {lu.cantidadAntesFabricacion} unidades
                                                    <br />
                                                    <strong>Cantidad Usada:</strong> {lu.cantidadUsada} unidades
                                                    <br />
                                                    <strong>Cantidad después de fabricación:</strong> {lu.cantidadDespuesFabricacion} unidades
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
                                <nav>
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPageLotes === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPageLotes(currentPageLotes - 1)}>
                                                Anterior
                                            </button>
                                        </li>
                                        {Array.from({ length: totalPagesLotes }, (_, i) => (
                                            <li key={i + 1} className={`page-item ${currentPageLotes === i + 1 ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => setCurrentPageLotes(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPageLotes === totalPagesLotes ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPageLotes(currentPageLotes + 1)}>
                                                Siguiente
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                                <BotonAceptar onClick={() => { setModalLotesUsados(false); setProductoLotesSeleccionado(null); }} />
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

                {error && (
                    <Modal isOpen={!!error} onClose={() => setError(null)}>
                        <div className="encabezado-modal"><h2>Error</h2></div>
                        <p className="text-center">{error}</p>
                        <div className="modal-footer"><BotonAceptar onClick={() => setError(null)} /></div>
                    </Modal>
                )}
            </div>
        );
    }
);

export default TablaProductos;
