import React, { useState, useEffect } from 'react';
import { CreadorTabla } from '../components/CreadorTabla';
// Nuevo componente importado para mostrar facturas
import TablaFacturas from "../components/TablaFacturas";
import Modal from "../components/Modal";
import "../styles/portafolio.css";
import BotonAgregar from '../components/botonAgregar';
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import BotonAceptar from "../components/BotonAceptar";
import BotonCartera from '../components/BotonCartera';
import { NumericFormat } from "react-number-format";

const Portafolio = () => {
    // Cabeceros de la tabla principal
    const cabeceros = ["Id", "Nombre", "Apellido", "Correo", "Teléfono", "Dirección", "Cartera"];

    // Datos iniciales para simular clientes
    const datosIniciales = [
        { id: 1, nombre: "Kevin", apellido: "Machado", correo: "kevin@example.com", telefono: "3196382919", direccion: "Urrao", credito: false },
        { id: 2, nombre: "Samuel", apellido: "Rios", correo: "samuel@example.com", telefono: "3109876543", direccion: "Tamesis", credito: false },
        { id: 3, nombre: "Johan", apellido: "Ramirez", correo: "johan@example.com", telefono: "3205554433", direccion: "Santa Barbara", credito: false },
    ].map(({ credito, ...rest }) => ({
        ...rest,
        cartera: credito ? "Activa" : "Desactivada"
    }));

    // Estado para almacenar las facturas de crédito por cada cliente
    const [creditosPorCliente, setCreditosPorCliente] = useState(() => {
        const storedCreditos = localStorage.getItem("creditosPorCliente");
        return storedCreditos ? JSON.parse(storedCreditos) : {};
    });

    // Estado para almacenar los registros de clientes
    const [registros, setRegistros] = useState(() => {
        const storedClientes = localStorage.getItem("clientes");
        return storedClientes && JSON.parse(storedClientes).length > 0
            ? JSON.parse(storedClientes)
            : datosIniciales;
    });

    // Estado para controlar si la modal principal está abierta
    const [modalAbierta, setModalAbierta] = useState(false);

    // Estado para almacenar la persona seleccionada
    const [personaSelect, setPersonaSelect] = useState(null);

    // Estado para controlar la modal de confirmación de eliminación
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

    // Estado para almacenar la persona a eliminar
    const [personaEliminar, setPersonaEliminar] = useState(null);

    // Estado para controlar si la modal de cartera está abierta
    const [modalCartera, setModalCartera] = useState(false);

    // Estado para almacenar la persona de la cartera seleccionada
    const [personaCartera, setPersonaCartera] = useState(null);

    // Estado para controlar si la modal de carteras está abierta
    const [modalCarterasAbierta, setModalCarterasAbierta] = useState(false);

    // Estado para controlar si el crédito está activo
    const [creditoActivo, setCreditoActivo] = useState(false);

    // Estado para controlar la modal de advertencia de eliminación
    const [modalAdvertenciaEliminacion, setModalAdvertenciaEliminacion] = useState(false);

    // Estados de los abonos
    const [saldoPendiente, setSaldoPendiente] = useState(0);
    const [cantidadAbonar, setCantidadAbonar] = useState("");
    const [modalAdvertenciaAbono, setModalAdvertenciaAbono] = useState(false);

    // Estado para el botón de guardar en abonos
    const [botonDesactivado, setBotonDesactivado] = useState(false);

    // Estado para controlar la modal de detalles de la factura
    const [modalDetallesAbierta, setModalDetallesAbierta] = useState(false);

    // Estado para almacenar la factura seleccionada
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

    // Sincronizar registros con localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem("clientes", JSON.stringify(registros));
    }, [registros]);

    // Sincronizar creditosPorCliente con localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem("creditosPorCliente", JSON.stringify(creditosPorCliente));
    }, [creditosPorCliente]);

    // Efecto para actualizar el estado de crédito activo según la persona seleccionada
    useEffect(() => {
        if (personaSelect) {
            setCreditoActivo(personaSelect.cartera === "Activa");
            setCreditosPorCliente((prev) => ({
                ...prev,
                [personaSelect.id]: prev[personaSelect.id] || { facturas: [], saldoPendiente: 0 }
            }));
        } else {
            setCreditoActivo(false);
        }
    }, [personaSelect]);

    // Efecto para calcular el saldo pendiente de cada cliente
    useEffect(() => {
        if (personaCartera) {
            const dataCliente = creditosPorCliente[personaCartera.id] || { facturas: [], saldoPendiente: 0 };
            const totalPendiente = dataCliente.saldoPendiente !== undefined
                ? dataCliente.saldoPendiente
                : dataCliente.facturas.reduce((sum, factura) => sum + (factura.total || 0), 0) || 0;
            setSaldoPendiente(totalPendiente);
            const cantidad = parseFloat(cantidadAbonar) || 0;
            setBotonDesactivado(cantidad > totalPendiente || cantidad <= 0);
        } else {
            setBotonDesactivado(true);
        }
    }, [personaCartera, creditosPorCliente, cantidadAbonar]);

    // Función para abrir la modal de agregar cliente
    const abrirModalAgregar = () => {
        setPersonaSelect(null);
        setModalAbierta(true);
        setCreditoActivo(false);
    };

    // Función para abrir la modal de un cliente seleccionado
    const abrirModalEditar = (persona) => {
        setPersonaSelect(persona);
        setModalAbierta(true);
    };

    // Función para cerrar la modal principal
    const cerrarModalPrincipal = () => {
        setModalAbierta(false);
        setPersonaSelect(null);
    };

    // Función para abrir la modal de confirmación de eliminación
    const abrirModalEliminacion = (persona) => {
        if (persona.cartera === "Activa") {
            setPersonaEliminar(persona);
            setModalAdvertenciaEliminacion(true);
            return;
        }
        setPersonaEliminar(persona);
        setConfirmarEliminacion(true);
    };

    // Función para cerrar la modal de confirmación de eliminación
    const cerrarModalConfirmacion = (aceptar) => {
        if (aceptar && personaEliminar) {
            setRegistros(registros.filter((r) => r.id !== personaEliminar.id));
        }
        setConfirmarEliminacion(false);
        setPersonaEliminar(null);
    };

    // Función para abrir la modal de cartera de un cliente
    const abrirModalcartera = (persona) => {
        setPersonaCartera(persona);
        setModalCartera(true);
    };

    // Función para cerrar la modal de cartera
    const cerrarModalcartera = () => {
        setModalCartera(false);
        setPersonaCartera(null);
        setCantidadAbonar("");
    };

    // Función para mostrar la modal de carteras activas
    const mostrarModalCarteras = () => {
        setModalCarterasAbierta(true);
    };

    // Función para cerrar la modal de carteras activas
    const cerrarModalCarteras = () => {
        setModalCarterasAbierta(false);
    };

    // Función para cerrar la modal de advertencia de eliminación
    const cerrarModalAdvertencia = () => {
        setModalAdvertenciaEliminacion(false);
        setPersonaEliminar(null);
    };

    // Función para guardar un cliente
    const guardarCliente = (e) => {
        e.preventDefault();
        const form = e.target;
        const nuevoRegistro = {
            id: personaSelect ? personaSelect.id : parseInt(form.id.value),
            nombre: form.nombre.value,
            apellido: form.apellido.value,
            correo: form.correo.value,
            telefono: form.telefono.value,
            direccion: form.direccion.value,
            cartera: creditoActivo ? "Activa" : "Desactivada"
        };
        if (personaSelect) {
            setRegistros(registros.map((r) => r.id === personaSelect.id ? nuevoRegistro : r));
        } else {
            setRegistros([...registros, nuevoRegistro]);
        }
        cerrarModalPrincipal();
    };

    // Función para procesar los abonos
    const procesarAbono = () => {
        const cantidad = parseFloat(cantidadAbonar) || 0;
        if (cantidad <= 0 || cantidad > saldoPendiente) {
            setModalAdvertenciaAbono(true);
            return;
        }
        if (personaCartera && creditosPorCliente[personaCartera.id]) {
            setCreditosPorCliente(prev => {
                const nuevoSaldo = prev[personaCartera.id].saldoPendiente - cantidad;
                if (nuevoSaldo <= 0) {
                    return {
                        ...prev,
                        [personaCartera.id]: {
                            facturas: [],
                            saldoPendiente: 0
                        }
                    };
                } else {
                    return {
                        ...prev,
                        [personaCartera.id]: {
                            ...prev[personaCartera.id],
                            saldoPendiente: nuevoSaldo
                        }
                    };
                }
            });
        }
        setCantidadAbonar("");
        cerrarModalcartera();
    };

    // Función para abrir la modal de detalles de la factura
    const abrirModalDetalles = (factura) => {
        setFacturaSeleccionada(factura);
        setModalDetallesAbierta(true);
    };

    // Nueva función para cerrar la modal de detalles
    const cerrarModalDetalles = () => {
        setModalDetallesAbierta(false);
        setFacturaSeleccionada(null);
    };

    return (
        <main className='main-home inventario'>
            {/* Contenedor principal para el título y botones de acción */}
            <div className="titulo">
                <h1>Clientes</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <BotonAgregar onClick={abrirModalAgregar} />
                    <button className="btn-cartera-activa" onClick={mostrarModalCarteras}>
                        <i className="bi bi-wallet2"></i> Personas con Cartera
                    </button>
                </div>
            </div>

            {/* Tabla principal para mostrar los clientes */}
            <CreadorTabla
                cabeceros={cabeceros}
                registros={registros}
                onEditar={abrirModalEditar}
                onEliminar={abrirModalEliminacion}
            />

            {/* Modal para mostrar clientes con carteras activas */}
            {modalCarterasAbierta && (
                <Modal isOpen={modalCarterasAbierta} onClose={cerrarModalCarteras}>
                    <div className="encabezado-modal">
                        <h2>Clientes con cartera activa</h2>
                    </div>
                    {registros.map((registro) => (
                        registro.cartera === "Activa" && (
                            <div key={registro.id} className="cartera-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>{registro.nombre} {registro.apellido}</span>
                                <BotonCartera onClick={() => abrirModalcartera(registro)} />
                            </div>
                        )
                    ))}
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalCarteras} />
                    </div>
                </Modal>
            )}

            {/* Modal principal para agregar o modificar clientes */}
            {modalAbierta && (
                <Modal isOpen={modalAbierta} onClose={cerrarModalPrincipal}>
                    <div className="encabezado-modal">
                        <h2>{personaSelect ? "Modificar Cliente" : "Agregar Cliente"}</h2>
                    </div>
                    <form onSubmit={guardarCliente}>
                        {!personaSelect && (
                            <div className="grupo-formulario">
                                <label>Id:</label>
                                <input type="number" name="id" className="form-control mb-2" required />
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
                                type="text"
                                name="telefono"
                                defaultValue={personaSelect ? personaSelect.telefono : ""}
                                className="form-control mb-2"
                                required
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

                        {/* Uso de TablaFacturas para mostrar facturas en formato de array */}
                        {creditoActivo && (
                            <div>
                                <h3>Facturas por crédito</h3>
                                {creditosPorCliente[personaSelect?.id]?.facturas?.length > 0 ? (
                                    <TablaFacturas
                                        encabezados={["Id Factura", "Fecha", "Total"]}
                                        registros={creditosPorCliente[personaSelect.id].facturas.map(factura => [
                                            factura.idFactura,
                                            factura.fecha,
                                            `$${factura.total.toLocaleString('es-CO')}`,
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

            {/* Modal para confirmar eliminación de un cliente */}
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

            {/* Modal para mostrar la cartera de un cliente */}
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
                        <label className="cartera-label">Saldo pendiente</label>
                        <input
                            type="text"
                            disabled
                            className="cartera-input"
                            value={`$${saldoPendiente.toLocaleString('es-CO')}`}
                        />

                        <label className="cartera-label">Va a hacer un abono de</label>
                        <input
                            type="number"
                            name="abono"
                            id="abono"
                            placeholder="$ Ingrese el valor"
                            className="cartera-input"
                            value={cantidadAbonar}
                            onChange={(e) => setCantidadAbonar(e.target.value)}
                        />

                        {/* Uso de TablaFacturas para mostrar facturas en formato de array */}
                        {saldoPendiente > 0 && creditosPorCliente[personaCartera.id]?.facturas?.length > 0 ? (
                            <div className="cartera-tabla">
                                <TablaFacturas
                                    encabezados={["Id Factura", "Fecha", "Total"]}
                                    registros={creditosPorCliente[personaCartera.id].facturas.map(factura => [
                                        factura.idFactura,
                                        factura.fecha,
                                        `$${factura.total.toLocaleString('es-CO')}`,
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
                    <BotonGuardar type="submit" onClick={procesarAbono} disabled={botonDesactivado} />
                </div>
            </Modal>

            {/* Modal para mostrar los detalles de la factura */}
            {modalDetallesAbierta && (
                <Modal isOpen={modalDetallesAbierta} onClose={cerrarModalDetalles}>
                    <div className="encabezado-modal">
                        <h2>Detalles de la Factura</h2>
                    </div>
                    {facturaSeleccionada && (
                        <div className="ticket">
                            <h2 style={{ textAlign: "center" }}>Fragancey´s</h2>
                            <p><strong>Ticket #{facturaSeleccionada.idFactura}</strong></p>
                            <p>Fecha: {facturaSeleccionada.fecha}</p>
                            <p>Cliente: {personaCartera?.nombre} {personaCartera?.apellido}</p>
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
                                                <td>{item.id}</td>
                                                <td>{item.nombre}</td>
                                                <td>{item.cantidad}</td>
                                                <td>
                                                    <NumericFormat
                                                        value={item.precioUnitario}
                                                        displayType={"text"}
                                                        thousandSeparator={true}
                                                        prefix={"$"}
                                                    />
                                                </td>
                                                <td>
                                                    <NumericFormat
                                                        value={item.total}
                                                        displayType={"text"}
                                                        thousandSeparator={true}
                                                        prefix={"$"}
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
                                    value={facturaSeleccionada.total}
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

            {/* Modal de advertencia para eliminar un cliente con cartera activa */}
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

            {/* Modal de advertencia para abonos inválidos */}
            {modalAdvertenciaAbono && (
                <Modal isOpen={modalAdvertenciaAbono} onClose={() => setModalAdvertenciaAbono(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>El abono no puede ser mayor al saldo pendiente ni menor o igual a 0. Por favor, ingrese un valor válido.</p>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={() => setModalAdvertenciaAbono(false)} />
                    </div>
                </Modal>
            )}
        </main>
    );
};

export default Portafolio;