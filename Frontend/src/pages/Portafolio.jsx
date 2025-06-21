import React, { useState } from 'react';
import { CreadorTabla } from '../components/CreadorTabla';
import Modal from "../components/Modal";
import "../styles/portafolio.css"
import BotonAgregar from '../components/botonAgregar';
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import BotonAceptar from "../components/BotonAceptar";
import BotonCartera from '../components/BotonCartera';

// Registro a mostrar en la tabla (Por fuera para que no se haga doble renderizado)
const datosIniciales = [
    { id: 1, nombre: "Kevin", apellido: "Machado", correo: "kevin@example.com", telefono: "3196382919", direccion: "Urrao", credito: false },
    { id: 2, nombre: "Samuel", apellido: "Rios", correo: "samuel@example.com", telefono: "3109876543", direccion: "Tamesis", credito: false },
    { id: 3, nombre: "Johan", apellido: "Ramirez", correo: "johan@example.com", telefono: "3205554433", direccion: "Santa Barbara", credito: false },
    // Transformar el dato "credito" en la propiedad "cartera" con esos dos valores
].map(({ credito, ...rest }) => ({
    ...rest,
    cartera: credito ? "Activa" : "Desactivada"
}));

const Portafolio = () => {
    // Cabeceros de la tabla
    const cabeceros = ["Id", "Nombre", "Apellido", "Correo", "Teléfono", "Dirección", "Cartera"];

    // Estado con los registros de los clientes
    const [registros, setRegistros] = useState(datosIniciales);

    // Estado de la modal principal
    const [modalAbierta, setModalAbierta] = useState(false);

    // Estado de la persona seleccionada
    const [personaSelect, setPersonaSelect] = useState(null);

    // Estado de la modal de confirmacion
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const [personaEliminar, setPersonaEliminar] = useState(null);

    // Estado para la persona con cartera
    const [modalCartera, setModalCartera] = useState(false);
    const [personaCartera, setPersonaCartera] = useState(null);

    // Funcion para abrir la modal de agregar, sin nadie seleccionado
    const abrirModalAgregar = () => {
        setPersonaSelect(null);
        setModalAbierta(true)
    }

    // Funcion para abrir la modal de edicion
    const abrirModal = (persona) => {
        setPersonaSelect(persona);
        setModalAbierta(true)
    }

    // Funcion para abrir la modal de eliminacion
    const abrirModalEliminacion = (persona) => {
        setPersonaEliminar(persona);
        setConfirmarEliminacion(true);
    }

    // Funcion para cerrar la modal y quitar la persona cargada
    const cerrarModal = () => {
        setModalAbierta(false);
        setPersonaSelect(null);
    }

    // Funcion para cerra la modal de eliminacion y eliminar la persona seleccionada
    const cerrarModalConfirmacion = (aceptar) => {
        if (aceptar && personaEliminar) {
            setRegistros(registros.filter((r) => r.id !== personaEliminar.id));
        }
        setConfirmarEliminacion(false);
        setPersonaEliminar(null);
    };

    // Funcion para abrir la modal de cartera
    const abrirModalcartera = (persona) => {
        setPersonaCartera(persona);
        setModalCartera(true);
    };

    // Funcion para cerrar la modal de cartera
    const cerrarModalcartera = () => {
        setModalCartera(false);
        setPersonaCartera(null);
    };

    // Funcion para manejar el guardado de un nuevo o editado cliente
    const guardarCliente = (e) => {
        e.preventDefault();
        // Obtiene los datos del formulario
        const form = e.target;

        // Arma el objeto cliente del formulario
        const nuevoRegistro = {
            id: form.id ? parseInt(form.id.value) : personaSelect.id,
            nombre: form.nombre.value,
            apellido: form.apellido.value,
            correo: form.correo.value,
            telefono: form.telefono.value,
            direccion: form.direccion.value,
            cartera: form.credito?.checked ? "Activa" : "Desactivada"
        };

        if (personaSelect) {
            setRegistros(registros.map((r) => (r.id === personaSelect.id ? nuevoRegistro : r)));
        } else {
            setRegistros([...registros, nuevoRegistro]); // Agrega un nuevo registro
        }
        // Cierra la modal después de guardar
        cerrarModal();
    };

    return (
        <main className='main-home'>
            <div className="titulo">
                <h1>Clientes</h1>
                <BotonAgregar onClick={abrirModalAgregar} />
            </div>

            {/* Componente de la tabla */}
            <div className="inventario">
                <CreadorTabla
                    cabeceros={cabeceros}
                    registros={registros}
                    onEditar={abrirModal}
                    onEliminar={abrirModalEliminacion}
                />
            </div>

            {/* Clientes con la cartera activa en el momento */}
            {registros.map((registro) => (
                registro.cartera === "Activa" && (
                    <div key={registro.id} className="cartera-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                        {/* Nombre del cliente con cartera */}
                        <span style={{ marginRight: '10px' }}>{registro.nombre} {registro.apellido}</span>
                        <BotonCartera onClick={() => abrirModalcartera(registro)} />
                    </div>
                )
            ))}

            {/* Modal principal para editar o agregar */}
            {modalAbierta && (
                <Modal isOpen={modalAbierta} onClose={cerrarModal}>
                    <div className="encabezado-modal">
                        <h2>{personaSelect ? "Modificar Cliente" : "Agregar Cliente"}</h2>
                    </div>

                    <form onSubmit={guardarCliente}>
                        {/* Si no se tiene una persona seleccionada se muestra el input de id */}
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
                                <input type="checkbox" name="credito" 
                                defaultChecked={personaSelect?.cartera === 'Activa'} /> Credito
                            </label>
                        </div>

                        <div className="pie-modal">
                            <BotonCancelar type="button" onClick={cerrarModal} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de confirmación para eliminar */}
            {confirmarEliminacion && (
                <Modal isOpen={confirmarEliminacion} onClose={() => cerrarModalConfirmacion(false)}>
                    <div className="encabezado-modal">
                        <h2>Confirmar Eliminación</h2>
                    </div>
                    <p>¿Desea eliminar al cliente {personaEliminar?.nombre} {personaEliminar?.apellido}?</p>
                    <div className="pie-modal">
                        <BotonCancelar
                            type="button"
                            onClick={() => cerrarModalConfirmacion(false)}
                        />
                        <BotonAceptar
                            onClick={() => cerrarModalConfirmacion(true)}
                        />
                    </div>
                </Modal>
            )}

            {/* Modal para mostrar la cartera del cliente */}
            {modalCartera && (
                <Modal isOpen={modalCartera} onClose={cerrarModalcartera}>
                    <div className="encabezado-modal">
                        <h2>Cartera del Cliente</h2>
                    </div>
                    {personaCartera && (
                        <div>
                            <p><strong>Nombre:</strong> {personaCartera.nombre} {personaCartera.apellido}</p>
                            <p><strong>Correo:</strong> {personaCartera.correo}</p>
                            <p><strong>Teléfono:</strong> {personaCartera.telefono}</p>
                            <p><strong>Dirección:</strong> {personaCartera.direccion}</p>
                        </div>
                    )}
                    <div className="pie-modal">
                        <BotonCancelar type="button" onClick={cerrarModalcartera} />
                    </div>
                </Modal>
            )}
        </main>
    );
};

export default Portafolio;