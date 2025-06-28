import { useState } from "react"
import "../styles/inventario.css"
import 'bootstrap-icons/font/bootstrap-icons.css';
import BotonExportar from "../components/BotonExportar";
import BotonAgregar from "../components/botonAgregar";
import { CreadorTabla } from '../components/CreadorTabla'
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import BotonAceptar from "../components/BotonAceptar";

// Componente de Inventario
export const Inventario = () => {

    // Estado para los checkbox de Productos o Materia Prima, por defecto Productos
    const [opcionSeleccionada, setOpcionSeleccionada] = useState("opcion1");

    // Funcion para cambiar el estado
    const cambiarOpcion = (opcion) => {
        setOpcionSeleccionada(opcion)
    }
    

    const encabezados = ["ID", "Nombre", "Costo", "Precio Unitario", "Cantidad","Categoria"]

    const [registros, setRegistros] = useState([{
        id:1,
        nombre:"Lavamanos",
        costo:3000,
        precioUnitario:4500,
        cantidad:5,
        categoria:"Jabón"},
    {
        id:2,
        nombre:"Desengrasante",
        costo:7500,
        precioUnitario:14500,
        cantidad:2,
        categoria:"Jabón"}
    ]);

    const [registrosMateria, setRegistrosMateria] = useState([{
        id:1,
        nombre:"Tapas",
        costo:500,
        precioUnitario:1000,
        cantidad:500,
        categoria:"Embalaje"},
    {
        id:2,
        nombre:"Tarros",
        costo:300,
        precioUnitario:900,
        cantidad:60,
        categoria:"Embalaje"}
    ]);

    const handleChange = (id, nuevaCantidad) => {
        if (opcionSeleccionada === "opcion1") {
            
            const nuevosRegistros = registros.map((p) =>
                p.id === id ? { ...p, cantidad: Number(nuevaCantidad) } : p
            );
            setRegistros(nuevosRegistros);
        }
        else{
           const nuevosRegistros = registrosMateria.map((p) =>
                p.id === id ? { ...p, cantidad: Number(nuevaCantidad) } : p
            );
            setRegistrosMateria(nuevosRegistros); 
        }
    };


    // Estado de la modal
    const [modalAbiertaProducto, setModalAbiertaProducto] = useState(false);
    const [modalAbiertaMateria, setModalAbiertaMateria] = useState(false);

    // Estado del producto seleccionado (edicion)
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    // Estado de la materia seleccionada (edicion)
    const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);

    // Estado para la modal de eliminacion
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const [productoEliminar,setProductoEliminar] = useState(null);
    const [materiaEliminar,setMateriaEliminar] = useState(null);

    // Funcion para abrir la modal de agrgar, sin nada seleccionado
    const abrirModalAgregar = () => {
        if (opcionSeleccionada === "opcion1"){
            setProductoSeleccionado(null);
            setModalAbiertaProducto(true);
        }
        else{
            setMateriaSeleccionada(null);
            setModalAbiertaMateria(true);
        }
    };

    // Funcion para abrir la model de edicion
    const abrirModal = (dato) => {

        if (opcionSeleccionada === "opcion1"){
            setProductoSeleccionado(dato);
            setModalAbiertaProducto(true);
        }
        else{
            setMateriaSeleccionada(dato);
            setModalAbiertaMateria(true);
        }
    };

    // Funcion para abrir la modal de eliminacion
    const abrirModalElimiacion = (dato) => {

        (opcionSeleccionada === "opcion1" ? setProductoEliminar(dato) : setMateriaEliminar(dato))

        setConfirmarEliminacion(true);
    };

    // Funcion para cerrar la modal y quitar el producto o materia cargada en los estados
    const cerrarModal = () => {
        if (opcionSeleccionada === "opcion1") {
            setModalAbiertaProducto(false);
            setProductoSeleccionado(null);
        }
        else{
            setModalAbiertaMateria(false);
            setMateriaSeleccionada(null);
        }
    };

    // funcion para cerrar la modal de eliminacion y eliminar la persona seleccionada
    const cerrarModalConfirmacion = (aceptar) => {
        if (opcionSeleccionada === "opcion1") {
            if (aceptar && productoEliminar) {
                setRegistros(registros.filter((p) => p.id !== productoEliminar.id));
            }
            setConfirmarEliminacion(false);
            setProductoEliminar(null);
        }
        else{
            if (aceptar && materiaEliminar) {
                setRegistrosMateria(registrosMateria.filter((p) => p.id !== materiaEliminar.id));
            }

            setConfirmarEliminacion(false);
            setMateriaEliminar(null);
        }
    }


    const botonEliminarProducto = (dato) => {
        // Funcion que acciona el evento de eliminar un producto
    };

    const botonEditarProducto = (dato) => {
        // Funcion que acciona el evento de editar un producto
    };

    const botonEliminarMateria = (dato) => {
        // Funcion que acciona el evento de eliminar una materia
    };

    const botonEditarMateria = (dato) => {
        // Funcion que acciona el evento de editar una materia
    };

  return (
    <main className='main-home inventario'>
        {/* Titulo */}
        <div className="container">
            <h2 className='inventario'>Inventarios</h2>
        </div>
        {/* Checkbox */}
        <div className="container inventario-div-checks">

            {/* Boton para exportar */}
            <BotonAgregar onClick={abrirModalAgregar}/>
            
            {/* Contenedor para los checkbox*/}
            <div className= "inventario-div-checks">

                {/* Checkbuttom para productos */}
                <label htmlFor="productos" className="checkbox-label"> 
                    <input type="checkbox" name="productos" id="productos" 
                        checked={opcionSeleccionada === "opcion1"}
                        onChange={() => cambiarOpcion("opcion1")}
                        className="checkbox-custom"/>
                        Productos
                </label>

                {/* Checkbuttons para materia prima */}
                <label htmlFor="materiaprima" className="checkbox-label"> 
                    <input type="checkbox" name="materiaprima" id="materiaprima"
                        checked={opcionSeleccionada === "opcion2"} 
                        onChange={() => cambiarOpcion("opcion2")}
                        className="checkbox-custom"/>
                    Materia Prima
                </label>

            </div>

            {/* Boton para exportar */}
            <BotonExportar>
                
            </BotonExportar>
        </div>
        
        {/* Se renderiza una tabla segun el check del inventario */}
        {
            (opcionSeleccionada === "opcion1" ? 
                // Tabla de los productos
                <CreadorTabla 
                    cabeceros={encabezados}
                    registros={registros}
                    onEditar={abrirModal}
                    onEliminar={abrirModalElimiacion}
                    
                    />: 
                // Tabla de materia prima
                <CreadorTabla
                    cabeceros={encabezados}
                    registros={registrosMateria}
                    onEditar={abrirModal}
                    onEliminar={abrirModalElimiacion}
                    />)
        }

        
        {/* Modal para el producto */}
        {
            modalAbiertaProducto && (
                <Modal isOpen={modalAbiertaProducto} onClose={cerrarModal}>
                    {/* titulo ventans */}
                    <div className="encabezado-modal">
                        <h2>
                            {productoSeleccionado == null ? "Agregar Producto" : "Modificar Producto" }
                        </h2>
                        
                    </div>
                    {/*Formulario*/}
                    <form>
                        {/* Id */}
                        <div className="grupo-formulario">
                            <label>Id</label>
                            <input type="text"
                            defaultValue={productoSeleccionado ? productoSeleccionado.id : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Nombre */}
                        <div className="grupo-formulario">
                            <label>Nombre</label>
                            <input type="text"
                            defaultValue={productoSeleccionado ? productoSeleccionado.nombre : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Costo */}
                        <div className="grupo-formulario">
                            <label>Costo</label>
                            <input type="number"
                            defaultValue={productoSeleccionado ? productoSeleccionado.costo : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Precio Unitario */}
                        <div className="grupo-formulario">
                            <label>Precio Unitario</label>
                            <input type="number"
                            defaultValue={productoSeleccionado ? productoSeleccionado.precioUnitario : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Stock */}
                        <div className="grupo-formulario">
                            <label>Stock</label>
                            <input type="number"
                            defaultValue={productoSeleccionado ? productoSeleccionado.cantidad : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Categoria */}
                        <div className="grupo-formulario">
                            <label>Categoria</label>
                            <select 
                                value={productoSeleccionado?.unidadMedida}
                                onChange={(e) => handleChange(productoSeleccionado.id, e.target.value)}
                                className="form-select"
                                >
                                    <option value="">Selecciona una opción</option>
                                    <option value="Gramos">Gramos</option>
                                    <option value="Unidades">Unidades</option>
                            </select>
                        </div>
                        {/* Tabla dentro de productos para agregar la materia prima */}
                        <div className="grupo-formulario">
                            <CreadorTabla 
                                cabeceros={["ID","Nombre","Cantidad"]}
                                registros={[{
                                    id:"1",
                                    nombre:"Glicerina",
                                    cantidad:120
                                },
                                {
                                    id:"2",
                                    nombre:"Hidroxido de sodio",
                                    cantidad:40
                                }]}/>
                        </div>
                        {/* Botones de cancelar y guardar al final de la modal */}
                        <div className="pie-modal">
                            <BotonCancelar type="button" onClick={cerrarModal} >
                            </BotonCancelar>
                            <BotonGuardar type="submit" >
                            </BotonGuardar>
                        </div>
                    </form>

                </Modal>
            )
        }

        {/* Modal de formulario para agregar la materia prima */}
        {
            modalAbiertaMateria && (
                <Modal isOpen={modalAbiertaMateria} onClose={cerrarModal}>
                    {/* Titulo de la ventana modal */}
                    <div className="encabezado-modal">
                        <h2>
                            {materiaSeleccionada === null ? "Agregar Materia" : "Modificar Materia"}
                        </h2>
                    </div>

                    {/* Formulario */}
                    <form>
                        {/* Id */}
                        <div className="grupo-formulario">
                            <label>ID</label>
                            <input type="number"
                            defaultValue={materiaSeleccionada ? materiaSeleccionada.id : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Nombre */}
                        <div className="grupo-formulario">
                            <label>Nombre</label>
                            <input type="text"
                            defaultValue={materiaSeleccionada ? materiaSeleccionada.nombre : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Costo */}
                        <div className="grupo-formulario">
                            <label>Costo</label>
                            <input type="text"
                            defaultValue={materiaSeleccionada ? materiaSeleccionada.costo : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Precio Unitario */}
                        <div className="grupo-formulario">
                            <label>Precio Unitario</label>
                            <input type="number"
                            defaultValue={materiaSeleccionada ? materiaSeleccionada.precioUnitario : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Stock */}
                        <div className="grupo-formulario">
                            <label>Stock</label>
                            <input type="number"
                            defaultValue={materiaSeleccionada ? materiaSeleccionada.cantidad : ""}
                            className="form-control mb-2" />
                        </div>
                        {/* Categoria */}
                        <div className="grupo-formulario">
                            <label>Categoria</label>
                            <select 
                                value={materiaSeleccionada?.unidadMedida}
                                onChange={(e) => handleChange(materiaSeleccionada.id, e.target.value)}
                                className="form-select"
                                >
                                    <option value="">Selecciona una opción</option>
                                    <option value="Gramos">Embalaje</option>
                                    <option value="Unidades">Insumos</option>
                            </select>
                        </div>
                        {/* Botones de cancelar y guardar al final de la modal */}
                        <div className="pie-modal">
                            <BotonCancelar type="button" onClick={cerrarModal} >
                            </BotonCancelar>
                            <BotonGuardar type="submit" >
                            </BotonGuardar>
                        </div>
                    </form>

                </Modal>
            )
        }
        {/* Ventana para la confirmacion de acciones como eliminar */}
        {confirmarEliminacion && (
            <Modal isOpen={confirmarEliminacion} onClose={cerrarModalConfirmacion}>
                {/* Titulo */}
                <div className="encabezado-modal">
                    <h2>Confirmar Eliminación</h2>
                </div>
                
                {/* Se renderiza un parrafo de acuerdo del estado de la opcionSeleccionada */}
                {
                    opcionSeleccionada === "opcion1" ? 
                    (<p>¿Desea eliminar el Producto <strong>{productoEliminar?.nombre}</strong>?</p>) : 
                    (<p>¿Desea eliminar la Materia <strong>{materiaEliminar?.nombre}</strong>?</p>)
                }

                {/* Botones para cerrar la modal */}
                <div className="pie-modal">
                        {/* Cerrar modal si se cancela */}
                        <BotonCancelar
                            type="button"
                            onClick={() => cerrarModalConfirmacion(false)}
                            className="btn btn-secondary me-2"> Cancelar
                        </BotonCancelar>

                        {/* Cerrar y eliminar el empleado si se da aceptar */}
                        <BotonAceptar
                            onClick={() => cerrarModalConfirmacion(true)}>
                        </BotonAceptar>
                    </div>

            </Modal>
        )}
    </main>
  )
}
