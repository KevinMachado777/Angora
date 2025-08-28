import { useState, useEffect, useRef } from "react";
import TablaProductos from "../components/TablaProductos";
import TablaMaterias from "../components/TablaMaterias";
import BotonExportar from "../components/BotonExportar";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";
import BotonAgregar from "../components/BotonAgregar";
import * as XLSX from "xlsx";

// Componente principal de inventario
const Inventario = ({ token: propToken }) => {
    const [registrosMateria, setRegistrosMateria] = useState([]);
    const [lotesMateriaPrima, setLotesMateriaPrima] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [opcionSeleccionada, setOpcionSeleccionada] = useState("opcion1"); // "opcion1" para productos, "opcion2" para materias
    const [isLoading, setIsLoading] = useState(true);
    const tablaProductosRef = useRef();
    const tablaMateriasRef = useRef();

    // Usar token de props o de localStorage como fallback
    const token = propToken || localStorage.getItem("accessToken");

    // Función auxiliar para manejar errores de API
    const handleApiError = (err, context) => {
        console.error(`Error en ${context}:`, {
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
        });
        if (err?.response?.status === 401) {
            alert("Sesión expirada o permisos insuficientes. Por favor, inicia sesión nuevamente.");
            localStorage.removeItem("accessToken");
            window.location.href = "/login";
        }
    };

    // Cargar datos iniciales desde el backend
    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [materiasRes, lotesRes, proveedoresRes] = await Promise.all([
                    api.get("/inventarioMateria", { headers }).catch(() => ({ data: [] })),
                    api.get("/lotes", { headers }).catch(() => ({ data: [] })),
                    api.get("/proveedores", { headers }).catch(() => ({ data: [] })),
                ]);

                setRegistrosMateria(materiasRes.data);
                setLotesMateriaPrima(lotesRes.data);
                setProveedores(proveedoresRes.data);
                localStorage.setItem("registrosMateria", JSON.stringify(materiasRes.data));
                localStorage.setItem("lotesMateriaPrima", JSON.stringify(lotesRes.data));
                setIsLoading(false);
            } catch (err) {
                handleApiError(err, "carga inicial de inventario");
                setRegistrosMateria(JSON.parse(localStorage.getItem("registrosMateria")) || []);
                setLotesMateriaPrima(JSON.parse(localStorage.getItem("lotesMateriaPrima")) || []);
                setProveedores([]);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // Abrir modal de agregar según la pestaña seleccionada
    const handleAgregar = () => {
        if (opcionSeleccionada === "opcion1" && tablaProductosRef.current) {
            tablaProductosRef.current.abrirModalAgregar();
        } else if (opcionSeleccionada === "opcion2" && tablaMateriasRef.current) {
            tablaMateriasRef.current.abrirModalAgregar();
        }
    };

    // Exportar a Excel: productos (fetch) o materias (state). Añadimos hojas extra de lotes.
    // Reemplaza la función exportToExcel completa con esta versión actualizada

    const exportToExcel = async () => {
        if (!token) {
            alert("No hay token de autenticación disponible.");
            return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (opcionSeleccionada === "opcion1") {
                // Exportar productos + lotes usados + producciones
                const [productosRes, categoriasRes, lotesUsadosRes, produccionesRes] = await Promise.all([
                    api.get("/inventarioProducto", { headers }),
                    api.get("/categorias", { headers }).catch(() => ({ data: [] })),
                    api.get("/lotes-usados", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones", { headers }).catch(() => ({ data: [] })),
                ]);

                const productos = productosRes.data || [];
                const categorias = categoriasRes.data || [];
                const lotesUsados = lotesUsadosRes.data || [];
                const producciones = produccionesRes.data || [];

                // Hoja Productos - Actualizada según las entidades
                const productosSheetData = productos.map((p) => ({
                    ID: p.idProducto,
                    Nombre: p.nombre,
                    Costo: p.costo,
                    PrecioDetal: p.precioDetal,
                    PrecioMayorista: p.precioMayorista || "N/A",
                    Stock: p.stock || 0,
                    StockMinimo: p.stockMinimo || "N/A",
                    StockMaximo: p.stockMaximo || "N/A",
                    PorcentajeGanancia: p.porcentajeGanancia || 0,
                    IVA: p.iva ? "Sí" : "No",
                    Categoria: categorias.find(
                        (cat) => cat.idCategoria === p.idCategoria?.idCategoria
                    )?.nombre || "Sin categoría",
                    // Agregar materias primas asociadas como texto
                    MateriasPrimas: p.materias
                        ? p.materias.map(m => `${m.idMateria}:${m.cantidad}`).join("; ")
                        : "Sin materias"
                }));

                // Obtener lotes de materia prima
                let lotesLocal = lotesMateriaPrima;
                if (!lotesLocal || lotesLocal.length === 0) {
                    const lotesRes = await api.get("/lotes", { headers }).catch(() => ({ data: [] }));
                    lotesLocal = lotesRes.data || [];
                }

                // Hoja LotesUsados - Actualizada según LoteUsado entity
                const lotesUsadosSheetData = lotesUsados.map((lu) => {
                    const lote = lotesLocal.find((l) => l.idLote === lu.idLote) || {};
                    const producto = productos.find((p) => p.idProducto === lu.idProducto) || {};

                    // Buscar la producción correspondiente usando idProduccion
                    const produccion = producciones.find((p) => p.idProduccion === lu.idProduccion) || {};

                    const cantidadInicial = lote?.cantidad || lu.cantidadInicialLote || 0;
                    const cantidadUsada = lu.cantidadUsada || 0;

                    // Calcular cantidades antes y después
                    const usedUntilThis = lotesUsados
                        .filter(
                            (x) =>
                                x.idLote === lu.idLote &&
                                x.fechaProduccion &&
                                lu.fechaProduccion &&
                                new Date(x.fechaProduccion) <= new Date(lu.fechaProduccion)
                        )
                        .reduce((s, x) => s + (x.cantidadUsada || 0), 0);

                    const cantidadAntesFabricacion = cantidadInicial - (usedUntilThis - cantidadUsada);
                    const cantidadDespuesFabricacion = Math.max(0, cantidadAntesFabricacion - cantidadUsada);

                    const materiaNombre = lote?.idMateria != null
                        ? registrosMateria.find((m) => m.idMateria === lote.idMateria)?.nombre || "N/A"
                        : "N/A";

                    const proveedorNombre = lote?.idProveedor
                        ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                        : "Sin proveedor";

                    return {
                        // Columnas de LoteUsado
                        ID: lu.id,
                        IdLote: lu.idLote,
                        IdProducto: lu.idProducto,
                        ProductoNombre: producto?.nombre || "N/A",
                        CantidadUsada: cantidadUsada,
                        FechaProduccion: lu.fechaProduccion ? new Date(lu.fechaProduccion).toLocaleString() : "N/A",
                        IdProduccion: lu.idProduccion,
                        CantidadInicialLote: lu.cantidadInicialLote || cantidadInicial,

                        // Columnas adicionales del lote
                        MateriaNombre: materiaNombre,
                        CantidadAntesFabricacion: cantidadAntesFabricacion,
                        CantidadDespuesFabricacion: cantidadDespuesFabricacion,
                        FechaIngresoLote: lote?.fechaIngreso ? new Date(lote.fechaIngreso).toLocaleString() : "N/A",
                        Proveedor: proveedorNombre,
                        CostoUnitarioLote: lote?.costoUnitario || "N/A",
                        CantidadDisponibleLote: lote?.cantidadDisponible || "N/A",
                        IdOrdenLote: lote?.idOrden || "N/A",

                        // Columnas de la producción
                        FechaProduccionOriginal: produccion?.fecha ? new Date(produccion.fecha).toLocaleString() : "N/A",
                        NotasProduccion: produccion?.notas || "N/A"
                    };
                });

                // Hoja Producciones separada
                const produccionesSheetData = producciones.map((prod) => ({
                    IdProduccion: prod.idProduccion,
                    IdProducto: prod.idProducto,
                    ProductoNombre: productos.find(p => p.idProducto === prod.idProducto)?.nombre || "N/A",
                    Fecha: prod.fecha ? new Date(prod.fecha).toLocaleString() : "N/A",
                    Notas: prod.notas || "Sin notas"
                }));

                // Crear workbook con múltiples hojas
                const wb = XLSX.utils.book_new();

                const ws1 = XLSX.utils.json_to_sheet(productosSheetData);
                XLSX.utils.book_append_sheet(wb, ws1, "Productos");

                const ws2 = XLSX.utils.json_to_sheet(lotesUsadosSheetData);
                XLSX.utils.book_append_sheet(wb, ws2, "LotesUsados");

                const ws3 = XLSX.utils.json_to_sheet(produccionesSheetData);
                XLSX.utils.book_append_sheet(wb, ws3, "Producciones");

                XLSX.writeFile(wb, "Productos_Completo.xlsx");

            } else {
                // Exportar materias primas + lotes
                let lotesLocal = lotesMateriaPrima;
                if (!lotesLocal || lotesLocal.length === 0) {
                    const lotesRes = await api.get("/lotes", { headers }).catch(() => ({ data: [] }));
                    lotesLocal = lotesRes.data || [];
                }

                const materias = registrosMateria || [];

                // Hoja Materias - Actualizada según MateriaPrima entity
                const materiasSheetData = materias.map((m) => ({
                    ID: m.idMateria,
                    Nombre: m.nombre,
                    CostoUnitario: m.costo || 0,
                    PrecioVenta: m.venta || 0,
                    Cantidad: m.cantidad || 0
                }));

                // Hoja Lotes - Actualizada según Lote entity
                const lotesMateriaSheetData = lotesLocal.map((l) => {
                    const materiaNombre = materias.find((mm) => mm.idMateria === l.idMateria)?.nombre || "N/A";
                    const proveedorNombre = l.idProveedor
                        ? (proveedores.find((p) => p.idProveedor === l.idProveedor)?.nombre || "N/A")
                        : "Sin proveedor";

                    return {
                        IdLote: l.idLote,
                        IdMateria: l.idMateria,
                        MateriaNombre: materiaNombre,
                        CostoUnitario: l.costoUnitario || 0,
                        CantidadInicial: l.cantidad || 0,
                        CantidadDisponible: l.cantidadDisponible || 0,
                        CantidadUsada: l.cantidadUsada || 0,
                        FechaIngreso: l.fechaIngreso ? new Date(l.fechaIngreso).toLocaleString() : "N/A",
                        Proveedor: proveedorNombre,
                        IdOrden: l.idOrden || "N/A"
                    };
                });

                const wb = XLSX.utils.book_new();

                const ws1 = XLSX.utils.json_to_sheet(materiasSheetData);
                XLSX.utils.book_append_sheet(wb, ws1, "MateriasPrimas");

                const ws2 = XLSX.utils.json_to_sheet(lotesMateriaSheetData);
                XLSX.utils.book_append_sheet(wb, ws2, "LotesMateria");

                XLSX.writeFile(wb, "MateriasPrimas_Completo.xlsx");
            }
        } catch (err) {
            handleApiError(err, "exportar a excel");
            alert("Error exportando datos. Revisa la consola.");
        }
    };

    if (isLoading) {
        return <div className="text-center mt-5">Cargando inventario...</div>;
    }

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center">Inventario</h2>
            <div className="mb-3 d-flex justify-content-between">
                <div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="opcionInventario"
                            id="opcion1"
                            value="opcion1"
                            checked={opcionSeleccionada === "opcion1"}
                            onChange={(e) => setOpcionSeleccionada(e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="opcion1">
                            Productos
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="opcionInventario"
                            id="opcion2"
                            value="opcion2"
                            checked={opcionSeleccionada === "opcion2"}
                            onChange={(e) => setOpcionSeleccionada(e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="opcion2">
                            Materias Primas
                        </label>
                    </div>
                </div>
                <div>
                    <BotonAgregar onClick={handleAgregar}></BotonAgregar>
                    <BotonExportar onClick={exportToExcel}>Exportar</BotonExportar>
                </div>
            </div>
            {opcionSeleccionada === "opcion1" && (
                <TablaProductos
                    ref={tablaProductosRef}
                    registrosMateria={registrosMateria}
                    lotesMateriaPrima={lotesMateriaPrima}
                    setRegistrosMateria={setRegistrosMateria}
                    setLotesMateriaPrima={setLotesMateriaPrima}
                    proveedores={proveedores}
                    token={token}
                />
            )}
            {opcionSeleccionada === "opcion2" && (
                <TablaMaterias
                    ref={tablaMateriasRef}
                    registrosMateria={registrosMateria}
                    setRegistrosMateria={setRegistrosMateria}
                    lotesMateriaPrima={lotesMateriaPrima}
                    setLotesMateriaPrima={setLotesMateriaPrima}
                    proveedores={proveedores}
                />
            )}
        </div>
    );
};

export default Inventario;
