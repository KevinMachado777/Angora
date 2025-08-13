import { useState, useEffect, useRef } from "react";
import TablaProductos from "../components/TablaProductos";
import TablaMaterias from "../components/TablaMaterias";
import BotonExportar from "../components/BotonExportar";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";
import BotonAgregar from "../components/BotonAgregar";

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
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
        });
        if (err.response?.status === 401) {
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
                    <BotonExportar>Exportar</BotonExportar>
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