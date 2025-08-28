import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreadorTablaClientes } from '../components/CreadorTablaClientes';
import TablaFacturas from "../components/TablaFacturas";
import Modal from "../components/Modal";
import "../styles/portafolio.css";
import BotonAgregar from '../components/BotonAgregar';
import BotonCancelar from '../components/BotonCancelar';
import BotonGuardar from '../components/BotonGuardar';
import BotonAceptar from '../components/BotonAceptar';
import BotonCartera from '../components/BotonCartera';
import { NumericFormat } from "react-number-format";

// Componente principal para gestionar el portafolio de clientes
const Portafolio = () => {
    // Define la URL del backend
    const urlBackend = "http://localhost:8080/angora/api/v1";

    // Define los encabezados de la tabla principal
    const cabeceros = ["Id", "Nombre", "Apellido", "Correo", "Teléfono", "Dirección", "Cartera", "Tipo"];

    // Estados
    const [registros, setRegistros] = useState([]);
    const [creditosPorCliente, setCreditosPorCliente] = useState({});
    const [modalAbierta, setModalAbierta] = useState(false);
    const [personaSelect, setPersonaSelect] = useState(null);
    const [confirmarDesactivacion, setConfirmarDesactivacion] = useState(false);
    const [personaDesactivar, setPersonaDesactivar] = useState(null);
    const [modalCartera, setModalCartera] = useState(false);
    const [personaCartera, setPersonaCartera] = useState(null);
    const [modalCarterasAbierta, setModalCarterasAbierta] = useState(false);
    const [clientesCarteras, setClientesCarteras] = useState([]);
    const [respuestaCarteras, setRespuestaCarteras] = useState([]);
    const [creditoActivo, setCreditoActivo] = useState(false);
    const [modalAdvertenciaDesactivacion, setModalAdvertenciaDesactivacion] = useState(false);
    const [saldoPendiente, setSaldoPendiente] = useState(0);
    const [cantidadAbonar, setCantidadAbonar] = useState("");
    const [facturaSeleccionadaParaAbono, setFacturaSeleccionadaParaAbono] = useState(null);
    const [modalAdvertenciaAbono, setModalAdvertenciaAbono] = useState(false);
    const [botonDesactivado, setBotonDesactivado] = useState(true);
    const [modalDetallesAbierta, setModalDetallesAbierta] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [modalInactivos, setModalInactivos] = useState(false);
    const [clientesInactivos, setClientesInactivos] = useState([]);
    const [filtroIdCliente, setFiltroIdCliente] = useState("");
    const [filtroIdCartera, setFiltroIdCartera] = useState("");
    const [modalConfirmarReactivacion, setModalConfirmarReactivacion] = useState(false);
    const [clienteReactivar, setClienteReactivar] = useState(null);
    const [reactivacionPorId, setReactivacionPorId] = useState(false);
    const [modalHistorialAbierta, setModalHistorialAbierta] = useState(false);
    const [historialAbonos, setHistorialAbonos] = useState([]);
    const [personaHistorial, setPersonaHistorial] = useState(null);
    const [currentPageHistorial, setCurrentPageHistorial] = useState(1);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [formData, setFormData] = useState({
        idCliente: "",
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        direccion: "",
        mayorista: false
    });
    const [modalMensaje, setModalMensaje] = useState({ abierto: false, tipo: "", mensaje: "" });

    // Obtiene el token de acceso del almacenamiento local
    const token = localStorage.getItem("accessToken");

    // Carga los clientes activos y sus carteras al montar el componente
    useEffect(() => {
        const cargarClientes = async () => {
            try {
                const respuestaClientes = await axios.get(`${urlBackend}/clientes`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log("Respuesta GET /api/clientes:", JSON.stringify(respuestaClientes.data, null, 2));
                const clientes = await Promise.all(
                    (Array.isArray(respuestaClientes.data) ? respuestaClientes.data : []).map(async (cliente) => {
                        try {
                            const respuestaCartera = await axios.get(`${urlBackend}/carteras/${cliente.idCliente}`, {
                                headers: {
                                    'Accept': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            console.log(`Respuesta GET /api/carteras/${cliente.idCliente}:`, JSON.stringify(respuestaCartera.data, null, 2));
                            return {
                                id: cliente.idCliente,
                                nombre: cliente.nombre,
                                apellido: cliente.apellido,
                                correo: cliente.email,
                                telefono: cliente.telefono.toString(),
                                direccion: cliente.direccion,
                                cartera: respuestaCartera.data.estado ? "Activa" : "Desactivada",
                                mayorista: cliente.mayorista,
                                tipo: cliente.mayorista ? "Mayorista" : "Común"
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
                                cartera: "Desactivada",
                                mayorista: cliente.mayorista,
                                tipo: cliente.mayorista ? "Mayorista" : "Común"
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

    // Carga la cartera y facturas de un cliente cuando se selecciona
    useEffect(() => {
        if (personaCartera || personaSelect) {
            const clienteId = personaCartera?.id || personaSelect?.id;
            const cargarCartera = async () => {
                try {
                    const respuesta = await axios.get(`${urlBackend}/carteras/${clienteId}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const facturas = Array.isArray(respuesta.data.facturas)
                        ? respuesta.data.facturas.filter(f => f.saldoPendiente > 0)
                        : [];
                    setCreditosPorCliente(prev => ({
                        ...prev,
                        [clienteId]: {
                            facturas,
                            saldoPendiente: respuesta.data.deudas || 0,
                            abono: respuesta.data.abono || 0,
                            creditoAFavor: respuesta.data.creditoAFavor || 0
                        }
                    }));
                    setSaldoPendiente(respuesta.data.deudas || 0);
                    setCreditoActivo(respuesta.data.estado || false);
                    const creditoAFavor = respuesta.data.creditoAFavor || 0;
                    setBotonDesactivado(parseFloat(cantidadAbonar) <= 0 || !facturaSeleccionadaParaAbono ||
                        (parseFloat(cantidadAbonar) > (respuesta.data.deudas + creditoAFavor)));
                } catch (error) {
                    if (error.response?.status === 404) {
                        setCreditosPorCliente(prev => ({
                            ...prev,
                            [clienteId]: {
                                facturas: [],
                                saldoPendiente: 0,
                                abono: 0,
                                creditoAFavor: 0
                            }
                        }));
                        setSaldoPendiente(0);
                        setCreditoActivo(false);
                        setBotonDesactivado(true);
                    } else {
                        setModalError(error.response?.data?.message || "Error al cargar la cartera del cliente.");
                        console.error(`Error al cargar cartera para cliente ${clienteId}:`, error);
                    }
                }
            };
            cargarCartera();
        } else {
            setBotonDesactivado(true);
        }
    }, [personaCartera, personaSelect, cantidadAbonar, facturaSeleccionadaParaAbono]);

    // Abre la modal para agregar un cliente nuevo
    const abrirModalAgregar = () => {
        setFormData({
            idCliente: "",
            nombre: "",
            apellido: "",
            correo: "",
            telefono: "",
            direccion: "",
            mayorista: false
        });
        setPersonaSelect(null);
        setModalAbierta(true);
        setCreditoActivo(false);
        setModalError(null);
    };

    // Abre la modal para editar un cliente existente
    const abrirModalEditar = (persona) => {
        setFormData({
            idCliente: persona.id.toString(),
            nombre: persona.nombre,
            apellido: persona.apellido,
            correo: persona.correo,
            telefono: persona.telefono.toString(),
            direccion: persona.direccion,
            mayorista: persona.mayorista || false
        });
        setPersonaSelect(persona);
        setModalAbierta(true);
        setCreditoActivo(persona.cartera === "Activa");
        setModalError(null);
    };

    // Cierra la modal principal
    const cerrarModalPrincipal = () => {
        setModalAbierta(false);
        setPersonaSelect(null);
        setModalError(null);
        setCreditoActivo(false);
    };

    // Función para abrir la modal de historial de abonos
    const abrirModalHistorial = async (persona) => {
        if (!persona || !persona.id) {
            console.error("Error: El objeto persona es nulo o no tiene un ID válido", persona);
            setModalError("No se pudo cargar el historial. El cliente seleccionado no tiene un ID válido.");
            return;
        }
        try {
            const respuesta = await axios.get(`${urlBackend}/carteras/${persona.id}/historial`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("Respuesta GET /api/carteras/{id}/historial:", JSON.stringify(respuesta.data, null, 2));
            setHistorialAbonos(respuesta.data || []);
            setPersonaHistorial(persona);
            setCurrentPageHistorial(1);
            setModalHistorialAbierta(true);
        } catch (error) {
            setModalError("Error al cargar el historial de abonos: " + (error.response?.data?.message || error.message));
            console.error("Error al cargar historial:", error);
        }
    };

    // Función para cerrar la modal de historial
    const cerrarModalHistorial = () => {
        setModalHistorialAbierta(false);
        setHistorialAbonos([]);
        setPersonaHistorial(null);
        setCurrentPageHistorial(1);
        setFechaInicio("");
        setFechaFin("");
    };

    // Función para limpiar filtros de fecha
    const limpiarFechas = () => {
        setFechaInicio("");
        setFechaFin("");
        setCurrentPageHistorial(1);
    };

    // Abre la modal de confirmación para desactivar un cliente
    const abrirModalDesactivacion = (persona) => {
        const creditoAFavor = creditosPorCliente[persona.id]?.creditoAFavor || 0;
        if (persona.cartera === "Activa" || creditoAFavor > 0) {
            setModalAdvertenciaDesactivacion(true);
            return;
        }
        setPersonaDesactivar(persona);
        setConfirmarDesactivacion(true);
    };

    // Cierra la modal de confirmación de desactivación
    const cerrarModalConfirmacion = async (aceptar) => {
        if (aceptar && personaDesactivar) {
            try {
                const response = await axios.put(`${urlBackend}/clientes/${personaDesactivar.id}/desactivar`, {}, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(`Respuesta PUT /api/clientes/${personaDesactivar.id}/desactivar:`, response.data);
                setRegistros(registros.filter((r) => r.id !== personaDesactivar.id));
            } catch (error) {
                const errorMessage = error.response?.status === 400
                    ? error.response.data.mensaje || "No se puede desactivar el cliente."
                    : error.response?.data?.mensaje || "Error al desactivar el cliente.";
                setModalError(errorMessage);
                console.error("Error al desactivar el cliente:", error);
            }
        }
        setConfirmarDesactivacion(false);
        setPersonaDesactivar(null);
    };

    // Abre la modal de cartera de un cliente
    const abrirModalcartera = (persona) => {
        setPersonaCartera(persona);
        setModalCartera(true);
        setFacturaSeleccionadaParaAbono(null);
        setCantidadAbonar("");
        setModalError(null);
    };

    // Cierra la modal de cartera
    const cerrarModalcartera = () => {
        setModalCartera(false);
        setPersonaCartera(null);
        setCantidadAbonar("");
        setFacturaSeleccionadaParaAbono(null);
        setModalError(null);
    };

    // Muestra la modal de clientes con carteras activas
    const mostrarModalCarteras = async () => {
        try {
            console.log("Iniciando mostrarModalCarteras...");
            const respuesta = await axios.get(`${urlBackend}/carteras?estado=true`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("Respuesta cruda GET /api/carteras?estado=true:", {
                status: respuesta.status,
                headers: respuesta.headers,
                data: JSON.stringify(respuesta.data, null, 2)
            });

            const carteras = Array.isArray(respuesta.data) ? respuesta.data : [];
            setRespuestaCarteras(carteras);
            console.log("Carteras recibidas (post-array check):", carteras);

            const clientesCarteras = carteras
                .filter(cartera => {
                    const isEstadoActivo = cartera.estado === true || cartera.estado === "true" || cartera.estado === 1;
                    const hasIdCliente = cartera.idCliente !== null && cartera.idCliente !== undefined;
                    return hasIdCliente && isEstadoActivo;
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
                        cartera: cartera.estado ? "Activa" : "Desactivada",
                        mayorista: clienteData.mayorista,
                        tipo: clienteData.mayorista ? "Mayorista" : "Común"
                    };
                });

            console.log("Clientes con carteras activas mapeados:", clientesCarteras);
            setClientesCarteras(clientesCarteras);
            setModalCarterasAbierta(true);
        } catch (error) {
            console.error("Error al cargar las carteras activas:", {
                message: error.message,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : null
            });
            setClientesCarteras([]);
            setRespuestaCarteras([]);
            setModalError(error.response?.data?.message || `Error al cargar las carteras activas: ${error.message}`);
        }
    };

    // Cierra la modal de carteras activas
    const cerrarModalCarteras = () => {
        setModalCarterasAbierta(false);
        setClientesCarteras([]);
        setRespuestaCarteras([]);
        setModalError(null);
        setFiltroIdCartera("");
    };

    // Muestra la modal de clientes inactivos
    const mostrarModalInactivos = async () => {
        try {
            console.log("Iniciando mostrarModalInactivos...");
            const respuesta = await axios.get(`${urlBackend}/clientes/inactivos`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("Respuesta GET /api/clientes/inactivos:", JSON.stringify(respuesta.data, null, 2));
            const clientes = Array.isArray(respuesta.data) ? respuesta.data : [];
            setClientesInactivos(clientes);
            setFiltroIdCliente("");
            setModalInactivos(true);
        } catch (error) {
            setModalError(error.response?.data?.message || "Error al cargar los clientes inactivos.");
            console.error("Error al cargar los clientes inactivos:", error);
        }
    };

    // Cierra la modal de clientes inactivos
    const cerrarModalInactivos = () => {
        setModalInactivos(false);
        setClientesInactivos([]);
        setFiltroIdCliente("");
        setModalError(null);
    };

    // Filtra los clientes inactivos por ID
    const filtrarClientesInactivos = (clientes, filtro) => {
        if (!filtro) return clientes;
        return clientes.filter(cliente =>
            cliente.idCliente.toString().includes(filtro)
        );
    };

    // Filtra los clientes con cartera activa por ID
    const filtrarClientesCarteras = (clientes, filtro) => {
        if (!filtro) return clientes;
        return clientes.filter(cliente =>
            cliente.id.toString().includes(filtro)
        );
    };

    // Abre la modal de confirmación para reactivar un cliente
    const abrirModalReactivacion = (cliente, porId = true) => {
        setClienteReactivar(cliente);
        setReactivacionPorId(porId);
        setModalConfirmarReactivacion(true);
    };

    // Cierra la modal de confirmación de reactivacion
    const cerrarModalConfirmacionReactivacion = async (aceptar) => {
        if (aceptar && clienteReactivar) {
            try {
                const response = await axios.put(`${urlBackend}/clientes/${clienteReactivar.idCliente}/activar`, {}, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(`Respuesta PUT /api/clientes/${clienteReactivar.idCliente}/activar:`, response.data);
                let carteraData = { estado: false, deudas: 0, facturas: [], abono: 0 };
                try {
                    const respuestaCartera = await axios.get(`${urlBackend}/carteras/${clienteReactivar.idCliente}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    console.log(`Respuesta GET /api/carteras/${clienteReactivar.idCliente}:`, respuestaCartera.data);
                    carteraData = respuestaCartera.data;
                } catch (error) {
                    console.error(`No se encontró cartera para cliente ${clienteReactivar.idCliente}:`, error.response?.status);
                }
                setRegistros([...registros, {
                    id: clienteReactivar.idCliente,
                    nombre: clienteReactivar.nombre,
                    apellido: clienteReactivar.apellido,
                    correo: clienteReactivar.email,
                    telefono: clienteReactivar.telefono.toString(),
                    direccion: clienteReactivar.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada",
                    mayorista: clienteReactivar.mayorista,
                    tipo: clienteReactivar.mayorista ? "Mayorista" : "Común"
                }]);
                setClientesInactivos(clientesInactivos.filter(c => c.idCliente !== clienteReactivar.idCliente));
                if (!personaSelect && modalAbierta) {
                    cerrarModalPrincipal();
                }
                setModalConfirmarReactivacion(false);
                setClienteReactivar(null);
                setReactivacionPorId(false);
            } catch (error) {
                setModalError(error.response?.data?.mensaje || "Error al reactivar el cliente.");
                console.error("Error al reactivar el cliente:", error);
                setModalConfirmarReactivacion(false);
                setClienteReactivar(null);
                setReactivacionPorId(false);
            }
        } else {
            setModalConfirmarReactivacion(false);
            setClienteReactivar(null);
            setReactivacionPorId(false);
        }
    };

    // Cierra la modal de advertencia de desactivación
    const cerrarModalAdvertencia = () => {
        setModalAdvertenciaDesactivacion(false);
        setPersonaDesactivar(null);
    };

    // Función para manejar los cambios en el formulario
    const manejarCambioFormulario = (evento) => {
        const { name, value } = evento.target;
        let nuevoValor = value;

        if (name === "idCliente" || name === "telefono") {
            nuevoValor = value.replace(/[^0-9]/g, "");
            if (name === "idCliente" && nuevoValor.length > 10) {
                nuevoValor = nuevoValor.slice(0, 10);
            }
            if (name === "telefono" && nuevoValor.length > 10) {
                nuevoValor = nuevoValor.slice(0, 10);
            }
        } else if (name === "nombre" || name === "apellido") {
            nuevoValor = value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, "");
        } else if (name === "direccion") {
            nuevoValor = value;
        } else if (name === "correo") {
            nuevoValor = value;
        }

        setFormData((prev) => ({ ...prev, [name]: nuevoValor }));
    };

    // Guarda o actualiza un cliente
    const guardarCliente = async (e) => {
        e.preventDefault();

        const idCliente = parseInt(formData.idCliente) || personaSelect?.id;
        const telefono = parseInt(formData.telefono) || personaSelect?.telefono;
        const email = formData.correo.trim();

        if (!idCliente || isNaN(idCliente)) {
            setModalError("El ID del cliente debe ser un número válido.");
            return;
        }
        if (!telefono || isNaN(telefono)) {
            setModalError("El teléfono debe ser un número válido.");
            return;
        }

        if (!personaSelect && (!/^\d{6,10}$/.test(formData.idCliente) || formData.idCliente.length < 6)) {
            setModalError("El ID debe tener entre 6 y 10 dígitos y solo números.");
            return;
        }

        if (!/^\d{10}$/.test(formData.telefono)) {
            setModalError("El teléfono debe tener exactamente 10 dígitos y solo números.");
            return;
        }

        if (formData.nombre.length < 3 || !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(formData.nombre)) {
            setModalError("El nombre debe tener al menos 3 caracteres y solo letras (incluyendo tildes y ñ).");
            return;
        }

        if (formData.apellido.length < 3 || !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(formData.apellido)) {
            setModalError("El apellido debe tener al menos 3 caracteres y solo letras (incluyendo tildes y ñ).");
            return;
        }

        if (formData.direccion.length < 3 || /^\d+$/.test(formData.direccion)) {
            setModalError("La dirección debe tener al menos 3 caracteres y no puede ser solo números.");
            return;
        }

        if (!personaSelect) {
            const idExistente = registros.find((r) => r.id === idCliente);
            if (idExistente) {
                setModalError("El ID ya está en uso por otro cliente.");
                return;
            }
        }

        const clienteData = {
            idCliente,
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            email,
            telefono,
            direccion: formData.direccion.trim(),
            mayorista: formData.mayorista
        };

        console.log("Datos enviados en guardarCliente:", clienteData);

        try {
            if (personaSelect) {
                const respuesta = await axios.put(`${urlBackend}/clientes/${personaSelect.id}`, clienteData, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (creditoActivo !== (personaSelect.cartera === "Activa")) {
                    await axios.put(`${urlBackend}/carteras/${personaSelect.id}/estado`, { estado: creditoActivo }, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
                let carteraData = { estado: false, deudas: 0, facturas: [], abono: 0 };
                if (creditoActivo) {
                    const respuestaCartera = await axios.get(`${urlBackend}/carteras/${personaSelect.id}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    carteraData = respuestaCartera.data;
                    if (carteraData.facturas && carteraData.facturas.length > 0) {
                        const nuevaFactura = carteraData.facturas[carteraData.facturas.length - 1];
                        const creditoAFavor = carteraData.creditoAFavor || 0;
                        if (creditoAFavor > 0 && nuevaFactura.saldoPendiente > creditoAFavor) {
                            nuevaFactura.saldoPendiente -= creditoAFavor;
                            await axios.put(`${urlBackend}/carteras/facturas/${nuevaFactura.idFactura}`, {
                                saldoPendiente: nuevaFactura.saldoPendiente
                            }, {
                                headers: {
                                    'Accept': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            await axios.put(`${urlBackend}/carteras/${personaSelect.id}`, {
                                creditoAFavor: 0
                            }, {
                                headers: {
                                    'Accept': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                        }
                    }
                }
                setRegistros(registros.map(r => r.id === personaSelect.id ? {
                    id: respuesta.data.idCliente,
                    nombre: respuesta.data.nombre,
                    apellido: respuesta.data.apellido,
                    correo: respuesta.data.email,
                    telefono: respuesta.data.telefono.toString(),
                    direccion: respuesta.data.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada",
                    mayorista: respuesta.data.mayorista,
                    tipo: respuesta.data.mayorista ? "Mayorista" : "Común"
                } : r));
                setCreditosPorCliente(prev => ({
                    ...prev,
                    [personaSelect.id]: {
                        facturas: carteraData.facturas.filter(f => f.saldoPendiente > 0),
                        saldoPendiente: carteraData.deudas || 0,
                        abono: carteraData.abono || 0,
                        creditoAFavor: carteraData.creditoAFavor || 0
                    }
                }));
            } else {
                const respuesta = await axios.post(`${urlBackend}/clientes`, clienteData, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (respuesta.data.existe) {
                    if (respuesta.data.inactivo && respuesta.data.cliente?.idCliente === idCliente) {
                        abrirModalReactivacion(respuesta.data.cliente);
                        return;
                    } else {
                        setModalError(respuesta.data.mensaje || "El correo ya está en uso por un cliente.");
                        return;
                    }
                }
                if (creditoActivo) {
                    await axios.put(`${urlBackend}/carteras/${respuesta.data.cliente.idCliente}/estado`, { estado: true }, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
                let carteraData = { estado: false, deudas: 0, facturas: [], abono: 0 };
                if (creditoActivo) {
                    const respuestaCartera = await axios.get(`${urlBackend}/carteras/${respuesta.data.cliente.idCliente}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    carteraData = respuestaCartera.data;
                    if (carteraData.creditoAFavor > 0) {
                        const nuevaFacturaData = {
                            total: 10000,
                            saldoPendiente: 10000 - carteraData.creditoAFavor > 0 ? 10000 - carteraData.creditoAFavor : 0,
                            fecha: new Date().toISOString().split('T')[0]
                        };
                        await axios.post(`${urlBackend}/carteras/${respuesta.data.cliente.idCliente}/facturas`, nuevaFacturaData, {
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        await axios.put(`${urlBackend}/carteras/${respuesta.data.cliente.idCliente}`, {
                            creditoAFavor: 0
                        }, {
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        await recargarCartera(respuesta.data.cliente.idCliente);
                    }
                }
                setRegistros([...registros, {
                    id: respuesta.data.cliente.idCliente,
                    nombre: respuesta.data.cliente.nombre,
                    apellido: respuesta.data.cliente.apellido,
                    correo: respuesta.data.cliente.email,
                    telefono: respuesta.data.cliente.telefono.toString(),
                    direccion: respuesta.data.cliente.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada",
                    mayorista: respuesta.data.cliente.mayorista,
                    tipo: respuesta.data.cliente.mayorista ? "Mayorista" : "Común"
                }]);
                setCreditosPorCliente(prev => ({
                    ...prev,
                    [respuesta.data.cliente.idCliente]: {
                        facturas: carteraData.facturas.filter(f => f.saldoPendiente > 0),
                        saldoPendiente: carteraData.deudas || 0,
                        abono: carteraData.abono || 0,
                        creditoAFavor: carteraData.creditoAFavor || 0
                    }
                }));
            }
            cerrarModalPrincipal();
        } catch (error) {
            let errorMessage = "Error al guardar el cliente.";
            if (error.response?.status === 400) {
                if (error.response.data?.mensaje) {
                    errorMessage = error.response.data.mensaje;
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data?.errors?.length > 0) {
                    errorMessage = error.response.data.errors[0].msg || "El correo ya está en uso por un cliente.";
                } else {
                    errorMessage = "El correo ya está en uso por un cliente.";
                }
            }
            setModalError(errorMessage);
            console.error("Error en guardarCliente:", error, error.response?.data);
        }
    };

    // Función para abrir el modal de mensajes de validación
    const abrirModalMensaje = (tipo, mensaje) => {
        setModalMensaje({ abierto: true, tipo, mensaje });
    };

    // Función para cerrar el modal de mensajes de validación
    const cerrarModalMensaje = () => {
        setModalMensaje({ abierto: false, tipo: "", mensaje: "" });
    };

    // Procesa un abono para una factura
    const procesarAbono = async () => {
        const cantidad = parseFloat(cantidadAbonar) || 0;
        const creditoAFavor = creditosPorCliente[personaCartera?.id]?.creditoAFavor || 0;
        const saldoTotal = saldoPendiente + creditoAFavor;

        if (cantidad <= 0 || !facturaSeleccionadaParaAbono) {
            setModalAdvertenciaAbono(true);
            return;
        }

        try {
            const respuesta = await axios.post(`${urlBackend}/carteras/${personaCartera.id}/abonos`, {
                cantidad,
                fecha: new Date().toISOString().split('T')[0],
                idFactura: facturaSeleccionadaParaAbono.idFactura
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const facturas = Array.isArray(respuesta.data.facturas)
                ? respuesta.data.facturas.filter(f => f.saldoPendiente > 0)
                : [];
            setCreditosPorCliente(prev => ({
                ...prev,
                [personaCartera.id]: {
                    facturas,
                    saldoPendiente: respuesta.data.deudas || 0,
                    abono: respuesta.data.abono || 0,
                    creditoAFavor: respuesta.data.creditoAFavor || 0
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

    // Función para recargar la cartera después de una nueva venta
    const recargarCartera = async (clienteId) => {
        try {
            const respuesta = await axios.get(`${urlBackend}/carteras/${clienteId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const facturas = Array.isArray(respuesta.data.facturas)
                ? respuesta.data.facturas.filter(f => f.saldoPendiente > 0)
                : [];
            setCreditosPorCliente(prev => ({
                ...prev,
                [clienteId]: {
                    facturas,
                    saldoPendiente: respuesta.data.deudas || 0,
                    abono: respuesta.data.abono || 0,
                    creditoAFavor: respuesta.data.creditoAFavor || 0
                }
            }));
            setSaldoPendiente(respuesta.data.deudas || 0);
        } catch (error) {
            setModalError(error.response?.data?.message || "Error al recargar la cartera.");
            console.error("Error al recargar cartera:", error);
        }
    };

    // Abre la modal de detalles de una factura
    const abrirModalDetalles = async (facturaRow) => {
        try {
            console.log("facturaRow recibida en abrirModalDetalles:", facturaRow);

            const idFactura = facturaRow.idFactura;

            if (!idFactura) {
                throw new Error("ID de factura no válido.");
            }

            const respuesta = await axios.get(`${urlBackend}/carteras/facturas/${idFactura}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Respuesta completa del endpoint /carteras/facturas/", idFactura, ":", JSON.stringify(respuesta.data, null, 2));

            const facturaCompleta = respuesta.data;

            const factura = {
                ...facturaCompleta,
                cajero: facturaCompleta.cajero || null,
                cajeroNombre: facturaCompleta.cajeroNombre || 'Desconocido',
                cajeroApellido: facturaCompleta.cajeroApellido || '',
                productos: Array.isArray(facturaCompleta.productos) ? facturaCompleta.productos : []
            };

            console.log("Factura mapeada para detalles:", factura);
            setFacturaSeleccionada(factura);
            setModalDetallesAbierta(true);
        } catch (error) {
            setModalError(error.message || "Error al cargar los detalles de la factura.");
            console.error("Error al cargar los detalles de la factura:", error);
        }
    };

    // Cierra la modal de detalles de factura
    const cerrarModalDetalles = () => {
        setModalDetallesAbierta(false);
        setFacturaSeleccionada(null);
    };

    // Función para filtrar historial por fechas
    const filtrarHistorialPorFechas = (historial, fechaInicio, fechaFin) => {
        if (!fechaInicio && !fechaFin) return historial;
        if (fechaInicio && isNaN(new Date(fechaInicio))) return historial;
        if (fechaFin && isNaN(new Date(fechaFin))) return historial;
        return historial.filter(abono => {
            const fechaAbono = new Date(abono.fechaAbono).toISOString().split('T')[0];
            const cumpleFechaInicio = !fechaInicio || fechaAbono >= fechaInicio;
            const cumpleFechaFin = !fechaFin || fechaAbono <= fechaFin;
            return cumpleFechaInicio && cumpleFechaFin;
        });
    };

    // Función para renderizar botones de paginación con elipsis
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

    // Renderiza la interfaz principal
    return (
        <main className='main-home inventario'>
            <div className="titulo">
                <h1>Clientes</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <BotonAgregar onClick={abrirModalAgregar} />
                    <button className="btn-cartera-activa" onClick={mostrarModalCarteras}>
                        <i className="bi bi-wallet2"></i> Personas con Cartera
                    </button>
                    <button className="btn-clientes-inactivos" onClick={mostrarModalInactivos}>
                        <i className="bi bi-person-x"></i> Clientes Inactivos
                    </button>
                </div>
            </div>

            <CreadorTablaClientes
                cabeceros={cabeceros}
                registros={registros}
                onEditar={abrirModalEditar}
                onEliminar={abrirModalDesactivacion}
                onHistorial={abrirModalHistorial}
            />
            {registros.length === 0 && !modalError && (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    No hay clientes activos en el portafolio de momento.
                </p>
            )}

            {modalCarterasAbierta && (
                <Modal isOpen={modalCarterasAbierta} onClose={cerrarModalCarteras}>
                    <div className="encabezado-modal">
                        <h2>Personas con Cartera Activa</h2>
                    </div>
                    <div className="grupo-formulario">
                        <label>Buscar por ID:</label>
                        <input
                            type="number"
                            value={filtroIdCartera}
                            onChange={(e) => setFiltroIdCartera(e.target.value)}
                            className="form-control mb-2"
                            placeholder="Ingrese ID del cliente"
                        />
                    </div>
                    <div>
                        {filtrarClientesCarteras(clientesCarteras, filtroIdCartera).length === 0 ? (
                            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                                {filtroIdCartera ? "No existe un cliente con ese ID en el sistema." : "No hay clientes con cartera activa."}
                            </p>
                        ) : (
                            filtrarClientesCarteras(clientesCarteras, filtroIdCartera).map((cliente, index) => (
                                <div key={index} className="cartera-row" style={{ marginTop: '10px' }}>
                                    <BotonCartera onClick={() => abrirModalcartera(cliente)} />
                                    <span>
                                        {cliente.id} - {cliente.nombre.split(' ')[0]} {cliente.apellido.split(' ')[0]}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalCarteras} />
                    </div>
                </Modal>
            )}

            {modalInactivos && (
                <Modal isOpen={modalInactivos} onClose={cerrarModalInactivos}>
                    <div className="encabezado-modal">
                        <h2>Clientes Inactivos</h2>
                    </div>
                    <div className="grupo-formulario">
                        <label>Buscar por ID:</label>
                        <input
                            type="number"
                            value={filtroIdCliente}
                            onChange={(e) => setFiltroIdCliente(e.target.value)}
                            className="form-control mb-2"
                            placeholder="Ingrese ID del cliente"
                        />
                    </div>
                    <div>
                        {filtrarClientesInactivos(clientesInactivos, filtroIdCliente).length === 0 ? (
                            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                                {filtroIdCliente ? "No existe un cliente con ese ID en el sistema." : "No hay clientes inactivos."}
                            </p>
                        ) : (
                            filtrarClientesInactivos(clientesInactivos, filtroIdCliente).map((cliente) => (
                                <div key={cliente.idCliente} className="cartera-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '10px' }}>
                                        {cliente.idCliente} - {cliente.nombre} {cliente.apellido}
                                    </span>
                                    <button className="btn btn-primary" onClick={() => abrirModalReactivacion(cliente, false)}>
                                        Activar
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalInactivos} />
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
                                    type="text"
                                    name="idCliente"
                                    value={formData.idCliente}
                                    onChange={manejarCambioFormulario}
                                    className="form-control mb-2"
                                    required
                                />
                            </div>
                        )}
                        <div className="grupo-formulario">
                            <label>Nombre:</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={manejarCambioFormulario}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Apellido:</label>
                            <input
                                type="text"
                                name="apellido"
                                value={formData.apellido}
                                onChange={manejarCambioFormulario}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Correo:</label>
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={manejarCambioFormulario}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Teléfono:</label>
                            <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={manejarCambioFormulario}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Dirección:</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={manejarCambioFormulario}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="radio"
                                    name="tipoCliente"
                                    value="minorista"
                                    checked={!formData.mayorista}
                                    onChange={() => setFormData(prev => ({ ...prev, mayorista: false }))}
                                />
                                Minorista
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="radio"
                                    name="tipoCliente"
                                    value="mayorista"
                                    checked={formData.mayorista}
                                    onChange={() => setFormData(prev => ({ ...prev, mayorista: true }))}
                                />
                                Mayorista
                            </label>
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
                                    <>
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
                                    </>
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

            {confirmarDesactivacion && (
                <Modal isOpen={confirmarDesactivacion} onClose={() => cerrarModalConfirmacion(false)}>
                    <div className="encabezado-modal">
                        <h2>Confirmar Desactivación</h2>
                    </div>
                    <p>¿Desea desactivar al cliente {personaDesactivar?.nombre} {personaDesactivar?.apellido}?</p>
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
                            {saldoPendiente > 0 && (
                                <p>Si el cliente paga más de lo que debe, el monto restante se le contará como crédito a favor.</p>
                            )}
                            {creditosPorCliente[personaCartera?.id]?.creditoAFavor > 0 && (
                                <p>Crédito a favor actual: ${creditosPorCliente[personaCartera?.id]?.creditoAFavor.toLocaleString('es-CO')} COP</p>
                            )}
                            <label className="cartera-label">Saldo pendiente total</label>
                            <input
                                type="text"
                                disabled
                                className="cartera-input"
                                value={`$${Math.max(0, saldoPendiente).toLocaleString('es-CO')}`}
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
                                    const creditoAFavor = creditosPorCliente[personaCartera?.id]?.creditoAFavor || 0;
                                    setBotonDesactivado(
                                        parseFloat(cantidadAbonar) <= 0 || !factura ||
                                        (parseFloat(cantidadAbonar) > (saldoPendiente + creditoAFavor))
                                    );
                                }}
                                size={
                                    (creditosPorCliente[personaCartera.id]?.facturas?.length || 0) < 5
                                        ? creditosPorCliente[personaCartera.id]?.facturas?.length
                                        : 5
                                }
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
                                    const value = e.target.value;
                                    if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                                        setCantidadAbonar(value);
                                        const parsedValue = parseFloat(value) || 0;
                                        const creditoAFavor = creditosPorCliente[personaCartera?.id]?.creditoAFavor || 0;
                                        setBotonDesactivado(
                                            parsedValue <= 0 || !facturaSeleccionadaParaAbono ||
                                            (parsedValue > (saldoPendiente + creditoAFavor))
                                        );
                                    }
                                }}
                                min="2000"
                                step="50"
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

                    <div className="pie-modal" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div></div>
                        <div>
                            <BotonCancelar type="button" onClick={cerrarModalcartera} />
                            <BotonGuardar type="button" onClick={procesarAbono} disabled={botonDesactivado} />
                        </div>
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
                            <p><strong>Factura #{facturaSeleccionada.idFactura}</strong></p>
                            <p>Fecha: {new Date(facturaSeleccionada.fecha).toLocaleDateString('es-CO')}</p>
                            <p>Cliente: {personaCartera?.nombre || personaSelect?.nombre} {personaCartera?.apellido || personaSelect?.apellido}</p>
                            <p>Usuario: {`${facturaSeleccionada.cajeroNombre || 'Desconocido'} ${facturaSeleccionada.cajeroApellido || ''}`.trim() || 'Desconocido'}</p>
                            <p>Estado: {facturaSeleccionada.estado}</p>
                            <hr />
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Cant.</th>
                                        <th>Precio Unitario</th>
                                        <th>IVA</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facturaSeleccionada.productos && facturaSeleccionada.productos.length > 0 ? (
                                        facturaSeleccionada.productos.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.nombre || 'Desconocido'}</td>
                                                <td>{item.cantidad || 1}</td>
                                                <td>
                                                    <NumericFormat
                                                        value={item.precio || 0}
                                                        displayType="text"
                                                        thousandSeparator="."
                                                        decimalSeparator=","
                                                        prefix="$"
                                                    />
                                                </td>
                                                <td>{item.iva ? 'Sí' : 'No'}</td>
                                                <td>
                                                    <NumericFormat
                                                        value={(item.cantidad || 1) * (item.iva ? (item.precio || 0) * 1.19 : (item.precio || 0))}
                                                        displayType="text"
                                                        thousandSeparator="."
                                                        decimalSeparator=","
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
                                <strong>Subtotal (sin IVA): </strong>
                                <NumericFormat
                                    value={facturaSeleccionada.subtotal || 0}
                                    displayType="text"
                                    thousandSeparator
                                    prefix="$"
                                />
                            </p>
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

            {modalAdvertenciaDesactivacion && (
                <Modal isOpen={modalAdvertenciaDesactivacion} onClose={cerrarModalAdvertencia}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>Este cliente no se puede desactivar ya que tiene el crédito activado.</p>
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
                    <p>{modalError || "El abono no puede ser menor o igual a 0 y debe seleccionar una factura válida."}</p>
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

            {modalMensaje.abierto && (
                <Modal isOpen={modalMensaje.abierto} onClose={cerrarModalMensaje}>
                    <div className="encabezado-modal">
                        <h2>{modalMensaje.tipo.charAt(0).toUpperCase() + modalMensaje.tipo.slice(1)}</h2>
                    </div>
                    <p>{modalMensaje.mensaje}</p>
                    <div className="pie-modal">
                        <BotonAceptar type="button" onClick={cerrarModalMensaje} />
                    </div>
                </Modal>
            )}

            {modalConfirmarReactivacion && (
                <Modal
                    isOpen={modalConfirmarReactivacion}
                    onClose={() => cerrarModalConfirmacionReactivacion(false)}
                    style={{ zIndex: 1500, position: 'fixed' }}
                >
                    <div className="encabezado-modal">
                        <h2>Confirmar Reactivación</h2>
                    </div>
                    <p>
                        {reactivacionPorId
                            ? `Estás agregando un cliente con un ID ya en el sistema, ese ID pertenece al cliente ${clienteReactivar?.nombre} ${clienteReactivar?.apellido}, ¿desea reactivarlo?`
                            : `Deseas activar al cliente ${clienteReactivar?.nombre} ${clienteReactivar?.apellido}?`}
                    </p>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={() => cerrarModalConfirmacionReactivacion(false)} />
                        <BotonAceptar onClick={() => cerrarModalConfirmacionReactivacion(true)} />
                    </div>
                </Modal>
            )}

            {modalHistorialAbierta && (
                <Modal isOpen={modalHistorialAbierta} onClose={cerrarModalHistorial} style={{ zIndex: 1200 }}>
                    <div className="encabezado-modal">
                        <h2>Historial de Abonos</h2>
                        <h3 style={{ textAlign: 'center', color: '#666' }}>
                            {personaHistorial?.nombre} {personaHistorial?.apellido}
                        </h3>
                    </div>

                    <div className="historial-container">
                        <div className="grupo-formulario" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <div>
                                <label>Fecha Inicio:</label>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div>
                                <label>Fecha Fin:</label>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={limpiarFechas}
                                style={{ alignSelf: 'flex-end', marginBottom: '0.5rem' }}
                            >
                                Limpiar Fechas
                            </button>
                        </div>

                        {(() => {
                            const filteredHistorial = filtrarHistorialPorFechas(historialAbonos, fechaInicio, fechaFin);
                            const pageSize = 8;
                            const totalItems = filteredHistorial.length;
                            const totalPages = Math.ceil(totalItems / pageSize);
                            const startIndex = (currentPageHistorial - 1) * pageSize;
                            const endIndex = Math.min(startIndex + pageSize, totalItems);
                            const currentItems = filteredHistorial.slice(startIndex, endIndex);

                            return (
                                <>
                                    {currentItems.length === 0 ? (
                                        <p style={{ textAlign: 'center', marginTop: '20px' }}>
                                            No hay historial de abonos para este cliente.
                                        </p>
                                    ) : (
                                        <>
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Factura</th>
                                                        <th>Monto Abono</th>
                                                        <th>Saldo Anterior</th>
                                                        <th>Saldo Nuevo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentItems.map((abono, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                {new Date(abono.fechaAbono).toLocaleDateString('es-CO', {
                                                                    year: 'numeric',
                                                                    month: '2-digit',
                                                                    day: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </td>
                                                            <td>#{abono.factura.idFactura}</td>
                                                            <td style={{ color: 'green', fontWeight: 'bold' }}>
                                                                ${abono.montoAbono.toLocaleString('es-CO')}
                                                            </td>
                                                            <td>${abono.saldoAnterior.toLocaleString('es-CO')}</td>
                                                            <td style={{ color: abono.saldoNuevo === 0 ? 'green' : 'inherit' }}>
                                                                ${abono.saldoNuevo.toLocaleString('es-CO')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <nav>
                                                <ul className="pagination justify-content-center">
                                                    <li className={`page-item ${currentPageHistorial === 1 ? "disabled" : ""}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setCurrentPageHistorial(prev => Math.max(1, prev - 1))}
                                                        >
                                                            Anterior
                                                        </button>
                                                    </li>
                                                    {renderPageButtons(totalPages, currentPageHistorial, setCurrentPageHistorial)}
                                                    <li className={`page-item ${currentPageHistorial === totalPages ? "disabled" : ""}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setCurrentPageHistorial(prev => Math.min(totalPages, prev + 1))}
                                                        >
                                                            Siguiente
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    <div className="pie-modal">
                        <BotonAceptar type="button" onClick={cerrarModalHistorial} />
                    </div>
                </Modal>
            )}
        </main>
    )
};

export default Portafolio;