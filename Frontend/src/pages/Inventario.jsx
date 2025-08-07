import { useRef, useState, useEffect } from "react";
import TablaProductos from "../components/TablaProductos";
import TablaMaterias from "../components/TablaMaterias";
import BotonAgregar from "../components/BotonAgregar";
import BotonExportar from "../components/BotonExportar";
import Modal from "../components/Modal";
import BotonAceptar from "../components/BotonAceptar";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";

export const Inventario = () => {
    const token = localStorage.getItem("accessToken");
    const [opcionSeleccionada, setOpcionSeleccionada] = useState("opcion1");
    const tablaProductosRef = useRef(null);
    const tablaMateriasRef = useRef(null);
    const [registrosMateria, setRegistrosMateria] = useState([]);
    const [lotesMateriaPrima, setLotesMateriaPrima] = useState([]);
    const [proveedores, setProveedores] = useState([]);
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
        const fetchData = async () => {
            if (!token) {
                setError("No se encontró un token de autenticación. Por favor, inicia sesión.");
                setIsLoading(false);
                return;
            }

            console.log("Token enviado:", token);
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [materiasRes, lotesRes, proveedoresRes] = await Promise.all([
                    api.get("/inventarioMateria", { headers }).catch((err) => {
                        throw new Error("Error al obtener materias primas: " + err.message);
                    }),
                    api.get("/lotes", { headers }),
                    api.get("/proveedores", { headers }),
                ]);
                console.log("Datos cargados:", {
                    materias: materiasRes.data,
                    lotes: lotesRes.data,
                    proveedores: proveedoresRes.data,
                });

                // Validar datos de localStorage
                const validateData = (data, key) => {
                    try {
                        return data && Array.isArray(JSON.parse(data)) ? JSON.parse(data) : [];
                    } catch {
                        console.warn(`Datos corruptos en localStorage para ${key}`);
                        return [];
                    }
                };

                setRegistrosMateria(materiasRes.data);
                setLotesMateriaPrima(lotesRes.data);
                setProveedores(proveedoresRes.data);
                localStorage.setItem("registrosMateria", JSON.stringify(materiasRes.data));
                localStorage.setItem("lotesMateriaPrima", JSON.stringify(lotesRes.data));
                localStorage.setItem("proveedores", JSON.stringify(proveedoresRes.data));
                setIsLoading(false);
            } catch (err) {
                handleApiError(err, "carga de datos iniciales");
                const savedMaterias = localStorage.getItem("registrosMateria");
                const savedLotes = localStorage.getItem("lotesMateriaPrima");
                const savedProveedores = localStorage.getItem("proveedores");
                setRegistrosMateria(validateData(savedMaterias, "registrosMateria"));
                setLotesMateriaPrima(validateData(savedLotes, "lotesMateriaPrima"));
                setProveedores(validateData(savedProveedores, "proveedores"));
                setIsLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const manejarAgregar = () => {
        if (opcionSeleccionada === "opcion1") {
            tablaProductosRef.current?.abrirModalAgregar();
        } else {
            tablaMateriasRef.current?.abrirModalAgregar();
        }
    };

    if (isLoading) {
        return <div className="text-center mt-5">Cargando inventario...</div>;
    }

    return (
        <main className="main-home inventario">
            <div className="container">
                <h2>Inventarios</h2>
            </div>
            {error && (
                <Modal isOpen={!!error} onClose={() => setError(null)}>
                    <div className="encabezado-modal">
                        <h2>Error</h2>
                    </div>
                    <p className="text-center">{error}</p>
                    <div className="pie-modal">
                        <BotonAceptar onClick={() => setError(null)} />
                    </div>
                </Modal>
            )}
            <div className="container inventario-div-checks">
                <BotonAgregar onClick={manejarAgregar} />
                <div className="inventario-div-checks d-flex gap-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="inventarioOpcion"
                            id="checkProductos"
                            value="opcion1"
                            checked={opcionSeleccionada === "opcion1"}
                            onChange={() => setOpcionSeleccionada("opcion1")}
                        />
                        <label className="form-check-label" htmlFor="checkProductos">
                            Productos
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="inventarioOpcion"
                            id="checkMateriaPrima"
                            value="opcion2"
                            checked={opcionSeleccionada === "opcion2"}
                            onChange={() => setOpcionSeleccionada("opcion2")}
                        />
                        <label className="form-check-label" htmlFor="checkMateriaPrima">
                            Materia Prima
                        </label>
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
                    token={token}
                />
            ) : (
                <TablaMaterias
                    ref={tablaMateriasRef}
                    registrosMateria={registrosMateria}
                    setRegistrosMateria={setRegistrosMateria}
                    lotesMateriaPrima={lotesMateriaPrima}
                    setLotesMateriaPrima={setLotesMateriaPrima}
                    proveedores={proveedores}
                    token={token}
                />
            )}
        </main>
    );
};