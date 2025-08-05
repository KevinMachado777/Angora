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
    const cabeceros = ["Id", "Nombre", "Apellido", "Correo", "Teléfono", "Dirección", "Cartera"];

    // Estado para almacenar los registros de clientes
    const [registros, setRegistros] = useState([]);
    // Estado para almacenar los créditos (facturas y saldos) por cliente
    const [creditosPorCliente, setCreditosPorCliente] = useState({});
    // Estado para controlar si la modal principal está abierta
    const [modalAbierta, setModalAbierta] = useState(false);
    // Estado para almacenar el cliente seleccionado
    const [personaSelect, setPersonaSelect] = useState(null);
    // Estado para controlar la modal de confirmación de desactivación
    const [confirmarDesactivacion, setConfirmarDesactivacion] = useState(false);
    // Estado para almacenar el cliente a desactivar
    const [personaDesactivar, setPersonaDesactivar] = useState(null);
    // Estado para controlar si la modal de cartera está abierta
    const [modalCartera, setModalCartera] = useState(false);
    // Estado para almacenar el cliente cuya cartera se muestra
    const [personaCartera, setPersonaCartera] = useState(null);
    // Estado para controlar si la modal de carteras activas está abierta
    const [modalCarterasAbierta, setModalCarterasAbierta] = useState(false);
    // Estado para almacenar los clientes con carteras activas
    const [clientesCarteras, setClientesCarteras] = useState([]);
    // Estado para almacenar la respuesta cruda de las carteras
    const [respuestaCarteras, setRespuestaCarteras] = useState([]);
    // Estado para controlar si el crédito está activo
    const [creditoActivo, setCreditoActivo] = useState(false);
    // Estado para controlar la modal de advertencia de desactivación
    const [modalAdvertenciaDesactivacion, setModalAdvertenciaDesactivacion] = useState(false);
    // Estado para almacenar el saldo pendiente del cliente
    const [saldoPendiente, setSaldoPendiente] = useState(0);
    // Estado para almacenar la cantidad a abonar
    const [cantidadAbonar, setCantidadAbonar] = useState("");
    // Estado para almacenar la factura seleccionada para el abono
    const [facturaSeleccionadaParaAbono, setFacturaSeleccionadaParaAbono] = useState(null);
    // Estado para controlar la modal de advertencia de abono
    const [modalAdvertenciaAbono, setModalAdvertenciaAbono] = useState(false);
    // Estado para controlar si el botón de guardar abono está desactivado
    const [botonDesactivado, setBotonDesactivado] = useState(true);
    // Estado para controlar si la modal de detalles de factura está abierta
    const [modalDetallesAbierta, setModalDetallesAbierta] = useState(false);
    // Estado para almacenar la factura seleccionada para ver detalles
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    // Estado para manejar mensajes de error en modales
    const [modalError, setModalError] = useState(null);
    // Estado para controlar si la modal de clientes inactivos está abierta
    const [modalInactivos, setModalInactivos] = useState(false);
    // Estado para almacenar los clientes inactivos
    const [clientesInactivos, setClientesInactivos] = useState([]);
    // Estado para filtrar clientes inactivos por ID
    const [filtroIdCliente, setFiltroIdCliente] = useState("");
    // Estado para filtrar clientes con cartera activa por ID
    const [filtroIdCartera, setFiltroIdCartera] = useState("");
    // Estado para controlar la modal de confirmación de reactivación
    const [modalConfirmarReactivacion, setModalConfirmarReactivacion] = useState(false);
    // Estado para almacenar el cliente a reactivar
    const [clienteReactivar, setClienteReactivar] = useState(null);
    // Estado para indicar si la reactivación es por ID
    const [reactivacionPorId, setReactivacionPorId] = useState(false);

    const token = localStorage.getItem("accessToken");

    // Carga los clientes activos y sus carteras al montar el componente
    useEffect(() => {
        const cargarClientes = async () => {
            try {
                // Obtiene los clientes activos desde el backend
                const respuestaClientes = await axios.get(`${urlBackend}/clientes`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log("Respuesta GET /api/clientes:", JSON.stringify(respuestaClientes.data, null, 2));
                // Mapea los clientes y sus carteras
                const clientes = await Promise.all(
                    (Array.isArray(respuestaClientes.data) ? respuestaClientes.data : []).map(async (cliente) => {
                        try {
                            // Obtiene la cartera del cliente
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
                                cartera: respuestaCartera.data.estado ? "Activa" : "Desactivada"
                            };
                        } catch (error) {
                            // Maneja el caso cuando no hay cartera
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
                // Actualiza los registros con los clientes
                setRegistros(clientes);
            } catch (error) {
                // Muestra un error si falla la carga de clientes
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
                    // Obtiene la cartera del cliente
                    const respuesta = await axios.get(`${urlBackend}/carteras/${clienteId}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    console.log(`Respuesta GET /api/carteras/${clienteId}:`, JSON.stringify(respuesta.data, null, 2));
                    // Filtra las facturas con saldo pendiente
                    const facturas = Array.isArray(respuesta.data.facturas)
                        ? respuesta.data.facturas.filter(f => f.saldoPendiente > 0)
                        : [];
                    // Actualiza los créditos del cliente
                    setCreditosPorCliente(prev => ({
                        ...prev,
                        [clienteId]: {
                            facturas,
                            saldoPendiente: respuesta.data.deudas || 0,
                            abono: respuesta.data.abono || 0
                        }
                    }));
                    // Actualiza el saldo pendiente
                    setSaldoPendiente(respuesta.data.deudas || 0);
                    // Actualiza el estado del crédito
                    setCreditoActivo(respuesta.data.estado || false);
                    // Valida el botón de abono
                    setBotonDesactivado(
                        parseFloat(cantidadAbonar) <= 0 || !facturaSeleccionadaParaAbono
                    );
                } catch (error) {
                    if (error.response?.status === 404) {
                        // Maneja el caso cuando no hay cartera
                        setCreditosPorCliente(prev => ({
                            ...prev,
                            [clienteId]: {
                                facturas: [],
                                saldoPendiente: 0,
                                abono: 0
                            }
                        }));
                        setSaldoPendiente(0);
                        setCreditoActivo(false);
                        setBotonDesactivado(true);
                    } else {
                        // Muestra un error si falla la carga de la cartera
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
            // Desactiva el botón de abono si no hay cliente seleccionado
            setBotonDesactivado(true);
        }
    }, [personaCartera, personaSelect, cantidadAbonar, facturaSeleccionadaParaAbono]);

    // Abre la modal para agregar un cliente nuevo
    const abrirModalAgregar = () => {
        setPersonaSelect(null);
        setModalAbierta(true);
        setCreditoActivo(false);
        setModalError(null);
    };

    // Abre la modal para editar un cliente existente
    const abrirModalEditar = (persona) => {
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

    // Abre la modal de confirmación para desactivar un cliente
    const abrirModalDesactivacion = (persona) => {
        if (persona.cartera === "Activa") {
            // Muestra advertencia si el cliente tiene cartera activa
            setPersonaDesactivar(persona);
            setModalAdvertenciaDesactivacion(true);
            return;
        }
        // Abre la modal de confirmación si no tiene cartera activa
        setPersonaDesactivar(persona);
        setConfirmarDesactivacion(true);
    };

    // Cierra la modal de confirmación de desactivación
    const cerrarModalConfirmacion = async (aceptar) => {
        if (aceptar && personaDesactivar) {
            try {
                // Envía la solicitud para desactivar el cliente
                const response = await axios.put(`${urlBackend}/clientes/${personaDesactivar.id}/desactivar`, {}, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(`Respuesta PUT /api/clientes/${personaDesactivar.id}/desactivar:`, response.data);
                // Actualiza los registros eliminando el cliente desactivado
                setRegistros(registros.filter((r) => r.id !== personaDesactivar.id));
            } catch (error) {
                // Maneja errores al desactivar el cliente
                const errorMessage = error.response?.status === 400
                    ? error.response.data.mensaje || "No se puede desactivar el cliente."
                    : error.response?.data?.mensaje || "Error al desactivar el cliente.";
                setModalError(errorMessage);
                console.error("Error al desactivar el cliente:", error);
            }
        }
        // Cierra la modal de confirmación
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
            // Obtiene las carteras activas desde el backend
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

            // Filtra y mapea las carteras activas
            const carteras = Array.isArray(respuesta.data) ? respuesta.data : [];
            setRespuestaCarteras(carteras);
            console.log("Carteras recibidas (post-array check):", carteras);

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
                    // Mapea los datos del cliente para la cartera
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
            // Actualiza los clientes con carteras activas
            setClientesCarteras(clientesCarteras);
            // Abre la modal de carteras activas
            setModalCarterasAbierta(true);
        } catch (error) {
            // Maneja errores al cargar las carteras activas
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
            // Obtiene los clientes inactivos desde el backend
            const respuesta = await axios.get(`${urlBackend}/clientes/inactivos`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("Respuesta GET /api/clientes/inactivos:", JSON.stringify(respuesta.data, null, 2));
            // Actualiza los clientes inactivos
            const clientes = Array.isArray(respuesta.data) ? respuesta.data : [];
            setClientesInactivos(clientes);
            setFiltroIdCliente("");
            // Abre la modal de clientes inactivos
            setModalInactivos(true);
        } catch (error) {
            // Maneja errores al cargar los clientes inactivos
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
                // Envía la solicitud para reactivar el cliente
                const response = await axios.put(`${urlBackend}/clientes/${clienteReactivar.idCliente}/activar`, {}, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(`Respuesta PUT /api/clientes/${clienteReactivar.idCliente}/activar:`, response.data);
                // Carga la cartera del cliente reactivado
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
                // Añade el cliente reactivado a los registros
                setRegistros([...registros, {
                    id: clienteReactivar.idCliente,
                    nombre: clienteReactivar.nombre,
                    apellido: clienteReactivar.apellido,
                    correo: clienteReactivar.email,
                    telefono: clienteReactivar.telefono.toString(),
                    direccion: clienteReactivar.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada"
                }]);
                // Actualiza la lista de clientes inactivos
                setClientesInactivos(clientesInactivos.filter(c => c.idCliente !== clienteReactivar.idCliente));
                // Cierra la modal principal si no se está editando
                if (!personaSelect && modalAbierta) {
                    cerrarModalPrincipal();
                }
                setModalConfirmarReactivacion(false);
                setClienteReactivar(null);
                setReactivacionPorId(false);
            } catch (error) {
                // Maneja errores al reactivar el cliente
                setModalError(error.response?.data?.mensaje || "Error al reactivar el cliente.");
                console.error("Error al reactivar el cliente:", error);
                setModalConfirmarReactivacion(false);
                setClienteReactivar(null);
                setReactivacionPorId(false);
            }
        } else {
            // Cierra la modal sin reactivar
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

    // Guarda o actualiza un cliente
    const guardarCliente = async (e) => {
        e.preventDefault();
        const form = e.target;
        const idCliente = form.idCliente?.value ? parseInt(form.idCliente.value) : personaSelect?.id;
        const telefono = form.telefono.value ? parseInt(form.telefono.value) : personaSelect?.telefono;
        const email = form.correo.value.trim();

        // Valida el ID del cliente
        if (!idCliente || isNaN(idCliente)) {
            setModalError("El ID del cliente debe ser un número válido.");
            return;
        }
        // Valida el teléfono
        if (!telefono || isNaN(telefono)) {
            setModalError("El teléfono debe ser un número válido.");
            return;
        }

        // Prepara los datos del cliente
        const clienteData = {
            idCliente,
            nombre: form.nombre.value.trim(),
            apellido: form.apellido.value.trim(),
            email,
            telefono,
            direccion: form.direccion.value.trim()
        };

        console.log("Datos enviados en guardarCliente:", clienteData);

        try {
            if (personaSelect) {
                // Actualiza un cliente existente
                console.log(`Enviando PUT /api/clientes/${personaSelect.id} con datos:`, clienteData);
                const respuesta = await axios.put(`${urlBackend}/clientes/${personaSelect.id}`, clienteData, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log("Respuesta PUT /api/clientes:", respuesta.data);
                // Actualiza el estado de la cartera si cambió
                if (creditoActivo !== (personaSelect.cartera === "Activa")) {
                    console.log(`Enviando PUT /api/carteras/${personaSelect.id}/estado con estado:`, creditoActivo);
                    await axios.put(`${urlBackend}/carteras/${personaSelect.id}/estado`, { estado: creditoActivo }, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
                // Carga la cartera actualizada
                let carteraData = { estado: false, deudas: 0, facturas: [], abono: 0 };
                if (creditoActivo) {
                    const respuestaCartera = await axios.get(`${urlBackend}/carteras/${personaSelect.id}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    console.log(`Respuesta GET /api/carteras/${personaSelect.id}:`, respuestaCartera.data);
                    carteraData = respuestaCartera.data;
                }
                // Actualiza los registros con el cliente modificado
                setRegistros(registros.map(r => r.id === personaSelect.id ? {
                    id: respuesta.data.idCliente,
                    nombre: respuesta.data.nombre,
                    apellido: respuesta.data.apellido,
                    correo: respuesta.data.email,
                    telefono: respuesta.data.telefono.toString(),
                    direccion: respuesta.data.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada"
                } : r));
                // Actualiza los créditos del cliente
                setCreditosPorCliente(prev => ({
                    ...prev,
                    [personaSelect.id]: {
                        facturas: carteraData.facturas.filter(f => f.saldoPendiente > 0),
                        saldoPendiente: carteraData.deudas || 0,
                        abono: carteraData.abono || 0
                    }
                }));
            } else {
                // Crea un nuevo cliente
                console.log("Enviando POST /api/clientes con datos:", clienteData);
                const respuesta = await axios.post(`${urlBackend}/clientes`, clienteData, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log("Respuesta POST /api/clientes:", respuesta.data);
                // Maneja el caso de cliente inactivo existente
                if (respuesta.data.existe) {
                    if (respuesta.data.inactivo && respuesta.data.cliente?.idCliente === idCliente) {
                        abrirModalReactivacion(respuesta.data.cliente);
                        return;
                    } else {
                        setModalError(respuesta.data.mensaje || "El correo ya está en uso por un cliente.");
                        return;
                    }
                }
                // Activa la cartera si se seleccionó crédito
                if (creditoActivo) {
                    console.log(`Enviando PUT /api/carteras/${respuesta.data.cliente.idCliente}/estado con estado: true`);
                    await axios.put(`${urlBackend}/carteras/${respuesta.data.cliente.idCliente}/estado`, { estado: true }, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
                // Carga la cartera del nuevo cliente
                let carteraData = { estado: false, deudas: 0, facturas: [], abono: 0 };
                if (creditoActivo) {
                    const respuestaCartera = await axios.get(`${urlBackend}/carteras/${respuesta.data.cliente.idCliente}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    console.log(`Respuesta GET /api/carteras/${respuesta.data.cliente.idCliente}:`, respuestaCartera.data);
                    carteraData = respuestaCartera.data;
                }
                // Añade el nuevo cliente a los registros
                setRegistros([...registros, {
                    id: respuesta.data.cliente.idCliente,
                    nombre: respuesta.data.cliente.nombre,
                    apellido: respuesta.data.cliente.apellido,
                    correo: respuesta.data.cliente.email,
                    telefono: respuesta.data.cliente.telefono.toString(),
                    direccion: respuesta.data.cliente.direccion,
                    cartera: carteraData.estado ? "Activa" : "Desactivada"
                }]);
                // Actualiza los créditos del nuevo cliente
                setCreditosPorCliente(prev => ({
                    ...prev,
                    [respuesta.data.cliente.idCliente]: {
                        facturas: carteraData.facturas.filter(f => f.saldoPendiente > 0),
                        saldoPendiente: carteraData.deudas || 0,
                        abono: carteraData.abono || 0
                    }
                }));
            }
            // Cierra la modal principal tras guardar
            cerrarModalPrincipal();
        } catch (error) {
            // Maneja errores al guardar el cliente
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

    // Procesa un abono para una factura
    const procesarAbono = async () => {
        const cantidad = parseFloat(cantidadAbonar) || 0;
        // Valida la cantidad y la factura seleccionada
        if (cantidad <= 0 || !facturaSeleccionadaParaAbono) {
            setModalAdvertenciaAbono(true);
            return;
        }
        // Valida que el abono no exceda el saldo pendiente total
        if (cantidad > saldoPendiente) {
            setModalError("El abono no puede ser mayor al saldo pendiente total de la cartera.");
            return;
        }
        // Valida que el abono sea múltiplo de 50
        if (cantidad % 50 !== 0) {
            setModalError("El abono debe ser un valor en múltiplos de 50 (ejemplo: 15.850).");
            return;
        }
        // Valida que el abono sea mínimo 2.000
        if (cantidad < 500) {
            setModalError("El abono debe ser al menos 2.000.");
            return;
        }
        try {
            // Envía la solicitud para procesar el abono
            console.log("Enviando POST /api/carteras/", personaCartera.id, "/abonos con datos:", {
                cantidad,
                fecha: new Date().toISOString().split('T')[0],
                idFactura: facturaSeleccionadaParaAbono.idFactura
            });
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
            console.log("Respuesta POST /api/carteras/", personaCartera.id, "/abonos:", respuesta.data);
            // Filtra las facturas con saldo pendiente
            const facturas = Array.isArray(respuesta.data.facturas)
                ? respuesta.data.facturas.filter(f => f.saldoPendiente > 0)
                : [];
            // Actualiza los créditos del cliente
            setCreditosPorCliente(prev => ({
                ...prev,
                [personaCartera.id]: {
                    facturas,
                    saldoPendiente: respuesta.data.deudas || 0,
                    abono: respuesta.data.abono || 0
                }
            }));
            // Actualiza el saldo pendiente
            setSaldoPendiente(respuesta.data.deudas || 0);
            // Actualiza el estado de la cartera en los registros
            setRegistros(registros.map(r => r.id === personaCartera.id ? {
                ...r,
                cartera: respuesta.data.estado ? "Activa" : "Desactivada"
            } : r));
            // Reinicia los campos de abono
            setCantidadAbonar("");
            setFacturaSeleccionadaParaAbono(null);
            // Cierra la modal de cartera
            cerrarModalcartera();
        } catch (error) {
            // Maneja errores al procesar el abono
            setModalError(error.response?.data?.message || "Error al procesar el abono.");
            console.error("Error al procesar el abono:", error);
        }
    };

    // Abre la modal de detalles de una factura
    const abrirModalDetalles = async (facturaRow) => {
        try {
            console.log("facturaRow recibida en abrirModalDetalles:", facturaRow);

            // Extraer el ID de la factura
            const idFactura = facturaRow.idFactura;

            if (!idFactura) {
                throw new Error("ID de factura no válido.");
            }

            // Hacer solicitud al backend para obtener la factura completa
            const respuesta = await axios.get(`${urlBackend}/carteras/facturas/${idFactura}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const facturaCompleta = respuesta.data;

            // Asegurarse de que la factura tenga los datos necesarios
            const factura = {
                ...facturaCompleta,
                cajero: facturaCompleta.cajero || { id: "Desconocido" }, // Fallback si el cajero no está presente
                productos: Array.isArray(facturaCompleta.productos) ? facturaCompleta.productos : []
            };

            console.log("Factura completa cargada para detalles:", factura);
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

    // Renderiza la interfaz principal
    return (
        <main className='main-home inventario'>
            {/* Título y botones principales */}
            <div className="titulo">
                <h1>Clientes</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Botón para agregar un cliente */}
                    <BotonAgregar onClick={abrirModalAgregar} />
                    {/* Botón para mostrar clientes con cartera activa */}
                    <button className="btn-cartera-activa" onClick={mostrarModalCarteras}>
                        <i className="bi bi-wallet2"></i> Personas con Cartera
                    </button>
                    {/* Botón para mostrar clientes inactivos */}
                    <button className="btn-clientes-inactivos" onClick={mostrarModalInactivos}>
                        <i className="bi bi-person-x"></i> Clientes Inactivos
                    </button>
                </div>
            </div>

            {/* Tabla de clientes activos */}
            <CreadorTablaClientes
                cabeceros={cabeceros}
                registros={registros}
                onEditar={abrirModalEditar}
                onEliminar={abrirModalDesactivacion}
            />
            {/* Mensaje si no hay clientes activos */}
            {registros.length === 0 && !modalError && (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    No hay clientes activos en el portafolio de momento.
                </p>
            )}

            {/* Modal para mostrar clientes con carteras activas */}
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
                                    {/* Botón para abrir la cartera del cliente */}
                                    <BotonCartera onClick={() => abrirModalcartera(cliente)} />
                                    <span>
                                        {cliente.id} - {cliente.nombre.split(' ')[0]} {cliente.apellido.split(' ')[0]}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="pie-modal">
                        {/* Botón para cerrar la modal */}
                        <BotonCancelar type="button" onClick={cerrarModalCarteras} />
                    </div>
                </Modal>
            )}

            {/* Modal para mostrar clientes inactivos */}
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
                                    {/* Botón para reactivar el cliente */}
                                    <button className="btn btn-primary" onClick={() => abrirModalReactivacion(cliente, false)}>
                                        Activar
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="pie-modal">
                        {/* Botón para cerrar la modal */}
                        <BotonCancelar type="button" onClick={cerrarModalInactivos} />
                    </div>
                </Modal>
            )}

            {/* Modal para agregar o editar un cliente */}
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

                        {/* Muestra las facturas del cliente si tiene crédito activo */}
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
                            {/* Botón para cancelar la acción */}
                            <BotonCancelar type="button" onClick={cerrarModalPrincipal} />
                            {/* Botón para guardar el cliente */}
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal para confirmar la desactivación de un cliente */}
            {confirmarDesactivacion && (
                <Modal isOpen={confirmarDesactivacion} onClose={() => cerrarModalConfirmacion(false)}>
                    <div className="encabezado-modal">
                        <h2>Confirmar Desactivación</h2>
                    </div>
                    <p>¿Desea desactivar al cliente {personaDesactivar?.nombre} {personaDesactivar?.apellido}?</p>
                    <div className="pie-modal">
                        {/* Botón para cancelar la desactivación */}
                        <BotonCancelar type="button" onClick={() => cerrarModalConfirmacion(false)} />
                        {/* Botón para confirmar la desactivación */}
                        <BotonAceptar onClick={() => cerrarModalConfirmacion(true)} />
                    </div>
                </Modal>
            )}

            {/* Modal para gestionar la cartera de un cliente */}
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
                                    // Selecciona una factura para el abono
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
                                    const value = e.target.value;
                                    // Solo permite valores numéricos válidos
                                    if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                                        setCantidadAbonar(value);
                                        const parsedValue = parseFloat(value) || 0;
                                        setBotonDesactivado(
                                            parsedValue <= 0 || !facturaSeleccionadaParaAbono || parsedValue % 50 !== 0 || parsedValue < 2000
                                        );
                                    }
                                }}
                                min="2000"
                                step="50"
                            />

                            {/* Muestra las facturas del cliente */}
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
                        {/* Botón para cerrar la modal */}
                        <BotonCancelar type="button" onClick={cerrarModalcartera} />
                        {/* Botón para procesar el abono */}
                        <BotonGuardar type="button" onClick={procesarAbono} disabled={botonDesactivado} />
                    </div>
                </Modal>
            )}

            {/* Modal para mostrar los detalles de una factura */}
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
                            <p>Cajero: {facturaSeleccionada.cajero?.nombre || 'Desconocido'}</p>
                            <p>Estado: {facturaSeleccionada.estado}</p>
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
                                    {facturaSeleccionada.productos && facturaSeleccionada.productos.length > 0 ? (
                                        facturaSeleccionada.productos.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.id || 'N/A'}</td>
                                                <td>{item.nombre || 'Desconocido'}</td>
                                                <td>{item.cantidad || 1}</td>
                                                <td>
                                                    <NumericFormat
                                                        value={item.precio || 0}
                                                        displayType="text"
                                                        thousandSeparator
                                                        prefix="$"
                                                    />
                                                </td>
                                                <td>
                                                    <NumericFormat
                                                        value={(item.cantidad || 1) * (item.precio || 0)}
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
                                <strong>Subtotal: </strong>
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

            {/* Modal de advertencia para desactivación */}
            {modalAdvertenciaDesactivacion && (
                <Modal isOpen={modalAdvertenciaDesactivacion} onClose={cerrarModalAdvertencia}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>Este cliente no se puede desactivar ya que tiene el crédito activado.</p>
                    <div className="pie-modal">
                        {/* Botón para cerrar la modal */}
                        <BotonCancelar type="button" onClick={cerrarModalAdvertencia} />
                    </div>
                </Modal>
            )}

            {/* Modal de advertencia para abono inválido */}
            {modalAdvertenciaAbono && (
                <Modal isOpen={modalAdvertenciaAbono} onClose={() => setModalAdvertenciaAbono(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>{modalError || "El abono no puede ser menor o igual a 0 y debe seleccionar una factura válida."}</p>
                    <div className="pie-modal">
                        {/* Botón para cerrar la modal */}
                        <BotonCancelar type="button" onClick={() => setModalAdvertenciaAbono(false)} />
                    </div>
                </Modal>
            )}

            {/* Modal para mostrar errores */}
            {modalError && (
                <Modal isOpen={!!modalError} onClose={() => setModalError(null)}>
                    <div className="encabezado-modal">
                        <h2>Error</h2>
                    </div>
                    <p>{modalError}</p>
                    <div className="pie-modal">
                        {/* Botón para cerrar la modal */}
                        <BotonAceptar type="button" onClick={() => setModalError(null)} />
                    </div>
                </Modal>
            )}

            {/* Modal para confirmar la reactivación de un cliente */}
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
                        {/* Botón para cancelar la reactivación */}
                        <BotonCancelar type="button" onClick={() => cerrarModalConfirmacionReactivacion(false)} />
                        {/* Botón para confirmar la reactivación */}
                        <BotonAceptar onClick={() => cerrarModalConfirmacionReactivacion(true)} />
                    </div>
                </Modal>
            )}
        </main>
    );
};

export default Portafolio;