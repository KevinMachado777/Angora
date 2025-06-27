import { useState } from "react"
import "bootstrap-icons/font/bootstrap-icons.css"; // Importa Bootstrap Icons
import Modal from "../components/Modal"
import kevin from "../assets/images/Kevin perfil.jpg"
import samuel from "../assets/images/Samuel perfil.jpg"
import johan from "../assets/images/Johan perfil.jpg"
import "../styles/personal.css"
import BotonAgregar from "../components/botonAgregar";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import BotonCancelar from "../components/BotonCancelar"
import BotonGuardar from "../components/BotonGuardar"
import BotonAceptar from "../components/BotonAceptar"

const Personal = () => {
    // Estado de la modal
    const [modalAbierta, setModalAbierta] = useState(false);

    // Estado de la persona seleccionada (edicion)
    const [personaSelect, setPersonaSelect] = useState(null);

    // Estado para la modal de eliminacion
    const[confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const[personaEliminar, setPersonaEliminar] = useState(null);

    // Arreglo de persona, luego se le da funcionalidad con Backend
    const [personas, setPersonas] = useState([
        {
            id: 1,
            nombre: "Kevin Andrés Machado Rueda",
            correo: "kevinandresmachadorueda@gmail.com",
            telefono: "3196392919",
            direccion: "Urrao - Antioquia",
            imagen: kevin,
        },
        {
            id: 2,
            nombre: "Samuel Arcangel Rios Rendon",
            correo: "samugamer2394@gmail.com",
            telefono: "3004568745",
            direccion: "Tamesis - Antioquia",
            imagen: samuel,
        },
        {
            id: 3,
            nombre: "Johan Esteban Rios Ramirez",
            correo: "johanestebanrios11@gmail.com",
            telefono: "3117143533",
            direccion: "Santa Barbara - Antioquia",
            imagen: johan,
        },
    ])

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

    // Funcion para cerrar la modal de eliminacion y eliminar la persona seleccionada
    const cerrarModalConfirmacion = (aceptar) => {
        if (aceptar && personaEliminar) {
            // Filter -> Crea un nuevo arreglo de personas con id diferente al de la persona a eliminar
            setPersonas(personas.filter((p) => p.id !== personaEliminar.id));
        }
        // Cerrar modal de eliminacion
        setConfirmarEliminacion(false);
        // Eliminar estado de la persona eliminada
        setPersonaEliminar(null);
    };

    // Clic de la tarjeta
    const clicTarjeta = (evento) => {
        // Obtener el evento dentro de la tarjeta cliqueada
        const tarjeta = evento.currentTarget;
        // Verificar si el clic fue en un boton
        const esBoton = evento.target.closest('.btn')
        if (!esBoton) {
            // Alternar la clase 'girar' para girar o volver a la posicion orginal
            tarjeta.classList.toggle('girar')
        }
    }

    return (
        <main className="main-home">
            <div className="titulo">
                <h1>Personal</h1>
                <BotonAgregar onClick={abrirModalAgregar}>
                    
                </BotonAgregar>
            </div>

            {/* Mapeo de las personas para crear las tarjetas */}
            {personas.map((persona) => (
                <div key={persona.id} className="personal" onClick={clicTarjeta}>

                    {/* Datos de enfrente de la tarjeta */}
                    <div className="card-front">
                        <img src={persona.imagen} alt="imagen_perfil" />
                        <p>Nombre: {persona.nombre}</p>
                    </div>

                    {/* Datos por detras de la tarjeta */}
                    <div className="card-back">
                        <p>Correo: {persona.correo}</p>
                        <p>Teléfono: {persona.telefono}</p>
                        <p>Dirección: {persona.direccion}</p>
                        <div style={{display:"flex", gap: "10px"}}>
                            {/* Boton de editar */}
                            <BotonEditar onClick={() => abrirModal(persona)} />
                            {/* Boton de eliminar */}
                            <BotonEliminar onClick={() => abrirModalEliminacion(persona)} />
                        </div>
                    </div>
                </div>
            ))}

            {/* Rendirizar la modal si se da en un boton de eliminar o editar */}
            {modalAbierta && (
                <Modal isOpen={modalAbierta} onClose={cerrarModal}>
                    <div className="encabezado-modal">

                        {/* Renderizado condicional para saber si vamos a actualizar o agregar */}
                        <h2>
                            {personaSelect ? "Modificar Personal": "Agregar Personal"}
                        </h2>
                    </div>

                    <form>
                        <div className="grupo-formulario">
                            <label>Nombre:</label>
                            <input
                                type="text"
                                defaultValue={personaSelect ? personaSelect.nombre : ""}
                                className="form-control mb-2"
                            />
                        </div>

                        <div className="grupo-formulario">
                            <label>Correo:</label>
                            <input
                                type="email"
                                defaultValue={personaSelect ? personaSelect.correo : ""}
                                className="form-control mb-2"
                            />
                        </div>

                        <div className="grupo-formulario">
                            <label>Teléfono:</label>
                            <input
                                type="text"
                                defaultValue={personaSelect ? personaSelect.telefono : ""}
                                className="form-control mb-2"
                            />
                        </div>

                        <div className="grupo-formulario">
                            <label>Dirección:</label>
                            <input
                                type="text"
                                defaultValue={personaSelect ? personaSelect.direccion : ""}
                                className="form-control mb-2"
                            />
                        </div>

                        <div className="grupo-formulario">
                            <label>Rol:</label>
                            <div className="d-flex">
                                <label className="me-3">
                                    <input type="radio" name="roles" value="cajero" /> Cajero
                                </label>
                                <label className="me-3">
                                    <input type="radio" name="roles" value="vendedor" /> Vendedor
                                </label>
                            </div>
                        </div>

                        <div className="grupo-formulario">
                            <label>Permisos:</label>
                            <div className="d-flex justify-content-between mb-2">
                                <label className="me-3">
                                    <input type="checkbox" name="permisos" value="Ventas" /> Ventas
                                </label>
                                <label className="me-3">
                                    <input type="checkbox" name="permisos" value="Inventario" /> Inventario
                                </label>
                                <label className="me-3">
                                    <input type="checkbox" name="permisos" value="Reportes" /> Reportes
                                </label>
                                <label className="me-3">
                                    <input type="checkbox" name="permisos" value="Tickets" /> Tickets
                                </label>
                                <label>
                                    <input type="checkbox" name="permisos" value="OrdDeCompra" /> Ord. de Compra
                                </label>
                            </div>
                        </div>

                        {/* Botones de cancelar y guardar al final de la modal */}
                        <div className="pie-modal">
                            <BotonCancelar type="button" onClick={cerrarModal} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de confirmacion para eliminar */}
            {confirmarEliminacion && (
                <Modal isOpen={confirmarEliminacion} onClose={cerrarModalConfirmacion}>
                    <div className="encabezado-modal">
                        <h2>Confirmar Eliminación</h2>
                    </div>
                    <p>¿Desea eliminar al empleado {personaEliminar?.nombre}?</p>
                    <div className="pie-modal">
                        {/* Cerrar modal si se cancela */}
                        <BotonCancelar onClick={() => cerrarModalConfirmacion(false)} />

                        {/* Cerrar y eliminar el empleado si se da aceptar */}
                        <BotonAceptar onClick={() => cerrarModalConfirmacion(true)} />
                    </div>
                </Modal>
            )}
        </main>
    )
}

export default Personal