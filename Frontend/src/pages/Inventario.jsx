// Importa los hooks de React
import { useRef, useState } from "react";

// Importa los componentes necesarios
import TablaProductos from "../components/TablaProductos";
import BotonAgregar from "../components/botonAgregar";
import BotonExportar from "../components/BotonExportar";
import { CreadorTabla } from "../components/CreadorTabla";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import BotonAceptar from "../components/BotonAceptar";

// Componente principal de Inventario
export const Inventario = () => {
    // Estado para controlar si se muestra productos o materia prima
    const [opcionSeleccionada, setOpcionSeleccionada] = useState("opcion1");

    // Referencia para poder abrir el modal de productos desde fuera
    const tablaProductosRef = useRef(null);

    // Estado inicial para materias primas
    const [registrosMateria, setRegistrosMateria] = useState([
        { id: 1, nombre: "Glicerina", costo: 100, precioUnitario: 150, cantidad: 120 },
        { id: 2, nombre: "Hidróxido de sodio", costo: 200, precioUnitario: 300, cantidad: 80 },
        { id: 3, nombre: "Alcohol", costo: 150, precioUnitario: 225, cantidad: 200 },
        { id: 4, nombre: "Colorante Azul", costo: 50, precioUnitario: 75, cantidad: 60 },
        { id: 5, nombre: "Esencia de Lavanda", costo: 300, precioUnitario: 450, cantidad: 40 }
    ]);

    // Estado para controlar el modal de agregar/editar materia prima
    const [modalAbiertaMateria, setModalAbiertaMateria] = useState(false);

    // Estado para saber si se está editando una materia prima existente
    const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);

    // Estado para saber cuál materia prima se quiere eliminar
    const [materiaEliminar, setMateriaEliminar] = useState(null);

    // Estado para mostrar la confirmación de eliminación
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

    // Función que se ejecuta al hacer clic en "Agregar"
    const manejarAgregar = () => {
        if (opcionSeleccionada === "opcion1") {
            // Abre el modal de productos desde la referencia
            tablaProductosRef.current?.abrirModalAgregar();
        } else {
            // Abre el modal para agregar materia prima
            abrirModalAgregarMateria();
        }
    };

    // Abre el modal de agregar nueva materia prima
    const abrirModalAgregarMateria = () => {
        setMateriaSeleccionada(null);
        setModalAbiertaMateria(true);
    };

    // Abre el modal de edición y carga los datos seleccionados
    const abrirModalEditarMateria = (dato) => {
        setMateriaSeleccionada(dato);
        setModalAbiertaMateria(true);
    };

    // Abre el modal de confirmación para eliminar una materia prima
    const abrirModalEliminarMateria = (dato) => {
        setMateriaEliminar(dato);
        setConfirmarEliminacion(true);
    };

    // Guarda los datos del formulario de materia prima (nuevo o editado)
    const guardarMateria = (e) => {
        e.preventDefault();
        const datos = new FormData(e.target);

        // Construye un objeto con los datos del formulario
        const nueva = {
            id: Number(datos.get("id")),
            nombre: datos.get("nombre"),
            costo: Number(datos.get("costo")),
            precioUnitario: Number(datos.get("precio")),
            cantidad: Number(datos.get("cantidad"))
        };

        if (materiaSeleccionada) {
            // Si es edición, actualiza el registro existente
            setRegistrosMateria(prev => prev.map(p => p.id === materiaSeleccionada.id ? nueva : p));
        } else {
            // Si es nuevo, lo agrega al listado
            setRegistrosMateria(prev => [...prev, nueva]);
        }

        // Cierra el modal y limpia el estado de edición
        setModalAbiertaMateria(false);
        setMateriaSeleccionada(null);
    };

    // Elimina la materia prima seleccionada
    const eliminarMateria = () => {
        setRegistrosMateria(prev => prev.filter(p => p.id !== materiaEliminar.id));
        setConfirmarEliminacion(false);
        setMateriaEliminar(null);
    };

    // Render del componente
    return (
        <main className='main-home inventario'>
            {/* Título principal */}
            <div className="container">
                <h2 className='inventario'>Inventarios</h2>
            </div>

            {/* Controles de botones y filtros */}
            <div className="container inventario-div-checks">
                {/* Botón para agregar producto o materia */}
                <BotonAgregar onClick={manejarAgregar} />

                {/* Checkboxes para elegir entre productos o materia prima */}
                <div className="inventario-div-checks d-flex gap-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkProductos"
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
                            type="checkbox"
                            id="checkMateriaPrima"
                            checked={opcionSeleccionada === "opcion2"}
                            onChange={() => setOpcionSeleccionada("opcion2")}
                        />
                        <label className="form-check-label" htmlFor="checkMateriaPrima">
                            Materia Prima
                        </label>
                    </div>
                </div>

                {/* Botón para exportar */}
                <BotonExportar />
            </div>

            {/* Renderiza productos o materia prima según la opción */}
            {opcionSeleccionada === "opcion1" ? (
                <TablaProductos ref={tablaProductosRef} />
            ) : (
                <CreadorTabla
                    cabeceros={["ID", "Nombre", "Costo", "Precio", "Cantidad"]}
                    registros={registrosMateria}
                    onEditar={abrirModalEditarMateria}
                    onEliminar={abrirModalEliminarMateria}
                />
            )}

            {/* Modal para agregar o editar materia prima */}
            {modalAbiertaMateria && (
                <Modal isOpen={modalAbiertaMateria} onClose={() => setModalAbiertaMateria(false)}>
                    <form onSubmit={guardarMateria}>
                        <h2>{materiaSeleccionada ? "Editar" : "Agregar"} Materia Prima</h2>

                        <div className="mb-3">
                            <label className="form-label">ID</label>
                            <input
                                name="id"
                                type="number"
                                defaultValue={materiaSeleccionada?.id || ""}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Nombre</label>
                            <input
                                name="nombre"
                                type="text"
                                defaultValue={materiaSeleccionada?.nombre || ""}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Costo Unitario</label>
                            <input
                                name="costo"
                                type="number"
                                defaultValue={materiaSeleccionada?.costo || ""}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Precio</label>
                            <input
                                name="precio"
                                type="number"
                                defaultValue={materiaSeleccionada?.precioUnitario || ""}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Cantidad</label>
                            <input
                                name="cantidad"
                                type="number"
                                defaultValue={materiaSeleccionada?.cantidad || ""}
                                className="form-control"
                                required
                            />
                        </div>

                        {/* Botones del modal */}
                        <div className="pie-modal">
                            <BotonCancelar onClick={() => setModalAbiertaMateria(false)} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal de confirmación para eliminar materia prima */}
            {confirmarEliminacion && (
                <Modal isOpen={confirmarEliminacion} onClose={() => setConfirmarEliminacion(false)}>
                    <div className="encabezado-modal">
                        <h2>Confirmar Eliminación</h2>
                    </div>
                    <p>
                        ¿Desea eliminar la materia prima <strong>{materiaEliminar?.nombre}</strong>?
                    </p>
                    <div className="pie-modal">
                        <BotonCancelar onClick={() => setConfirmarEliminacion(false)} />
                        <BotonAceptar onClick={eliminarMateria} />
                    </div>
                </Modal>
            )}
        </main>
    );
};
