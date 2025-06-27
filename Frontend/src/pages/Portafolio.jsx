import React, { useState, useEffect } from 'react';
import { CreadorTabla } from '../components/CreadorTabla';
import { TablaAbonos } from '../components/TablaAbonos';
import Modal from "../components/Modal";
import "../styles/portafolio.css";
import BotonAgregar from '../components/botonAgregar';
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import BotonAceptar from "../components/BotonAceptar";
import BotonCartera from '../components/BotonCartera';

const Portafolio = () => {
    // Cabeceros de la tabla principal
    const cabeceros = ["Id", "Nombre", "Apellido", "Correo", "Teléfono", "Dirección", "Cartera"];

    // Datos para simular cliente 
    const datosIniciales = [
        { id: 1, nombre: "Kevin", apellido: "Machado", correo: "kevin@example.com", telefono: "3196382919", direccion: "Urrao", credito: false },
        { id: 2, nombre: "Samuel", apellido: "Rios", correo: "samuel@example.com", telefono: "3109876543", direccion: "Tamesis", credito: false },
        { id: 3, nombre: "Johan", apellido: "Ramirez", correo: "johan@example.com", telefono: "3205554433", direccion: "Santa Barbara", credito: false },
    ].map(({ credito, ...rest }) => ({
        ...rest,
        cartera: credito ? "Activa" : "Desactivada"
    }));

    // Cabeceros de la tabla de credito
    const cabecerosCredito = ["Id", "Nombre", "Cantidad", "Precio Unitario", "Total"];

    // Estado para almacenar los productos de credito por cada cliente
    const [creditosPorCliente, setCreditosPorCliente] = useState({});

    // Estado para almacenar los registros de clientes
    const [registros, setRegistros] = useState(datosIniciales);

    // Estado para controlar si la modal principal esta abierta
    const [modalAbierta, setModalAbierta] = useState(false);

    // Estado para almacenar la persona seleccionada
    const [personaSelect, setPersonaSelect] = useState(null);

    // Estado para controlar la modal de confirmación de eliminación
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

    // Estado para almacenar la persona a eliminar
    const [personaEliminar, setPersonaEliminar] = useState(null);

    // Estado para controlar si la modal de cartera esta abierta
    const [modalCartera, setModalCartera] = useState(false);

    // Estado para almacenar la persona de la cartera seleccionada
    const [personaCartera, setPersonaCartera] = useState(null);

    // Estado para controlar si la modal de carteras está abierta
    const [modalCarterasAbierta, setModalCarterasAbierta] = useState(false);

    // Estado para controlar si el crédito está activo
    const [creditoActivo, setCreditoActivo] = useState(false);

    // Estado para controlar si la modal de edición de productos está abierta
    const [modalProductosEditar, setModalProductosEditar] = useState(false);

    // Estado para almacenar el producto a editar
    const [productoEditar, setProductoEditar] = useState(null);

    // Estado para controlar si la modal de agregar productos está abierta
    const [modalProductosAgregar, setModalProductosAgregar] = useState(false);

    // Estado para controlar la modal de advertencia de eliminación
    const [modalAdvertenciaEliminacion, setModalAdvertenciaEliminacion] = useState(false);

    // Estados de los abonos
    const [saldoPendiente, setSaldoPendiente] = useState(0);
    const [cantidadAbonar, setCantidadAbonar] = useState("");
    const [modalAdvertenciaAbono, setModalAdvertenciaAbono] = useState(false);

    // Estado para el boton de guardar en abonos
    const [botonDesactivado, setBotonDesactivado] = useState(false);

    // Efecto para actualizar el estado de crédito activo según la persona seleccionada
    useEffect(() => {
        if (personaSelect) {
            setCreditoActivo(personaSelect.cartera === "Activa");
            // Si la persona seleccionada tiene productos de crédito, los asignamos
            setCreditosPorCliente((prev) => ({
                ...prev,
                [personaSelect.id]: prev[personaSelect.id] || { productos: [], saldoPendiente: 0 }
            }));
            // Actualizamos los productos de crédito para la persona seleccionada
        } else {
            setCreditoActivo(false);
        }
    }, [personaSelect]);

    // Efecto para calcular el saldo pendiente de cada cliente
    useEffect(() => {
        if (personaCartera) {
            const dataCliente = creditosPorCliente[personaCartera.id] || { productos: [], saldoPendiente: 0 };
            const totalPendiente = dataCliente.saldoPendiente !== undefined
                ? dataCliente.saldoPendiente
                : dataCliente.productos.reduce((sum, prod) => sum + (prod.total || 0), 0) || 0;
            setSaldoPendiente(totalPendiente);
            const cantidad = parseFloat(cantidadAbonar) || 0;
            setBotonDesactivado(cantidad > totalPendiente || cantidad <= 0);
        } else {
            setBotonDesactivado(true);
        }
    }, [personaCartera, creditosPorCliente]);

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
    };

    // Función para mostrar la modal de carteras activas
    const mostrarModalCarteras = () => {
        setModalCarterasAbierta(true);
    };

    // Función para cerrar la modal de carteras activas
    const cerrarModalCarteras = () => {
        setModalCarterasAbierta(false);
    };

    // Función para abrir la modal de agregar producto de crédito
    const modalAgregarProd = () => {
        setModalProductosAgregar(true);
    };

    // Función para cerrar la modal de advertencia de eliminacion
    const cerrarModalAdvertencia = () => {
        setModalAdvertenciaEliminacion(false);
        setPersonaEliminar(null);
    };

    // Función para guardar un nuevo producto de crédito
    const guardarProductoNuevo = (e) => {
        e.preventDefault();
        const form = e.target;
        const nuevoProducto = {
            id: Date.now(), // Genera un ID único basado en la fecha actual
            nombre: form.nombre.value,
            cantidad: parseInt(form.cantidad.value),
            precioUnitario: parseFloat(form.precioUnitario.value),
            total: parseInt(form.cantidad.value) * parseFloat(form.precioUnitario.value)
        };
        // Actualiza el estado de los productos de crédito
        setCreditosPorCliente((prev) => {
            const dataCliente = prev[personaSelect.id] || { productos: [], saldoPendiente: 0 };
            const nuevoSaldoPendiente = dataCliente.saldoPendiente + nuevoProducto.total;
            return {
                ...prev,
                [personaSelect.id]: {
                    productos: [...dataCliente.productos, nuevoProducto],
                    saldoPendiente: nuevoSaldoPendiente
                }
            };
        });
        setModalProductosAgregar(false);
    };

    // Función para abrir la modal de edición de un producto de crédito
    const modalEditarProd = (producto) => {
        setProductoEditar(producto);
        setModalProductosEditar(true);
    };

    // Función para eliminar un producto de crédito
    const eliminarProductoCredito = (producto) => {
        setCreditosPorCliente((prev) => {
            if (personaSelect && prev[personaSelect.id]) {
                const nuevosProductos = prev[personaSelect.id].productos.filter((p) => p.id != producto.id);
                const nuevoSaldoPendiente = nuevosProductos.reduce((sum, prod) => sum + (prod.total || 0), 0);
                return {
                    ...prev,
                    [personaSelect.id]: {
                        productos: nuevosProductos,
                        saldoPendiente: nuevoSaldoPendiente
                    }
                };
            }
            return prev;
        });
    };

    // Función para guardar los cambios en un producto de crédito
    const guardarProductoCredito = (e) => {
        e.preventDefault();
        const form = e.target;
        const productoActualizado = {
            id: productoEditar.id,
            nombre: form.nombre.value,
            cantidad: parseInt(form.cantidad.value),
            precioUnitario: parseFloat(form.precioUnitario.value),
            total: parseInt(form.cantidad.value) * parseFloat(form.precioUnitario.value)
        };
        // Actualiza el producto en el estado de productos de crédito
        setCreditosPorCliente((prev) => {
            if (personaSelect && prev[personaSelect.id]) {
                const nuevosProductos = prev[personaSelect.id].productos.map((p) =>
                    p.id === productoEditar.id ? productoActualizado : p
                );
                const nuevoSaldo = nuevosProductos.reduce((sum, prod) => sum + (prod.total || 0), 0);
                return {
                    ...prev,
                    [personaSelect.id]: {
                        productos: nuevosProductos,
                        saldoPendiente: nuevoSaldo
                    }
                };
            }
            return prev;
        });
        setModalProductosEditar(false); // Cierra la modal de edición
        setProductoEditar(null);
    };

    // Función para cerrar la modal de edición de productos
    const cerrarModalProductosEditar = () => {
        setModalProductosEditar(false);
        setProductoEditar(null);
    };

    // Función para cerrar la modal de agregar productos
    const cerrarModalProductosAgregar = () => {
        setModalProductosAgregar(false);
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

        // Si las ventanas modales de productos no están abiertas, podemos cerrar la modal principal
        if (!modalProductosEditar && !modalProductosAgregar) {
            cerrarModalPrincipal();
        }
    };

    // Funcion para procesar los abonos
    const procesarAbono = () => {
        const cantidad = parseFloat(cantidadAbonar) || 0;
        if (cantidad <= 100 || cantidad > saldoPendiente) {
            setModalAdvertenciaAbono(true);
            return;
        }
        if (personaCartera && creditosPorCliente[personaCartera.id]) {
            setCreditosPorCliente(prev => {
                const nuevoSaldo = prev[personaCartera.id].saldoPendiente - cantidad;
                if (nuevoSaldo <= 0) {
                    // Si el abono cubre todo o más, limpiar los productos
                    return {
                        ...prev,
                        [personaCartera.id]: {
                            productos: [],
                            saldoPendiente: 0
                        }
                    };
                } else {
                    // Si aún queda saldo, mantener los productos y actualizar el saldo
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

    return (
        <main className='main-home inventario'>
            {/* Contenedor principal para el título y botones de acción */}
            <div className="titulo">
                {/* Título de la sección de clientes */}
                <h1>Clientes</h1>
                {/* Contenedor de botones para agregar cliente y ver carteras activas */}
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
                    {/* Encabezado de la modal de carteras */}
                    <div className="encabezado-modal">
                        <h2>Clientes con cartera activa</h2>
                    </div>
                    {/* Lista de clientes con carteras activas */}
                    {registros.map((registro) => (
                        registro.cartera === "Activa" && (
                            <div key={registro.id} className="cartera-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>{registro.nombre} {registro.apellido}</span>
                                <BotonCartera onClick={() => abrirModalcartera(registro)} />
                            </div>
                        )
                    ))}
                    {/* Pie de la modal con botón de cancelar */}
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalCarteras} />
                    </div>
                </Modal>
            )}

            {/* Modal principal para agregar o modificar clientes */}
            {modalAbierta && (
                <Modal isOpen={modalAbierta} onClose={cerrarModalPrincipal}>
                    {/* Encabezado de la modal principal */}
                    <div className="encabezado-modal">
                        <h2>{personaSelect ? "Modificar Cliente" : "Agregar Cliente"}</h2>
                    </div>
                    {/* Formulario para los datos del cliente */}
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
                                        const nuevosProductos = creditosPorCliente[personaSelect?.id]?.productos.length || [];
                                        if (e.target.checked || nuevosProductos.length === 0) {
                                            setCreditoActivo(e.target.checked);
                                        }
                                    }}
                                    disabled={creditoActivo && (creditosPorCliente[personaSelect?.id]?.length || 0) > 0}
                                /> Crédito
                            </label>
                        </div>

                        {/* Sección de productos de crédito si el crédito está activo */}
                        {creditoActivo && (
                            <div>
                                <h3>Productos por crédito</h3>
                                <BotonAgregar onClick={modalAgregarProd} />
                                {creditosPorCliente[personaSelect?.id]?.productos?.length > 0 ? (
                                    <CreadorTabla
                                        cabeceros={cabecerosCredito}
                                        registros={creditosPorCliente[personaSelect?.id]?.productos}
                                        onEditar={modalEditarProd}
                                        onEliminar={eliminarProductoCredito}
                                    />
                                ) : (
                                    <p style={{ marginTop: '20px' }}>No hay productos de crédito asociados.</p>
                                )}
                            </div>
                        )}

                        {/* Pie de la modal con botones de cancelar y guardar */}
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
                    {/* Encabezado de la modal de confirmación */}
                    <div className="encabezado-modal">
                        <h2>Confirmar Eliminación</h2>
                    </div>
                    {/* Mensaje de confirmación */}
                    <p>¿Desea eliminar al cliente {personaEliminar?.nombre} {personaEliminar?.apellido}?</p>
                    {/* Pie de la modal con botones de cancelar y aceptar */}
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

                        {/* Tabla de productos */}
                        {saldoPendiente > 0 ? (
                            <div className="cartera-tabla">
                                <TablaAbonos
                                    cabeceros={["Id", "Nombre", "Cantidad", "Precio Unitario", "Total"]}
                                    registros={creditosPorCliente[personaCartera.id].productos}
                                />
                            </div>
                        ) : (
                            <p style={{ marginTop: '20px' }}>No hay productos de crédito asociados.</p>
                        )}
                    </div>
                )}

                <div className="pie-modal">
                    <BotonCancelar type="button" onClick={cerrarModalcartera} />
                    <BotonGuardar type="submit" onClick={procesarAbono} disabled={botonDesactivado} />
                </div>
            </Modal>

            {/* Modal para editar un producto de crédito */}
            {modalProductosEditar && productoEditar && (
                <Modal isOpen={modalProductosEditar} onClose={cerrarModalProductosEditar}>
                    {/* Encabezado de la modal de edición */}
                    <div className="encabezado-modal">
                        <h2>Editar Producto de Crédito</h2>
                    </div>
                    {/* Formulario para editar el producto */}
                    <form onSubmit={guardarProductoCredito}>
                        <div className="grupo-formulario">
                            <label>Nombre:</label>
                            <input
                                type="text"
                                name="nombre"
                                defaultValue={productoEditar.nombre}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Cantidad:</label>
                            <input
                                type="number"
                                name="cantidad"
                                defaultValue={productoEditar.cantidad}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Precio Unitario:</label>
                            <input
                                type="number"
                                name="precioUnitario"
                                defaultValue={productoEditar.precioUnitario}
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        {/* Pie de la modal con botones de cancelar y guardar */}
                        <div className="pie-modal">
                            <BotonCancelar type="button" onClick={cerrarModalProductosEditar} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal para agregar un nuevo producto de crédito */}
            {modalProductosAgregar && (
                <Modal isOpen={modalProductosAgregar} onClose={cerrarModalProductosAgregar}>
                    {/* Encabezado de la modal de agregar */}
                    <div className="encabezado-modal">
                        <h2>Agregar Nuevo Producto de Crédito</h2>
                    </div>
                    {/* Formulario para agregar el producto */}
                    <form onSubmit={guardarProductoNuevo}>
                        <div className="grupo-formulario">
                            <label>Nombre:</label>
                            <input
                                type="text"
                                name="nombre"
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Cantidad:</label>
                            <input
                                type="number"
                                name="cantidad"
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        <div className="grupo-formulario">
                            <label>Precio Unitario:</label>
                            <input
                                type="number"
                                name="precioUnitario"
                                className="form-control mb-2"
                                required
                            />
                        </div>
                        {/* Pie de la modal con botones de cancelar y guardar */}
                        <div className="pie-modal">
                            <BotonCancelar type="button" onClick={cerrarModalProductosAgregar} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de advertencia para eliminar un cliente con cartera activa */}
            {modalAdvertenciaEliminacion && (
                <Modal isOpen={modalAdvertenciaEliminacion} onClose={cerrarModalAdvertencia}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>Este cliente no se puede eliminar ya que tiene el credito activado.</p>
                    {/* Pie de la modal con botones de cancelar y aceptar */}
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalAdvertencia} />
                    </div>
                </Modal>
            )}

            {/* Modal de advertencia para abonos mayores a lo debido */}
            {modalAdvertenciaAbono && (
                <Modal isOpen={modalAdvertenciaAbono} onClose={() => setModalAdvertenciaAbono(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p>El abono no puede ser mayor al saldo pendiente o menor a 0. Por favor, ingrese un valor válido.</p>
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={() => setModalAdvertenciaAbono(false)} />
                    </div>
                </Modal>
            )}
        </main>
    );
};

export default Portafolio;