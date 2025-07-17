import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreadorTabla } from '../components/CreadorTabla';
import TablaFacturas from "../components/TablaFacturas";
import Modal from "../components/Modal";
import "../styles/portafolio.css";
import BotonAgregar from '../components/BotonAgregar';
import BotonCancelar from '../components/BotonCancelar';
import BotonGuardar from '../components/BotonGuardar';
import BotonAceptar from '../components/BotonAceptar';
import BotonCartera from '../components/BotonCartera';
import { NumericFormat } from "react-number-format";

const Portafolio = () => {
    // Ruta del backend
    const urlBackend = "http://localhost:8080/api";

    // Cabeceros de la tabla principal
    const cabeceros = ["Id", "Nombre", "Apellido", "Correo", "Teléfono", "Dirección", "Cartera"];

    // Estados
    const [registros, setRegistros] = useState([]);
    const [creditosPorCliente, setCreditosPorCliente] = useState({});
    const [modalAbierta, setModalAbierta] = useState(false);
    const [personaSelect, setPersonaSelect] = useState(null);
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const [personaEliminar, setPersonaEliminar] = useState(null);
    const [modalCartera, setModalCartera] = useState(false);
    const [personaCartera, setPersonaCartera] = useState(null);
    const [modalCarterasAbierta, setModalCarterasAbierta] = useState(false);
    const [clientesCarteras, setClientesCarteras] = useState([]);
    const [respuestaCarteras, setRespuestaCarteras] = useState([]);
    const [creditoActivo, setCreditoActivo] = useState(false);
    const [modalAdvertenciaEliminacion, setModalAdvertenciaEliminacion] = useState(false);
    const [saldoPendiente, setSaldoPendiente] = useState(0);
    const [cantidadAbonar, setCantidadAbonar] = useState("");
    const [facturaSeleccionadaParaAbono, setFacturaSeleccionadaParaAbono] = useState(null);
    const [modalAdvertenciaAbono, setModalAdvertenciaAbono] = useState(false);
    const [botonDesactivado, setBotonDesactivado] = useState(true);
    const [modalDetallesAbierta, setModalDetallesAbierta] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    const [modalError, setModalError] = useState(null);

    // Cargar clientes y sus carteras
    useEffect(() => {
        const cargarClientes = async () => {
            try {
                const respuestaClientes = await axios.get(`${urlBackend}/clientes`, {
                    headers: { 'Accept': 'application/json' }
                });
                console.log("Respuesta GET /api/clientes:", JSON.stringify(respuestaClientes.data, null, 2));
                const clientes = await Promise.all(
                    (Array.isArray(respuestaClientes.data) ? respuestaClientes.data : []).map(async (cliente) => {
                        try {
                            const respuestaCartera = await axios.get(`${urlBackend}/carteras/${cliente.idCliente}`, {
                                headers: { 'Accept': 'application/json' }
                            });
                            console.log(`Respuesta GET /api/carteras/${cliente.idCliente}:`, JSON.stringify(respuestaCartera.data, null, 2));
                            return {
                                id: cliente.idCliente,
                                nombre: cliente.nombre,
                                apellido: cliente.apellido,
                                correo: cliente.email,
                                telefono: cliente.telefono.toString(),
                                direccion: cliente.direccion,
                                cartera: respuestaCartera.data.estado ? "Activa" : "Desactivada"
                            };
                        } catch (error) {
                            console.error(`No se encontró cartera para cliente ${cliente.idCliente}:`, error.response?.status);
                            return {
                                id: cliente.idCliente,
                                nombre: cliente.nombre,
                                apellido: cliente.apellido,
                                correo: cliente.email,
                                telefono: cliente.telefono.toString(),
                                direccion: cliente.direccion,
                                cartera: "Desactivada"
                            };
                        }
                    })
                );
                setRegistros(clientes);
            } catch (error) {
                setModalError(error.response?.data?.message || "Error al cargar los clientes.");
                console.error("Error al cargar los clientes:", error);
            }
        };
        cargarClientes();
    }, []);

    // Cargar cartera y facturas de un cliente
    useEffect(() => {
        if (personaCartera || personaSelect) {
            const clienteId = personaCartera?.id || personaSelect?.id;
            const cargarCartera = async () => {
                try {
                    const respuesta = await axios.get(`${urlBackend}/carteras/${clienteId}`, {
                        headers: { 'Accept': 'application/json' }
                    });
                    console.log(`Respuesta GET /api/carteras/${clienteId}:`, JSON.stringify(respuesta.data, null, 2));
                    const facturas = typeof respuesta.data.facturas === 'string' 
                        ? JSON.parse(respuesta.data.facturas) 
                        : Array.isArray(respuesta.data.facturas) 
                        ? respuesta.data.facturas.filter(f => f.saldoPendiente > 0) // Filtrar facturas pagadas
                        : [];
                    setCreditosPorCliente(prev => ({
                        ...prev,
                        [clienteId]: {
                            facturas,
                            saldoPendiente: respuesta.data.deudas || 0
                        }
                    }));
                    setSaldoPendiente(respuesta.data.deudas || 0);
                    setCreditoActivo(respuesta.data.estado || false);
                    setBotonDesactivado(
                        parseFloat(cantidadAbonar) <= 0 || !facturaSeleccionadaParaAbono
                    );
                } catch (error) {
                    if (error.response?.status === 404) {
                        // Cliente sin cartera
                        setCreditosPorCliente(prev => ({
                            ...prev,
                            [clienteId]: {
                                facturas: [],
                                saldoPendiente: 0
                            }
                        }));
                        setSaldoPendiente(0);
                        setCreditoActivo(false);
                        setBotonDesactivado(true);
                    } else {
                        setModalError(error.response?.data?.message || "Error al cargar la cartera del cliente.");
                        console.error(`Error al cargar cartera para cliente ${clienteId}:`, {
                            message: error.message,
                            response: error.response ? {
                                status: error.response.status,
                                data: error.response.data
                            } : null
                        });
                    }
                }
            };
            cargarCartera();
        } else {
            setBotonDesactivado(true);
        }
    }, [personaCartera, personaSelect, cantidadAbonar, facturaSeleccionadaParaAbono]);

    // Abrir modal para agregar cliente
    const abrirModalAgregar = () => {
        setPersonaSelect(null);
        setModalAbierta(true);
        setCreditoActivo(false);
        setModalError(null);
    };

    // Abrir modal para editar cliente
    const abrirModalEditar = (persona) => {
        setPersonaSelect(persona);
        setModalAbierta(true);
        setCreditoActivo(persona.cartera === "Activa");
        setModalError(null);
    };

    // Cerrar modal principal
    const cerrarModalPrincipal = () => {
        setModalAbierta(false);
        setPersonaSelect(null);
        setModalError(null);
        setCreditoActivo(false);
    };

    // Abrir modal de confirmación de eliminación
    const abrirModalEliminacion = (persona) => {
        if (persona.cartera === "Activa") {
            setPersonaEliminar(persona);
            setModalAdvertenciaEliminacion(true);
            return;
        }
        setPersonaEliminar(persona);
        setConfirmarEliminacion(true);
    };

    // Cerrar modal de confirmación de eliminación
    const cerrarModalConfirmacion = async (aceptar) => {
        if (aceptar && personaEliminar) {
            try {
                await axios.delete(`${urlBackend}/clientes/${personaEliminar.id}`, {
                    headers: { 'Accept': 'application/json' }
                });
                setRegistros(registros.filter((r) => r.id !== personaEliminar.id));
            } catch (error) {
                const errorMessage = error.response?.status === 401
                    ? "No tienes autorización para eliminar este cliente."
                    : error.response?.data?.message || "Error al eliminar el cliente.";
                setModalError(errorMessage);
                console.error("Error al eliminar el cliente:", error);
            }
        }
        setConfirmarEliminacion(false);
        setPersonaEliminar(null);
    };

    // Abrir modal de cartera
    const abrirModalcartera = (persona) => {
        setPersonaCartera(persona);
        setModalCartera(true);
        setFacturaSeleccionadaParaAbono(null);
        setCantidadAbonar("");
        setModalError(null);
    };

    // Cerrar modal de cartera
    const cerrarModalcartera = () => {
        setModalCartera(false);
        setPersonaCartera(null);
        setCantidadAbonar("");
        setFacturaSeleccionadaParaAbono(null);
        setModalError(null);
    };

    // Mostrar modal de carteras activas
    const mostrarModalCarteras = async () => {
        try {
            console.log("Iniciando mostrarModalCarteras...");
            const respuesta = await axios.get(`${urlBackend}/carteras?estado=true`, {
                headers: { 'Accept': 'application/json' }
            });
            console.log("Respuesta cruda GET /api/carteras?estado=true:", {
                status: respuesta.status,
                headers: respuesta.headers,
                data: JSON.stringify(respuesta.data, null, 2)
            });

            // Parsear respuesta si es una cadena
            const carteras = typeof respuesta.data === 'string' 
                ? JSON.parse(respuesta.data) 
                : Array.isArray(respuesta.data) 
                ? respuesta.data 
                : [];
            setRespuestaCarteras(carteras);
            console.log("Carteras recibidas (post-array check):", carteras);

            // Filtrar carteras válidas
            const clientesCarteras = carteras
                .filter(cartera => {
                    const isEstadoActivo = cartera.estado === true || cartera.estado === "true" || cartera.estado === 1;
                    const hasIdCliente = cartera.idCliente !== null && cartera.idCliente !== undefined;
                    const isValid = hasIdCliente && isEstadoActivo;
                    console.log(`Validando cartera:`, {
                        idCliente: cartera.idCliente,
                        estado: cartera.estado,
                        isEstadoActivo,
                        hasIdCliente,
                        isValid,
                        facturas: cartera.facturas
                    });
                    return isValid;
                })
                .map(cartera => {
                    const idCliente = typeof cartera.idCliente === 'object' && cartera.idCliente 
                        ? cartera.idCliente.idCliente 
                        : cartera.idCliente;
                    const clienteData = typeof cartera.idCliente === 'object' && cartera.idCliente
                        ? cartera.idCliente
                        : registros.find(r => r.id === idCliente) || {};
                    console.log(`Mapeando cartera para cliente ${idCliente}:`, {
                        idCliente,
                        clienteData,
                        facturas: cartera.facturas,
                        hasFacturas: Array.isArray(cartera.facturas) && cartera.facturas.length > 0,
                        estado: cartera.estado
                    });
                    return {
                        id: idCliente,
                        nombre: clienteData.nombre || "Desconocido",
                        apellido: clienteData.apellido || "",
                        correo: clienteData.email || clienteData.correo || "",
                        telefono: clienteData.telefono?.toString() || "",
                        direccion: clienteData.direccion || "",
                        cartera: cartera.estado ? "Activa" : "Desactivada"
                    };
                });

            console.log("Clientes con carteras activas mapeados:", clientesCarteras);
            setClientesCarteras(clientesCarteras);
            console.log("Estado clientesCarteras después de setClientesCarteras:", clientesCarteras);
            setModalCarterasAbierta(true);
        } catch (error) {
            console.error("Error al cargar las carteras activas:", {
                message: error.message,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                } : null
            });
            setClientesCarteras([]);
            setRespuestaCarteras([]);
            setModalError(error.response?.data?.message || `Error al cargar las carteras activas: ${error.message}`);
        }
    };

    // Cerrar modal de carteras activas
    const cerrarModalCarteras = () => {
        setModalCarterasAbierta(false);
        setClientesCarteras([]);
        setRespuestaCarteras([]);
        setModalError(null);
    };

    // Cerrar modal de advertencia de eliminación
    const cerrarModalAdvertencia = () => {
        setModalAdvertenciaEliminacion(false);
        setPersonaEliminar(null);
    };

    // Validar ID y correo en el frontend
    const validarCliente = async (idCliente, email, isNewClient) => {
        try {
            const respuestaClientes = await axios.get(`${urlBackend}/clientes`, {
                headers: { 'Accept': 'application/json' }
            });
            const clientes = Array.isArray(respuestaClientes.data) ? respuestaClientes.data : [];
            if (isNewClient && clientes.find(c => c.idCliente === parseInt(idCliente))) {
                return "El ID del cliente ya existe.";
            }
            if (clientes.find(c => c.email.toLowerCase() === email.toLowerCase() && (isNewClient || c.idCliente !== personaSelect?.id))) {
                return "El correo electrónico ya está registrado.";
            }
            return null;
        } catch (error) {
            console.error("Error al validar cliente:", error);
            return "Error al validar el ID o correo.";
        }
    };

    // Guardar cliente
    const guardarCliente = async (e) => {
        e.preventDefault();
        const form = e.target;
        const idCliente = form.idCliente?.value ? parseInt(form.idCliente.value) : personaSelect?.id;
        const telefono = form.telefono.value ? parseInt(form.telefono.value) : personaSelect?.telefono;
        const email = form.correo.value.trim();

        if (!idCliente || isNaN(idCliente)) {
            setModalError("El ID del cliente debe ser un número válido.");
            return;
        }
        if (!telefono || isNaN(telefono)) {
            setModalError("El teléfono debe ser un número válido.");
            return;
        }

        const clienteData = {
            idCliente,
            nombre: form.nombre.value.trim(),
            apellido: form.apellido.value.trim(),
            email,
            telefono,
            direccion: form.direccion.value.trim()
        };

        console.log("Datos enviados en guardarCliente:", clienteData);

        // Validar ID y correo
        const validacionError = await validarCliente(idCliente, email, !personaSelect);
        if (validacionError) {
            setModalError(validacionError);
            return;
        }

        try {
            if (personaSelect) {
                console.log(`Enviando PUT /api/clientes/${personaSelect.id} con datos:`, clienteData);
                const respuesta = await axios.put(`${urlBackend}/clientes/${personaSelect.id}`, clienteData);
                console.log("Respuesta PUT /api/clientes:", respuesta.data);
                if (creditoActivo !== (personaSelect.cartera === "Activa")) {
                    console.log(`Enviando PUT /api/carteras/${personaSelect.id}/estado con estado:`, creditoActivo);
                    await axios.put(`${urlBackend}/carteras/${personaSelect.id}/estado`, { estado: creditoActivo });
                }
                // Recargar cartera solo si crédito está activo
                let carteraData = { estado: false, deudas: 0, facturas: [] };
                if (creditoActivo) {
                    const respuestaCartera = await axios.get(`${urlBackend}/carteras/${personaSelect.id}`);
                    console.log(`Respuesta GET /api/carteras/${personaSelect.id}:`, respuestaCartera.data);
                    carteraData = respuestaCartera.data;
                }
                setRegistros(registros.map(r => r.id === personaSelect.id ? {
                    id: respuesta.data.idCliente,
                    nombre: respuesta.data.nombre,
                    apellido: respuesta.data.apellido,
                    correo: respuesta.data.email,
                    telefono: respuesta.data.telefono.toString(),
                    direccion: respuesta.data.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada"
                } : r));
                setCreditosPorCliente(prev => ({
                    ...prev,
                    [personaSelect.id]: {
                        facturas: carteraData.facturas.filter(f => f.saldoPendiente > 0),
                        saldoPendiente: carteraData.deudas || 0
                    }
                }));
            } else {
                console.log("Enviando POST /api/clientes con datos:", clienteData);
                const respuesta = await axios.post(`${urlBackend}/clientes`, clienteData);
                console.log("Respuesta POST /api/clientes:", respuesta.data);
                if (creditoActivo) {
                    console.log(`Enviando PUT /api/carteras/${respuesta.data.idCliente}/estado con estado: true`);
                    await axios.put(`${urlBackend}/carteras/${respuesta.data.idCliente}/estado`, { estado: true });
                }
                // Solo cargar cartera si crédito está activo
                let carteraData = { estado: false, deudas: 0, facturas: [] };
                if (creditoActivo) {
                    const respuestaCartera = await axios.get(`${urlBackend}/carteras/${respuesta.data.idCliente}`);
                    console.log(`Respuesta GET /api/carteras/${respuesta.data.idCliente}:`, respuestaCartera.data);
                    carteraData = respuestaCartera.data;
                }
                setRegistros([...registros, {
                    id: respuesta.data.idCliente,
                    nombre: respuesta.data.nombre,
                    apellido: respuesta.data.apellido,
                    correo: respuesta.data.email,
                    telefono: respuesta.data.telefono.toString(),
                    direccion: respuesta.data.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada"
                }]);
                setCreditosPorCliente(prev => ({
                    ...prev,
                    [respuesta.data.idCliente]: {
                        facturas: carteraData.facturas.filter(f => f.saldoPendiente > 0),
                        saldoPendiente: carteraData.deudas || 0
                    }
                }));
            }
            cerrarModalPrincipal();
        } catch (error) {
            const errorMessage = error.response?.status === 400
                ? error.response.data.message || "Error de validación al guardar el cliente."
                : error.response?.status === 404 && !creditoActivo
                ? null // Ignorar 404 si no se creó cartera
                : "Error al guardar el cliente.";
            if (errorMessage) {
                setModalError(errorMessage);
            }
            console.error("Error en guardarCliente:", error);
        }
    };

    // Procesar abono
    const procesarAbono = async () => {
        const cantidad = parseFloat(cantidadAbonar) || 0;
        if (cantidad <= 0 || !facturaSeleccionadaParaAbono) {
            setModalAdvertenciaAbono(true);
            return;
        }
        try {
            console.log("Enviando POST /api/carteras/", personaCartera.id, "/abonos con datos:", {
                cantidad,
                fecha: new Date().toISOString().split('T')[0],
                idFactura: facturaSeleccionadaParaAbono.idFactura
            });
            const respuesta = await axios.post(`${urlBackend}/carteras/${personaCartera.id}/abonos`, {
                cantidad,
                fecha: new Date().toISOString().split('T')[0],
                idFactura: facturaSeleccionadaParaAbono.idFactura
            });
            console.log("Respuesta POST /api/carteras/", personaCartera.id, "/abonos:", respuesta.data);
            const facturas = Array.isArray(respuesta.data.facturas) 
                ? respuesta.data.facturas.filter(f => f.saldoPendiente > 0) // Filtrar facturas pagadas
                : [];
            setCreditosPorCliente(prev => ({
                ...prev,
                [personaCartera.id]: {
                    facturas,
                    saldoPendiente: respuesta.data.deudas || 0
                }
            }));
            setSaldoPendiente(respuesta.data.deudas || 0);
            setRegistros(registros.map(r => r.id === personaCartera.id ? {
                ...r,
                cartera: respuesta.data.estado ? "Activa" : "Desactivada"
            } : r));
            setCantidadAbonar("");
            setFacturaSeleccionadaParaAbono(null);
            cerrarModalcartera();
        } catch (error) {
            setModalError(error.response?.data?.message || "Error al procesar el abono.");
            console.error("Error al procesar el abono:", error);
        }
    };

    // Abrir modal de detalles de factura
    const abrirModalDetalles = (facturaRow) => {
        try {
            console.log("facturaRow recibida en abrirModalDetalles:", facturaRow);
            let facturaObj;
            if (Array.isArray(facturaRow)) {
                facturaObj = facturaRow[facturaRow.length - 1]?._factura;
            } else {
                facturaObj = facturaRow._factura || facturaRow;
            }
            console.log("facturaObj extraída:", facturaObj);
            if (!facturaObj || !facturaObj.idFactura) {
                throw new Error("ID de factura no válido.");
            }
            const clienteId = personaCartera?.id || personaSelect?.id;
            console.log("creditosPorCliente:", creditosPorCliente);
            console.log("Buscando factura con idFactura:", facturaObj.idFactura, "para clienteId:", clienteId);
            const factura = creditosPorCliente[clienteId]?.facturas?.find(f => f.idFactura === facturaObj.idFactura);
            if (!factura) {
                throw new Error("Factura no encontrada en creditosPorCliente.");
            }
            console.log("Factura seleccionada para detalles:", factura);
            setFacturaSeleccionada(factura);
            setModalDetallesAbierta(true);
        } catch (error) {
            setModalError(error.message || "Error al cargar los detalles de la factura.");
            console.error("Error al cargar los detalles de la factura:", error);
        }
    };

    // Cerrar modal de detalles
    const cerrarModalDetalles = () => {
        setModalDetallesAbierta(false);
        setFacturaSeleccionada(null);
    };

    return (
        <main className='main-home inventario'>
            <div className="titulo">
                <h1>Clientes</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <BotonAgregar onClick={abrirModalAgregar} />
                    <button className="btn-cartera-activa" onClick={mostrarModalCarteras}>
                        <i className="bi bi-wallet2"></i> Personas con Cartera
                    </button>
                </div>
            </div>

            <CreadorTabla
                cabeceros={cabeceros}
                registros={registros}
                onEditar={abrirModalEditar}
                onEliminar={abrirModalEliminacion}
            />
            {registros.length === 0 && !modalError && (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    No hay clientes en el portafolio de momento.
                </p>
            )}

            {modalCarterasAbierta && (
                <Modal isOpen={modalCarterasAbierta} onClose={cerrarModalCarteras}>
                    <div className="encabezado-modal">
                        <h2>Clientes con cartera activa</h2>
                    </div>
                    <div>
                        <p style={{ marginBottom: '10px', color: 'red', whiteSpace: 'pre-wrap' }}>
                            DEBUG: clientesCarteras = {JSON.stringify(clientesCarteras, null, 2)}
                            {clientesCarteras.length === 0 && (
                                <>
                                    <br />
                                    DEBUG: Respuesta API /carteras?estado=true = {JSON.stringify(respuestaCarteras, null, 2)}
                                    {modalError && (
                                        <>
                                            <br />
                                            DEBUG: Error = {modalError}
                                        </>
                                    )}
                                </>
                            )}
                        </p>
                        {clientesCarteras.length === 0 ? (
                            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                                No hay clientes con carteras activas.
                            </p>
                        ) : (
                            clientesCarteras.map((registro) => (
                                <div key={registro.id} className="cartera-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '10px' }}>{registro.nombre} {registro.apellido}</span>
                                    <BotonCartera onClick={() => abrirModalcartera(registro)} />
                                </div>
                            ))
                        )}
                    </div>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalCarteras} />
                    </div>
                </Modal>
            )}

            {modalAbierta && (
                <Modal isOpen={modalAbierta} onClose={cerrarModalPrincipal}>
                    <div className="encabezado-modal">
                        <h2>{personaSelect ? "Modificar Cliente" : "Agregar Cliente"}</h2>
                    </div>
                    <form onSubmit={guardarCliente}>
                        {!personaSelect && (
                            <div className="grupo-formulario">
                                <label>ID Cliente:</label>
                                <input
                                    type="number"
                                    name="idCliente"
                                    className="form-control mb-2"
                                    required
                                    min="1"
                                />
                            </div>
                        )}
                        <div className="grupo-formulario">
                            <label>Nombre:</label>
                            <input
                                type="text"
                                name="nombre"
                                defaultValue={personaSelect ? personaSelect.nombre : ""}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Apellido:</label>
                            <input
                                type="text"
                                name="apellido"
                                defaultValue={personaSelect ? personaSelect.apellido : ""}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Correo:</label>
                            <input
                                type="email"
                                name="correo"
                                defaultValue={personaSelect ? personaSelect.correo : ""}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Teléfono:</label>
                            <input
                                type="number"
                                name="telefono"
                                defaultValue={personaSelect ? personaSelect.telefono : ""}
                                className="form-control mb-2"
                                required
                                min="0"
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Dirección:</label>
                            <input
                                type="text"
                                name="direccion"
                                defaultValue={personaSelect ? personaSelect.direccion : ""}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={creditoActivo}
                                    onChange={(e) => {
                                        const nuevasFacturas = creditosPorCliente[personaSelect?.id]?.facturas?.length || 0;
                                        if (e.target.checked || nuevasFacturas === 0) {
                                            setCreditoActivo(e.target.checked);
                                        }
                                    }}
                                    disabled={creditoActivo && (creditosPorCliente[personaSelect?.id]?.facturas?.length || 0) > 0}
                                /> Crédito
                            </label>
                        </div>

                        {creditoActivo && personaSelect && (
                            <div>
                                <h3>Facturas por crédito</h3>
                                {creditosPorCliente[personaSelect?.id]?.facturas?.length > 0 ? (
                                    <TablaFacturas
                                        encabezados={["Id Factura", "Fecha", "Total", "Saldo Pendiente"]}
                                        registros={creditosPorCliente[personaSelect.id].facturas.map(factura => [
                                            factura.idFactura,
                                            new Date(factura.fecha).toLocaleDateString('es-CO'),
                                            `$${factura.total.toLocaleString('es-CO')}`,
                                            `$${factura.saldoPendiente.toLocaleString('es-CO')}`,
                                            { _factura: factura }
                                        ])}
                                        onIconClick={abrirModalDetalles}
                                    />
                                ) : (
                                    <p style={{ marginTop: '20px' }}>No hay facturas de crédito asociadas.</p>
                                )}
                            </div>
                        )}

                        <div className="pie-modal">
                            <BotonCancelar type="button" onClick={cerrarModalPrincipal} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}

            {confirmarEliminacion && (
                <Modal isOpen={confirmarEliminacion} onClose={() => cerrarModalConfirmacion(false)}>
                    <div className="encabezado-modal">
                        <h2>Confirmar Eliminación</h2>
                    </div>
                    <p>¿Desea eliminar al cliente {personaEliminar?.nombre} {personaEliminar?.apellido}?</p>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={() => cerrarModalConfirmacion(false)} />
                        <BotonAceptar onClick={() => cerrarModalConfirmacion(true)} />
                    </div>
                </Modal>
            )}

            {modalCartera && (
                <Modal isOpen={modalCartera} onClose={cerrarModalcartera} style={{ zIndex: 1100 }}>
                    <div className="encabezado-modal">
                        <h2 style={{ textAlign: 'center' }}>
                            Cartera del Cliente
                            <br />
                            <strong>{personaCartera?.nombre} {personaCartera?.apellido}</strong>
                        </h2>
                    </div>

                    {personaCartera && (
                        <div className="cartera-container">
                            <label className="cartera-label">Saldo pendiente total</label>
                            <input
                                type="text"
                                disabled
                                className="cartera-input"
                                value={`$${saldoPendiente.toLocaleString('es-CO')}`}
                            />

                            <label className="cartera-label">Seleccionar factura para abono</label>
                            <select
                                className="cartera-input"
                                value={facturaSeleccionadaParaAbono?.idFactura || ""}
                                onChange={(e) => {
                                    const factura = creditosPorCliente[personaCartera.id]?.facturas.find(
                                        f => f.idFactura === parseInt(e.target.value)
                                    );
                                    setFacturaSeleccionadaParaAbono(factura || null);
                                    setBotonDesactivado(
                                        parseFloat(cantidadAbonar) <= 0 || !factura
                                    );
                                }}
                            >
                                <option value="">Seleccione una factura</option>
                                {creditosPorCliente[personaCartera.id]?.facturas?.filter(f => f.saldoPendiente > 0).map(factura => (
                                    <option key={factura.idFactura} value={factura.idFactura}>
                                        Factura #{factura.idFactura} - {new Date(factura.fecha).toLocaleDateString('es-CO')} - ${factura.saldoPendiente.toLocaleString('es-CO')}
                                    </option>
                                ))}
                            </select>

                            <label className="cartera-label">Va a hacer un abono de</label>
                            <input
                                type="number"
                                name="abono"
                                id="abono"
                                placeholder="$ Ingrese el valor"
                                className="cartera-input"
                                value={cantidadAbonar}
                                onChange={(e) => {
                                    setCantidadAbonar(e.target.value);
                                    setBotonDesactivado(
                                        parseFloat(e.target.value) <= 0 || !facturaSeleccionadaParaAbono
                                    );
                                }}
                                min="0"
                            />

                            {saldoPendiente > 0 && creditosPorCliente[personaCartera.id]?.facturas?.length > 0 ? (
                                <div className="cartera-tabla">
                                    <TablaFacturas
                                        encabezados={["Id Factura", "Fecha", "Total", "Saldo Pendiente"]}
                                        registros={creditosPorCliente[personaCartera.id].facturas.map(factura => [
                                            factura.idFactura,
                                            new Date(factura.fecha).toLocaleDateString('es-CO'),
                                            `$${factura.total.toLocaleString('es-CO')}`,
                                            `$${factura.saldoPendiente.toLocaleString('es-CO')}`,
                                            { _factura: factura }
                                        ])}
                                        onIconClick={abrirModalDetalles}
                                    />
                                </div>
                            ) : (
                                <p style={{ marginTop: '20px' }}>No hay facturas de crédito asociadas.</p>
                            )}
                        </div>
                    )}

                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalcartera} />
                        <BotonGuardar type="button" onClick={procesarAbono} disabled={botonDesactivado} />
                    </div>
                </Modal>
            )}

            {modalDetallesAbierta && (
                <Modal isOpen={modalDetallesAbierta} onClose={cerrarModalDetalles}>
                    <div className="encabezado-modal">
                        <h2>Detalles de la Factura</h2>
                    </div>
                    {facturaSeleccionada && (
                        <div className="ticket">
                            <h2 style={{ textAlign: "center" }}>Fragancey´s</h2>
                            <p><strong>Ticket #{facturaSeleccionada.idFactura}</strong></p>
                            <p>Fecha: {new Date(facturaSeleccionada.fecha).toLocaleDateString('es-CO')}</p>
                            <p>Cliente: {personaCartera?.nombre || personaSelect?.nombre} {personaCartera?.apellido || personaSelect?.apellido}</p>
                            <hr />
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Cant.</th>
                                        <th>Precio</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facturaSeleccionada.producto && Array.isArray(facturaSeleccionada.producto) && facturaSeleccionada.producto.length > 0 ? (
                                        facturaSeleccionada.producto.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.idProducto || 'N/A'}</td>
                                                <td>{item.nombre || 'Desconocido'}</td>
                                                <td>{item.cantidad || 1}</td>
                                                <td>
                                                    <NumericFormat
                                                        value={item.precioUnitario || item.precio || facturaSeleccionada.subtotal || 0}
                                                        displayType="text"
                                                        thousandSeparator
                                                        prefix="$"
                                                    />
                                                </td>
                                                <td>
                                                    <NumericFormat
                                                        value={(item.cantidad || 1) * (item.precioUnitario || item.precio || facturaSeleccionada.subtotal || 0)}
                                                        displayType="text"
                                                        thousandSeparator
                                                        prefix="$"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5">No hay productos en esta factura.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <hr />
                            <p>
                                <strong>Total a pagar: </strong>
                                <NumericFormat
                                    value={facturaSeleccionada.total || 0}
                                    displayType="text"
                                    thousandSeparator
                                    prefix="$"
                                />
                            </p>
                            <p>
                                <strong>Saldo pendiente: </strong>
                                <NumericFormat
                                    value={facturaSeleccionada.saldoPendiente || 0}
                                    displayType="text"
                                    thousandSeparator
                                    prefix="$"
                                />
                            </p>
                            <p style={{ textAlign: "center", marginTop: "1em" }}>
                                ¡Gracias por tu compra!
                            </p>
                        </div>
                    )}
                    <div className="pie-modal">
                        <BotonAceptar type="button" onClick={cerrarModalDetalles} />
                    </div>
                </Modal>
            )}

            {modalAdvertenciaEliminacion && (
                <Modal isOpen={modalAdvertenciaEliminacion} onClose={cerrarModalAdvertencia}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>Este cliente no se puede eliminar ya que tiene el crédito activado.</p>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalAdvertencia} />
                    </div>
                </Modal>
            )}

            {modalAdvertenciaAbono && (
                <Modal isOpen={modalAdvertenciaAbono} onClose={() => setModalAdvertenciaAbono(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>El abono no puede ser menor o igual a 0 y debe seleccionar una factura válida.</p>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={() => setModalAdvertenciaAbono(false)} />
                    </div>
                </Modal>
            )}

            {modalError && (
                <Modal isOpen={!!modalError} onClose={() => setModalError(null)}>
                    <div className="encabezado-modal">
                        <h2>Error</h2>
                    </div>
                    <p>{modalError}</p>
                    <div className="pie-modal">
                        <BotonAceptar type="button" onClick={() => setModalError(null)} />
                    </div>
                </Modal>
            )}
        </main>
    );
};

export default Portafolio;