import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonAceptar from "./BotonAceptar";
import "../styles/tablaProductos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";


const TablaProductos = forwardRef(
    ({ registrosMateria, lotesMateriaPrima, setRegistrosMateria, setLotesMateriaPrima, proveedores, token }, ref) => {
        // Estados principales ----------
        const [registros, setRegistros] = useState([]);
        const [productoSeleccionado, setProductoSeleccionado] = useState(null);
        const [modalAbierta, setModalAbierta] = useState(false);
        const [materiasProducto, setMateriasProducto] = useState([]);
        const [modalMateriaAbierta, setModalMateriaAbierta] = useState(false);
        const [materiaNueva, setMateriaNueva] = useState({ idMateria: 0, cantidad: 0 });
        const [modoEdicionMateria, setModoEdicionMateria] = useState(false);
        const [indiceEdicionMateria, setIndiceEdicionMateria] = useState(null);

        // Stock modal
        const [modalStock, setModalStock] = useState(false);
        const [productoStock, setProductoStock] = useState(null);
        const [maxFabricable, setMaxFabricable] = useState(null);
        const [nuevaCantidad, setNuevaCantidad] = useState(0);

        // Disminuir stock
        const [disminuirChecked, setDisminuirChecked] = useState(false);
        const [cantidadDisminuir, setCantidadDisminuir] = useState(0);
        const [modalConfirmDecrease, setModalConfirmDecrease] = useState(false);

        // Datos relacionados a lotes/producciones
        const [lotesUsadosEnProductos, setLotesUsadosEnProductos] = useState([]);
        const [producciones, setProducciones] = useState([]);
        const [produccionesLotes, setProduccionesLotes] = useState([]);

        // Costos / formulario temporal
        const [costoTotal, setCostoTotal] = useState(0);

        // Porcentaje de ganancia y precio
        const [formularioTemp, setFormularioTemp] = useState({ porcentajeGanancia: 15, nombre: "", idCategoria: "", iva: null });
        const [costoInput, setCostoInput] = useState(0);
        const [precioInput, setPrecioInput] = useState(0);
        const [precioModificadoManually, setPrecioModificadoManually] = useState(false);

        // Paginación productos
        const [currentPage, setCurrentPage] = useState(1);
        const [itemsPerPage] = useState(5);

        // Paginación categorías
        const [categorias, setCategorias] = useState([]);
        const [modalCategoriaAbierta, setModalCategoriaAbierta] = useState(false);
        const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
        const [nuevaCategoria, setNuevaCategoria] = useState({ idCategoria: 0, nombre: "" });
        const [modoEdicionCategoria, setModoEdicionCategoria] = useState(false);
        const [modalConfirmDeleteCategoria, setModalConfirmDeleteCategoria] = useState(false);
        const [categoriaToDelete, setCategoriaToDelete] = useState(null);
        const [productosAsociadosToDelete, setProductosAsociadosToDelete] = useState([]);
        const [currentPageCategorias, setCurrentPageCategorias] = useState(1);
        const [itemsPerPageCategorias] = useState(5);

        // Paginación lotes en modal
        const [currentPageLotes, setCurrentPageLotes] = useState(1);
        const [itemsPerPageLotes] = useState(2);

        // Filtro fecha lotes
        const [filterDate, setFilterDate] = useState("");

        // Modal lotes usados
        const [modalLotesUsados, setModalLotesUsados] = useState(false);
        const [productoLotesSeleccionado, setProductoLotesSeleccionado] = useState(null);
        const [lotesUsadosProducto, setLotesUsadosProducto] = useState([]);

        // Estados de error y carga
        const [error, setError] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const [modalAdvertenciaPocoStock, setModalAdvertenciaPocoStock] = useState(false);
        const [modalAdvertenciaIdInvalido, setModalAdvertenciaIdInvalido] = useState(false);
        const [modalAdvertenciaMateriaAgregada, setModalAdvertenciaMateriaAgregada] = useState(false);
        const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] = useState(false);
        const [modalErrorStockInsuficiente, setModalErrorStockInsuficiente] = useState(false);

        // Headers de autenticación
        const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken") || token}` });

        // Manejo de errores de API
        const handleApiError = (err, context) => {
            console.error(`Error en ${context}:`, {
                status: err?.response?.status,
                data: err?.response?.data,
                message: err?.message,
            });
            if (err?.response?.status === 401) {
                setError("Sesión expirada o permisos insuficientes. Por favor, inicia sesión nuevamente.");
                localStorage.removeItem("accessToken");
                setTimeout(() => window.location.href = "/login", 800);
            } else {
                setError(err?.response?.data?.message || `Error en ${context}. Intenta de nuevo.`);
            }
        };

        // Función para cargar datos frescos del backend 
        const cargarDatosFromBackend = async () => {
            if (!token) return;
            try {
                const headers = authHeaders();

                // Cargar productos directamente del backend (sin fusionar con localStorage)
                const productosRes = await api.get("/inventarioProducto", { headers });
                setRegistros(productosRes.data || []);
                localStorage.setItem("productos", JSON.stringify(productosRes.data || []));

                // Cargar inventario materia
                try {
                    const inventarioMateriaRes = await api.get("/inventarioMateria", { headers });
                    if (typeof setRegistrosMateria === "function") {
                        setRegistrosMateria(inventarioMateriaRes.data);
                    }
                } catch (err) {
                    console.warn("No se pudo cargar /inventarioMateria:", err.message || err);
                }

                // Cargar otros datos necesarios
                const [lotesRes, lotesUsadosRes, produccionesRes, produccionesLotesRes, categoriasRes] = await Promise.all([
                    api.get("/lotes", { headers }).catch(() => ({ data: [] })),
                    api.get("/lotes-usados", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones-lotes", { headers }).catch(() => ({ data: [] })),
                    api.get("/categorias", { headers }).catch(() => ({ data: [] }))
                ]);

                if (typeof setLotesMateriaPrima === "function") {
                    setLotesMateriaPrima(lotesRes.data);
                }
                setLotesUsadosEnProductos(lotesUsadosRes.data);
                setProducciones(produccionesRes.data);
                setProduccionesLotes(produccionesLotesRes.data);
                setCategorias(categoriasRes.data);

            } catch (err) {
                handleApiError(err, "carga de datos de productos");
            }
        };

        // Carga inicial 
        useEffect(() => {
            const fetchData = async () => {
                if (!token) {
                    setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                await cargarDatosFromBackend();
                setIsLoading(false);
            };
            fetchData();
        }, [token]);

        // Helpers de costos y lotes 
        const getLoteCosto = (lote) => {
            if (!lote) return 0;
            return lote.costoUnitario ?? lote.costo ?? lote.precioUnitario ?? lote.precio ?? lote.valorUnitario ?? 0;
        };

        // Recalculo en tiempo real para el formulario 
        useEffect(() => {
            const nuevoCostoRaw = (materiasProducto || []).reduce((acc, mp) => {
                const idM = mp.idMateria;
                let costoUnit = 0;
                const rm = (registrosMateria || []).find((r) => r.idMateria === idM);
                if (rm && typeof rm.costo === "number") {
                    costoUnit = Number(rm.costo);
                } else {
                    const lotes = (lotesMateriaPrima || []).filter(l => l.idMateria === idM && (l.cantidadDisponible ?? l.cantidad) > 0);
                    if (lotes && lotes.length > 0) {
                        costoUnit = Number(getLoteCosto(lotes[0]) || 0);
                    }
                }
                return acc + (costoUnit * (mp.cantidad || 0));
            }, 0);

            const nuevoCostoRedondeado = Math.round((nuevoCostoRaw || 0) / 50) * 50;

            if (nuevoCostoRaw > 0 && nuevoCostoRedondeado !== costoInput) {
                setCostoTotal(nuevoCostoRedondeado);
                setCostoInput(nuevoCostoRedondeado);
                if (!precioModificadoManually) {
                    // Usar porcentajeGanancia del formulario
                    const porcentajeUsado = Math.max(15, formularioTemp.porcentajeGanancia || 15);
                    const precioCalc = Math.round(nuevoCostoRedondeado * (1 + porcentajeUsado / 100) / 50) * 50;
                    setPrecioInput(precioCalc);
                    setFormularioTemp((prev) => ({ ...prev, precio: precioCalc }));
                }
            }
        }, [materiasProducto, registrosMateria, lotesMateriaPrima, precioModificadoManually, formularioTemp.porcentajeGanancia]);

        // Recalcular precio cuando cambia porcentaje en modal (si no se modificó precio manualmente)
        useEffect(() => {
            if (precioModificadoManually) return;
            const costo = Number(costoInput || 0);
            const porcentaje = Number(formularioTemp.porcentajeGanancia || 15);
            const porcentajeUsado = Math.max(15, porcentaje);
            const nuevoPrecio = Math.round(costo * (1 + porcentajeUsado / 100) / 50) * 50;
            setPrecioInput(nuevoPrecio);
            setFormularioTemp((prev) => ({ ...prev, precio: nuevoPrecio }));
        }, [formularioTemp.porcentajeGanancia, costoInput]);

        // Exponer abrirModalAgregar a padre
        useImperativeHandle(ref, () => ({
            abrirModalAgregar: () => {
                setProductoSeleccionado(null);
                setMateriasProducto([]);
                setCostoTotal(0);
                setFormularioTemp({ porcentajeGanancia: 15, nombre: "", idCategoria: "", iva: null });
                setCostoInput(0);
                setPrecioInput(0);
                setPrecioModificadoManually(false);
                setModalAbierta(true);
            },
        }));

        // Formateadores
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

        // Formatear moneda en COP
        const formatCurrency = (value) => {
            return new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
            }).format(value || 0);
        };

        // Abrir modal editar producto - USANDO DATOS DEL BACKEND DIRECTAMENTE
        const abrirModalEditar = (producto) => {
            setProductoSeleccionado(producto);
            setMateriasProducto(producto.materias || []);
            setCostoTotal(producto.costo || 0);

            const costoVal = Number(producto.costo || 0);
            const precioVal = Number(producto.precio || 0);

            // MODIFICAR: Usar porcentajeGanancia del backend en lugar de localStorage
            const porcentajeFinal = producto.porcentajeGanancia || 15;

            setFormularioTemp({
                idProducto: producto.idProducto,
                nombre: producto.nombre,
                precio: precioVal,
                porcentajeGanancia: porcentajeFinal, // Ahora viene del backend
                idCategoria: producto.idCategoria?.idCategoria || "",
                iva: producto.iva === undefined || producto.iva === null ? false : Boolean(producto.iva),
            });
            setCostoInput(costoVal);
            setPrecioInput(precioVal);
            setPrecioModificadoManually(false);
            setModalAbierta(true);
        };

        // Abrir modal stock (calcular maxFabricable)
        const abrirModalStock = (producto) => {
            setProductoStock(producto);
            setDisminuirChecked(false);
            setCantidadDisminuir(0);
            setNuevaCantidad(0);
            if (producto?.materias?.length) {
                const cantidadesPosibles = producto.materias.map((mat) => {
                    const lotes = (lotesMateriaPrima || [])
                        .filter((lote) => lote.idMateria === mat.idMateria && (lote.cantidadDisponible ?? lote.cantidad) > 0)
                        .sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));
                    let totalDisponible = 0;
                    for (const lote of lotes) {
                        totalDisponible += Number(lote.cantidadDisponible ?? lote.cantidad ?? 0);
                    }
                    return Math.floor(totalDisponible / mat.cantidad);
                });
                setMaxFabricable(Math.min(...cantidadesPosibles));
            } else {
                setMaxFabricable(0);
            }
            setModalStock(true);
        };

        // Abrir modal lotes usados para un producto
        const abrirModalLotesUsados = (producto) => {
            setProductoLotesSeleccionado(producto);
            setCurrentPageLotes(1);
            setModalLotesUsados(true);
        };

        // Resolver ID de producción para lote usado
        const resolveIdProduccionForLu = (lu) => {
            if (lu.idProduccion !== undefined && lu.idProduccion !== null) {
                return lu.idProduccion;
            }

            if (producciones && producciones.length > 0 && lu.fechaProduccion) {
                try {
                    const fechaLu = new Date(lu.fechaProduccion).getTime();
                    const candidate = producciones.find(p => {
                        if (Number(p.idProducto) !== Number(lu.idProducto)) return false;
                        const fp = p.fechaProduccion ?? p.fecha ?? p.createdAt ?? null;
                        if (!fp) return false;
                        const diff = Math.abs(new Date(fp).getTime() - fechaLu);
                        return diff <= 120000; // 2 minutos
                    });
                    if (candidate) return candidate.idProduccion ?? candidate.id ?? candidate.id_produccion ?? "N/A";
                } catch {
                    // ignore
                }
            }

            if (produccionesLotes && produccionesLotes.length > 0) {
                const qtyLu = Number(lu.cantidadUsada ?? lu.cantidad ?? 0);
                const fechaLu = lu.fechaProduccion ? new Date(lu.fechaProduccion).getTime() : null;
                let candidate = produccionesLotes.find(pl => Number(pl.idLote) === Number(lu.idLote) && Math.abs((Number(pl.cantidadUsadaDelLote ?? pl.cantidadUsada ?? 0) - qtyLu)) < 1e-6);
                if (!candidate && fechaLu) {
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

        // Reconstruye lotesUsadosProducto cuando se abre modal
        useEffect(() => {
            if (!modalLotesUsados || !productoLotesSeleccionado) {
                setLotesUsadosProducto([]);
                return;
            }

            // Filtrar lotes usados para el producto seleccionado
            const lotesUsadosParaProducto = (lotesUsadosEnProductos || []).filter((lu) => lu.idProducto === productoLotesSeleccionado.idProducto);

            const mapped = lotesUsadosParaProducto.map((lu) => {
                const lote = (lotesMateriaPrima || []).find((l) => l.idLote === lu.idLote) || {};
                const fechaProduccionRaw = lu.fechaProduccion;
                const fechaIngresoRaw = lote.fechaIngreso;
                const fechaProduccion = formatDateTime(fechaProduccionRaw);
                const fechaIngreso = formatDateTime(fechaIngresoRaw);
                const cantidadInicial = lote.cantidad ?? 0;
                const usedUntilThis = lotesUsadosEnProductos
                    .filter((x) => x.idLote === lu.idLote && new Date(x.fechaProduccion) <= new Date(fechaProduccionRaw))
                    .reduce((s, x) => s + (x.cantidadUsada ?? 0), 0);
                const cantidadAntesFabricacion = cantidadInicial - (usedUntilThis - (lu.cantidadUsada ?? 0));
                const cantidadUsada = lu.cantidadUsada ?? 0;
                const cantidadDespuesFabricacion = Math.max(0, cantidadAntesFabricacion - cantidadUsada);
                const proveedorNombre = lote.idProveedor
                    ? (proveedores || []).find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                    : "Manual";
                const idProduccionResolved = resolveIdProduccionForLu(lu);

                return {
                    id: lu.id,
                    idLote: lu.idLote,
                    materiaNombre: (registrosMateria || []).find((m) => m.idMateria === lote?.idMateria)?.nombre || "N/A",
                    proveedorNombre,
                    cantidadInicial,
                    cantidadAntesFabricacion,
                    cantidadUsada,
                    cantidadDespuesFabricacion,
                    fechaIngreso,
                    fechaProduccion,
                    fechaIngresoRaw,
                    fechaProduccionRaw,
                    idProduccion: idProduccionResolved,
                    cantidadDisponibleActual: lote?.cantidadDisponible ?? 0,
                };
            });

            // Filtrar por fecha si se aplica
            const filtered = mapped.filter((lu) => {
                if (!filterDate) return true;
                if (!lu.fechaProduccionRaw) return false;
                const d = new Date(lu.fechaProduccionRaw);
                if (isNaN(d.getTime())) return false;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                const localDate = `${y}-${m}-${day}`;
                return localDate === filterDate;
            });

            // Ordenar por fecha de producción
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

        // Abrir modal categoria
        const abrirModalCategoria = (categoria = null) => {
            setCategoriaSeleccionada(categoria);
            setModoEdicionCategoria(!!categoria);
            setNuevaCategoria(categoria ? { idCategoria: categoria.idCategoria, nombre: categoria.nombre } : { idCategoria: 0, nombre: "" });
            setModalCategoriaAbierta(true);
        };

        const manejarCambioNombre = (evento, setState, stateKey) => {
            const nuevoValor = evento.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, "");
            setState((prev) => ({ ...prev, [stateKey]: nuevoValor }));
        };

        // Guardar categoria
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

            if (nuevaCategoria.nombre.length < 3 || !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(nuevaCategoria.nombre)) {
                setError("El nombre de la categoría debe tener al menos 3 caracteres y solo letras (incluyendo tildes y ñ).");
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

        // Eliminar categoria (con opción force para que se vea en los productos asociados)
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
                                porcentajeGanancia: p.porcentajeGanancia ?? 15,
                                idCategoria: null,
                                materias: p.materias ?? [],
                            };
                            return api.put(`/inventarioProducto/${p.idProducto}`, body, { headers });
                        })
                    );
                }

                await api.delete(`/categorias/${idCategoria}`, { headers });

                // Recargar datos frescos del backend
                await cargarDatosFromBackend();

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

        // Guardar producto (crear/editar)
        const guardarProducto = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }
            if (!productoSeleccionado && (formularioTemp.iva === null || formularioTemp.iva === undefined)) {
                setError("Debes seleccionar si el producto tiene IVA (Sí/No).");
                return;
            }
            if (!materiasProducto || materiasProducto.length === 0) {
                setError("El producto debe tener al menos 1 materia prima asociada.");
                return;
            }

            if (formularioTemp.nombre.length < 3 || !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(formularioTemp.nombre)) {
                setError("El nombre debe tener al menos 3 caracteres y solo letras (incluyendo tildes y ñ).");
                return;
            }

            // Forzar mínimo 15 en el porcentaje de ganancia
            const porcentajeUsado = Math.max(15, Number(formularioTemp.porcentajeGanancia || 15));
            const costoRedondeado = Math.round(Number(costoInput || 0) / 50) * 50;
            const precioRedondeado = !precioModificadoManually
                ? Math.round(costoRedondeado * (1 + porcentajeUsado / 100) / 50) * 50
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
                        stock: productoSeleccionado.stock ?? 0,
                        iva: productoSeleccionado.iva ? true : Boolean(formularioTemp.iva),
                        porcentajeGanancia: porcentajeUsado, // NUEVO: Enviar al backend
                        materias: materiasProducto,
                    };
                    payload.idCategoria = formularioTemp.idCategoria ? { idCategoria: Number(formularioTemp.idCategoria) } : null;
                    await api.put(`/inventarioProducto/${productoSeleccionado.idProducto}`, payload, { headers });

                } else {
                    const payload = {
                        nombre: formularioTemp.nombre,
                        costo: costoRedondeado,
                        precio: precioRedondeado,
                        stock: 0,
                        iva: Boolean(formularioTemp.iva),
                        porcentajeGanancia: porcentajeUsado, // NUEVO: Enviar al backend
                        materias: materiasProducto,
                    };
                    payload.idCategoria = formularioTemp.idCategoria ? { idCategoria: Number(formularioTemp.idCategoria) } : null;
                    await api.post("/inventarioProducto", payload, { headers });
                }

                // ELIMINAR: Ya no necesitamos guardar en localStorage
                // Recargar datos frescos del backend después de guardar
                await cargarDatosFromBackend();

                setModalAbierta(false);
                setProductoSeleccionado(null);
                setMateriasProducto([]);
                setCostoTotal(costoRedondeado);
                setFormularioTemp({ porcentajeGanancia: 15, nombre: "", idCategoria: "", iva: null }); // Reset a 15
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
            const materia = (registrosMateria || []).find((m) => m.idMateria === idMateria);
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
        };

        const confirmarDisminuirStock = async () => {
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                setModalConfirmDecrease(false);
                return;
            }
            const disminuir = parseInt(cantidadDisminuir, 10);
            if (isNaN(disminuir) || disminuir <= 0) {
                setError("Cantidad inválida a disminuir.");
                setModalConfirmDecrease(false);
                return;
            }

            const currentStock = productoStock?.stock || 0;
            if (disminuir > currentStock) {
                setError("No puedes disminuir más que el stock actual.");
                setModalConfirmDecrease(false);
                return;
            }

            try {
                const headers = authHeaders();
                // NUEVO: Usar el endpoint específico para disminuir stock por pérdida
                await api.put(
                    `/inventarioProducto/${productoStock.idProducto}/disminuir-stock`,
                    { cantidadADisminuir: disminuir },
                    { headers }
                );

                // Recargar datos frescos del backend después de disminuir stock
                await cargarDatosFromBackend();

                setModalConfirmDecrease(false);
                setModalStock(false);
                setCantidadDisminuir(0);
                setDisminuirChecked(false);
            } catch (err) {
                handleApiError(err, "disminuir stock");
                setModalConfirmDecrease(false);
            }
        };

        // ACTUALIZAR STOCK (AUMENTAR / DISMINUIR)
        const actualizarStock = async (e) => {
            e.preventDefault();
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                return;
            }

            // Si usuario marcó "disminuir", abrir confirmación
            if (disminuirChecked) {
                const dismin = parseInt(cantidadDisminuir, 10);
                if (isNaN(dismin) || dismin <= 0) {
                    setError("La cantidad a disminuir debe ser un número mayor que 0.");
                    return;
                }
                if (!productoStock) {
                    setError("Producto inválido.");
                    return;
                }
                if (dismin > (productoStock.stock || 0)) {
                    setError("La cantidad a disminuir no puede ser mayor al stock actual.");
                    return;
                }
                setModalConfirmDecrease(true);
                return;
            }

            // Fabricar (aumentar stock)
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

                // PUT stock
                await api.put(
                    `/inventarioProducto/${productoStock.idProducto}/stock`,
                    { nuevaCantidad: newStockToSend },
                    { headers }
                );

                // Recargar datos frescos del backend después de actualizar stock
                await cargarDatosFromBackend();

                setModalStock(false);
                setNuevaCantidad(0);
            } catch (err) {
                handleApiError(err, "actualización de stock");
            }
        };

        // PAGINADOR CON ELLIPSIS 
        const renderPageButtons = (totalPages, currentPage, setPageFn) => {
            if (totalPages <= 1) return null;
            const delta = 2;
            const range = [];
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                    range.push(i);
                } else if (range[range.length - 1] !== "...") {
                    range.push("...");
                }
            }
            return range.map((p, idx) => {
                if (p === "...") {
                    return (
                        <li key={`dots-${idx}`} className="page-item disabled">
                            <span className="page-link">…</span>
                        </li>
                    );
                }
                return (
                    <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPageFn(p)}>{p}</button>
                    </li>
                );
            });
        };

        // Paginaciones calculadas
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = registros.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(registros.length / itemsPerPage);

        // Paginación de categorías y lotes usados
        const indexOfLastCategoria = currentPageCategorias * itemsPerPageCategorias;
        const indexOfFirstCategoria = indexOfLastCategoria - itemsPerPageCategorias;
        const currentCategorias = categorias.slice(indexOfFirstCategoria, indexOfLastCategoria);
        const totalPagesCategorias = Math.ceil(categorias.length / itemsPerPageCategorias);

        // Paginación de lotes usados para un producto
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

                {/* Paginación productos (con ellipsis) */}
                <nav>
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                                Anterior
                            </button>
                        </li>

                        {renderPageButtons(totalPages, currentPage, (p) => setCurrentPage(p))}

                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
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
                                <button className="page-link" onClick={() => setCurrentPageCategorias(Math.max(1, currentPageCategorias - 1))}>
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
                                <button className="page-link" onClick={() => setCurrentPageCategorias(Math.min(totalPagesCategorias, currentPageCategorias + 1))}>
                                    Siguiente
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                {/* ---------------- MODALES ---------------- */}
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
                                    }}
                                />
                                <small className="form-text text-muted">
                                    El costo se calcula automáticamente al agregar materias primas.
                                </small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Porcentaje de Ganancia (%)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formularioTemp.porcentajeGanancia ?? 15}
                                    min={15}
                                    step="1"
                                    required
                                    onChange={(e) => {
                                        const porcentajeRaw = Math.round(Number(e.target.value) || 15);
                                        const porcentaje = porcentajeRaw < 15 ? 15 : porcentajeRaw;
                                        setFormularioTemp((prev) => ({
                                            ...prev,
                                            porcentajeGanancia: porcentaje,
                                        }));
                                    }}
                                />
                                <small className="form-text text-muted">
                                    Mínimo <strong>15%</strong>. Si no lo cambias se mantendrá en 15%.
                                </small>
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
                                    Si modificas el precio manualmente, ese valor se conservará; si no, el precio se calculará automáticamente en base al costo y porcentaje.
                                </small>
                            </div>

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
                                                    if (productoSeleccionado.iva) {
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
                                                    if (productoSeleccionado.iva) {
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
                                        const materia = (registrosMateria || []).find((rm) => rm.idMateria === m.idMateria);
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
                                    size={8}
                                >
                                    <option value="">Selecciona una materia prima</option>
                                    {(registrosMateria || []).map((m) => (
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
                            <h5 className="text-center">Gestionar stock de <strong>{productoStock?.nombre}</strong></h5>

                            {maxFabricable !== null && (
                                <div className="alert alert-info">
                                    Puedes fabricar hasta <strong>{maxFabricable}</strong> unidades con el inventario actual.
                                </div>
                            )}
                            <div className="alert alert-primary">
                                Cantidad actual es <strong>{productoStock?.stock}</strong> unidades.
                            </div>

                            {/* Cantidad a fabricar (deshabilitado si disminuirChecked) */}
                            <div className="mb-3">
                                <label className="form-label">Cantidad a fabricar</label>
                                <input
                                    name="stockCantidad"
                                    type="number"
                                    required={!disminuirChecked}
                                    className="form-control"
                                    min="0"
                                    value={nuevaCantidad}
                                    onChange={(e) => setNuevaCantidad(Number(e.target.value) || 0)}
                                    disabled={disminuirChecked}
                                />
                                <div className="form-text">Introduce cuántas unidades quieres fabricar (incremento).</div>
                            </div>

                            {/* Checkbox + input disminuir stock */}
                            <div className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="disminuirCheck"
                                    checked={disminuirChecked}
                                    onChange={(e) => {
                                        setDisminuirChecked(e.target.checked);
                                        if (e.target.checked) {
                                            setNuevaCantidad(0);
                                        } else {
                                            setCantidadDisminuir(0);
                                        }
                                    }}
                                />
                                <label className="form-check-label" htmlFor="disminuirCheck">
                                    ¿Se perdieron productos y quieres disminuir stock? Marca si ese es el caso
                                </label>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">¿Cuántas unidades quieres disminuir?</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={cantidadDisminuir}
                                    onChange={(e) => setCantidadDisminuir(Number(e.target.value) || 0)}
                                    disabled={!disminuirChecked}
                                    placeholder="¿Cuántas unidades quieres disminuir?"
                                />
                                <div className="form-text">Al marcar la opción anterior, este valor se usará para <strong>reducir</strong> el stock.</div>
                            </div>

                            <div className="d-flex justify-content-end">
                                <BotonCancelar onClick={() => { setModalStock(false); setDisminuirChecked(false); setCantidadDisminuir(0); }} />
                                <BotonGuardar type="submit" />
                            </div>
                        </form>
                    </Modal>
                )}

                {modalConfirmDecrease && (
                    <Modal isOpen={modalConfirmDecrease} onClose={() => setModalConfirmDecrease(false)}>
                        <div className="encabezado-modal">
                            <h2>Confirmar disminución</h2>
                        </div>
                        <p className="text-center">
                            ¿Estás seguro de querer disminuir <strong>{cantidadDisminuir}</strong> unidades de <strong>{productoStock?.nombre}</strong>? Esta acción afectará el stock.
                        </p>
                        <div className="d-flex justify-content-end">
                            <BotonCancelar onClick={() => setModalConfirmDecrease(false)} />
                            <BotonAceptar onClick={confirmarDisminuirStock} />
                        </div>
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
                    <Modal isOpen={modalAdvertenciaIdDuplicado} onClose={() => setModalAdvertenciaIdDuplicado(false)}>
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
                                            <button className="page-link" onClick={() => setCurrentPageLotes(Math.max(1, currentPageLotes - 1))}>
                                                Anterior
                                            </button>
                                        </li>

                                        {renderPageButtons(totalPagesLotes, currentPageLotes, (p) => setCurrentPageLotes(p))}

                                        <li className={`page-item ${currentPageLotes === totalPagesLotes ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPageLotes(Math.min(totalPagesLotes, currentPageLotes + 1))}>
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
                                    onChange={(e) => manejarCambioNombre(e, setNuevaCategoria, "nombre")}
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
