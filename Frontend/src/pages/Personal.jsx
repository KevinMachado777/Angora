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
    // Permisos que tienen los empleados por defecto
    const permisos = [
        "Ventas",
        "Inventario",
        "Clientes",
        "Pedidos",
        "Perfil"
    ];

    // Arreglo de persona, luego se le da funcionalidad con Backend
    const [personas, setPersonas] = useState([
        {
            id: 1,
            nombre: "Kevin Andrés Machado Rueda",
            correo: "kevinandresmachadorueda@gmail.com",
            telefono: "3196392919",
            direccion: "Urrao - Antioquia",
            imagen: kevin,
            permisos: ["Ventas", "Inventario", "Clientes", "Pedidos", "Perfil"]
        },
        {
            id: 2,
            nombre: "Samuel Arcangel Rios Rendon",
            correo: "samugamer2394@gmail.com",
            telefono: "3004568745",
            direccion: "Tamesis - Antioquia",
            imagen: samuel,
            permisos: ["Ventas", "Inventario", "Clientes", "Pedidos", "Perfil"]
        },
        {
            id: 3,
            nombre: "Johan Esteban Rios Ramirez",
            correo: "johanestebanrios11@gmail.com",
            telefono: "3117143533",
            direccion: "Santa Barbara - Antioquia",
            imagen: johan,
            permisos: ["Ventas", "Inventario", "Clientes", "Pedidos", "Perfil"]
        },
    ]);

    // Estado de la modal
    const [modalAbierta, setModalAbierta] = useState(false);

    // Estado de la modal para saber si esta editando
    const [ModalEdicion, setModalEdicion] = useState(false);

    // Estado del formulario
    const [formulario, setFormulario] = useState({
        id: "",
        nombre: "",
        correo: "",
        telefono: "",
        direccion: "",
        permisos: [...permisos], // Por defecto los permisos son los del arreglo
    });

    // Estado de la persona seleccionada (edicion)
    const [personaSelect, setPersonaSelect] = useState(null);

    // Estado para la modal de eliminacion
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

    // Estado de la persona a eliminar
    const [personaEliminar, setPersonaEliminar] = useState(null);

    // Funcion para abrir la modal de agregar, sin nadie seleccionado
    const abrirModalAgregar = () => {
        setFormulario({
            id: "",
            nombre: "",
            correo: "",
            telefono: "",
            direccion: "",
            permisos: permisos,
        });

        setPersonaSelect(null);
        setModalEdicion(false);
        setModalAbierta(true)
    }

    // Funcion para abrir la modal de edicion
    const abrirModalEditar = (persona) => {
        setFormulario({
            id: persona.id,
            nombre: persona.nombre,
            correo: persona.correo,
            telefono: persona.telefono,
            direccion: persona.direccion,
            permisos: persona.permisos || [...permisos],
            imagen: persona.imagen || "",
        });

        setPersonaSelect(persona);
        setModalAbierta(true)
        setModalEdicion(true);
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

    // Funcion para manejar los cambios en el formulario
    const manejarCambioFormulario = (evento) => {
        const { name, value, type, checked, files } = evento.target;

        // Si el tipo es file, se obtiene el archivo y se lee como DataURL
        if (type === "file") {
            const archivo = files[0];
            if (archivo) {
                // Crear un lector de archivos para leer la imagen seleccionada
                const lector = new FileReader();
                lector.onloadend = () => {
                    setFormulario({ ...formulario, imagen: lector.result });
                };
                lector.readAsDataURL(archivo);
            }
        }
        else if (type === "checkbox") {
            let nuevosPermisos = [...formulario.permisos];
            if (checked) {
                nuevosPermisos.push(value);
            } else {
                nuevosPermisos = nuevosPermisos.filter((p) => p !== value);
            }
            setFormulario({ ...formulario, permisos: nuevosPermisos });
        }
        else {
            setFormulario({ ...formulario, [name]: value });
        }
    };

    // Funcion para guardar un empleado
    const guardarEmpleado = (evento) => {
        evento.preventDefault();
        if (ModalEdicion && personaSelect) {
            setPersonas(personas.map(p => p.id === personaSelect.id ? { ...formulario } : p))
        }
        else {
            setPersonas([...personas, { ...formulario, id: Date.now() }])
        }
        cerrarModal();
    }

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
        <>
            <div className="titulo">
                <h1>Personal</h1>
                <BotonAgregar onClick={abrirModalAgregar}>
                </BotonAgregar>
            </div>

            <main className="cards-grid-container">
                {/* Mapeo de las personas para crear las tarjetas */}
                {personas.map((persona) => (
                    <div key={persona.id} className="personal" onClick={clicTarjeta}>

                        {/* Datos de enfrente de la tarjeta */}
                        <div className="card-front">
                            <img src={persona.imagen} alt="imagen_perfil" />
                            <p>{persona.nombre}</p>

                            {/* Permisos debajo del nombre */}
                            {persona.permisos && persona.permisos.length > 0 && (
                                <div className="permisos-lista mt-2">
                                    {persona.permisos.map((permiso, i) => (
                                        <span key={i} className="badge bg-secondary me-1">
                                            {permiso}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Datos por detras de la tarjeta */}
                        <div className="card-back">
                            <p>Correo: {persona.correo}</p>
                            <p>Teléfono: {persona.telefono}</p>
                            <p>Dirección: {persona.direccion}</p>
                            <div style={{ display: "flex", gap: "10px" }}>
                                {/* Boton de editar */}
                                <BotonEditar onClick={() => abrirModalEditar(persona)} />
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
                                {personaSelect ? "Modificar Personal" : "Agregar Personal"}
                            </h2>
                        </div>

                        <form onSubmit={guardarEmpleado}>
                            {!ModalEdicion && (
                                <div className="grupo-formulario">
                                    <label>Id:</label>
                                    <input
                                        type="text"
                                        defaultValue={personaSelect ? personaSelect.id : ""}
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
                                    value={formulario.nombre}
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
                                    value={formulario.correo}
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
                                    value={formulario.telefono}
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
                                    value={formulario.direccion}
                                    onChange={manejarCambioFormulario}
                                    className="form-control mb-2"
                                    required
                                />
                            </div>

                            <div className="grupo-formulario">
                                <label>Foto de perfil:</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => manejarCambioFormulario(e)}
                                    className="form-control mb-2"
                                />
                            </div>

                            {/* Vista previa de imagen */}
                            {formulario.imagen && (
                                <div className="grupo-formulario text-center">
                                    <img
                                        src={formulario.imagen}
                                        alt="Vista previa"
                                        style={{
                                            width: "100px",
                                            height: "100px",
                                            objectFit: "cover",
                                            borderRadius: "50%",
                                            border: "2px solid #ccc",
                                            marginBottom: "10px"
                                        }}
                                    />
                                </div>
                            )}

                            <div className="grupo-formulario">
                                <label>Permisos:</label>
                                <div className="d-flex justify-content-between mb-2">
                                    {["Ventas", "Inventario", "Reportes", "Pedidos", "Tickets", "Clientes", "Perfil", "Ord. de Compra"].map(permiso => (
                                        <label key={permiso} className="me-3">
                                            <input
                                                type="checkbox"
                                                name="permisos"
                                                value={permiso}
                                                checked={formulario.permisos.includes(permiso)}
                                                onChange={manejarCambioFormulario}
                                            /> {permiso}
                                        </label>
                                    ))}
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
        </>
    )
}

export default Personal