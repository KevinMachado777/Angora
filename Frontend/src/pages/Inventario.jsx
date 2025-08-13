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
    const exportToExcel = async () => {
        if (!token) {
            alert("No hay token de autenticación disponible.");
            return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (opcionSeleccionada === "opcion1") {
                // Exportar productos + lotes usados (+ producciones-lotes para obtener idProduccion)
                const [productosRes, categoriasRes, lotesUsadosRes, produccionesLotesRes] = await Promise.all([
                    api.get("/inventarioProducto", { headers }),
                    api.get("/categorias", { headers }).catch(() => ({ data: [] })),
                    api.get("/lotes-usados", { headers }).catch(() => ({ data: [] })),
                    api.get("/producciones-lotes", { headers }).catch(() => ({ data: [] })),
                ]);

                const productos = productosRes.data || [];
                const categorias = categoriasRes.data || [];
                const lotesUsados = lotesUsadosRes.data || [];
                const produccionesLotes = produccionesLotesRes.data || [];

                // Hoja Productos
                const productosSheetData = productos.map((p) => ({
                    ID: p.idProducto,
                    Nombre: p.nombre,
                    Costo: p.costo,
                    Precio: p.precio,
                    Cantidad: p.stock ?? 0,
                    Categoria:
                        categorias.find((cat) => cat.idCategoria === p.idCategoria?.idCategoria)?.nombre || "Sin categoría",
                }));

                // Obtener lotes (preferimos los que ya cargó el estado local)
                let lotesLocal = lotesMateriaPrima;
                if (!lotesLocal || lotesLocal.length === 0) {
                    // pedir lotes si no vienen en state
                    const lotesRes = await api.get("/lotes", { headers }).catch(() => ({ data: [] }));
                    lotesLocal = lotesRes.data || [];
                }

                // Construir hoja LotesUsados con las 4 columnas que pediste + idProduccion
                const lotesUsadosSheetData = lotesUsados.map((lu) => {
                    const lote = lotesLocal.find((l) => l.idLote === lu.idLote) || {};
                    const producto = productos.find((p) => p.idProducto === lu.idProducto) || {};

                    const cantidadInicial = lote?.cantidad ?? 0;
                    const cantidadUsada = lu.cantidadUsada ?? 0;

                    // Suma acumulada de usos del mismo lote hasta la fecha de esta producción (inclusive)
                    const usedUntilThis = lotesUsados
                        .filter(
                            (x) =>
                                x.idLote === lu.idLote &&
                                x.fechaProduccion &&
                                lu.fechaProduccion &&
                                new Date(x.fechaProduccion) <= new Date(lu.fechaProduccion)
                        )
                        .reduce((s, x) => s + (x.cantidadUsada ?? 0), 0);

                    // Cantidad antes de la producción actual (restando los usos anteriores, excluyendo el actual)
                    const cantidadAntesFabricacion = cantidadInicial - (usedUntilThis - cantidadUsada);
                    // Cantidad después
                    const cantidadDespuesFabricacion = Math.max(0, cantidadAntesFabricacion - cantidadUsada);

                    const materiaNombre =
                        lote?.idMateria != null
                            ? registrosMateria.find((m) => m.idMateria === lote.idMateria)?.nombre || "N/A"
                            : "N/A";

                    const proveedorNombre = lote?.idProveedor
                        ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                        : "Sin proveedor";

                    // Buscar produccionLote para obtener idProduccion si existe
                    const produccionLote = produccionesLotes.find(
                        (pl) =>
                            pl.idLote === lu.idLote &&
                            Math.abs((pl.cantidadUsadaDelLote ?? 0) - (lu.cantidadUsada ?? 0)) < 1e-6
                    );

                    const idProduccion = produccionLote?.idProduccion ?? lu.idProduccion ?? "N/A";

                    return {
                        idRegistro: lu.id ?? "N/A",
                        idProducto: lu.idProducto,
                        productoNombre: producto?.nombre || "N/A",
                        idLote: lu.idLote,
                        materiaNombre,
                        CantidadInicial: cantidadInicial,
                        CantidadAntesFabricacion: cantidadAntesFabricacion,
                        CantidadUsada: cantidadUsada,
                        CantidadDespuesFabricacion: cantidadDespuesFabricacion,
                        idProduccion,
                        fechaProduccion: lu.fechaProduccion ?? "",
                        fechaIngresoLote: lote?.fechaIngreso ?? "",
                        proveedor: proveedorNombre,
                    };
                });

                // Build workbook
                const wb = XLSX.utils.book_new();
                const ws1 = XLSX.utils.json_to_sheet(productosSheetData);
                XLSX.utils.book_append_sheet(wb, ws1, "Productos");

                const ws2 = XLSX.utils.json_to_sheet(lotesUsadosSheetData);
                XLSX.utils.book_append_sheet(wb, ws2, "LotesUsados");

                XLSX.writeFile(wb, "Productos_y_LotesUsados.xlsx");
            } else {
                // Exportar materias + lotes de materia prima
                // usamos registrosMateria (state) y lotesMateriaPrima (state). Si no hay lotes en state pedimos.
                let lotesLocal = lotesMateriaPrima;
                if (!lotesLocal || lotesLocal.length === 0) {
                    const lotesRes = await api.get("/lotes", { headers }).catch(() => ({ data: [] }));
                    lotesLocal = lotesRes.data || [];
                }

                const materias = registrosMateria || [];

                const materiasSheetData = materias.map((m) => ({
                    ID: m.idMateria,
                    Nombre: m.nombre,
                    CostoUnitario: m.costo ?? 0,
                    PrecioVenta: m.venta ?? 0,
                    Cantidad: m.cantidad ?? 0,
                }));

                const lotesMateriaSheetData = lotesLocal.map((l) => {
                    const materiaNombre = materias.find((mm) => mm.idMateria === l.idMateria)?.nombre || "N/A";
                    const proveedorNombre = l.idProveedor ? (proveedores.find((p) => p.idProveedor === l.idProveedor)?.nombre || "N/A") : "Sin proveedor";
                    return {
                        idLote: l.idLote,
                        idMateria: l.idMateria,
                        materiaNombre,
                        costoUnitario: l.costoUnitario ?? "",
                        cantidadInicial: l.cantidad ?? "",
                        cantidadDisponible: l.cantidadDisponible ?? "",
                        fechaIngreso: l.fechaIngreso ?? "",
                        proveedor: proveedorNombre,
                    };
                });

                const wb = XLSX.utils.book_new();
                const ws1 = XLSX.utils.json_to_sheet(materiasSheetData);
                XLSX.utils.book_append_sheet(wb, ws1, "Materias");

                const ws2 = XLSX.utils.json_to_sheet(lotesMateriaSheetData);
                XLSX.utils.book_append_sheet(wb, ws2, "LotesMateria");

                XLSX.writeFile(wb, "Materias_y_Lotes.xlsx");
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
