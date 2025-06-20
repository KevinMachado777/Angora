import { useState } from "react"
import "../styles/inventario.css"
import 'bootstrap-icons/font/bootstrap-icons.css';
import { TableProductos } from "../components/TableProductos";
import { TableMateria } from "../components/TableMateria";

// Componente de Inventario
export const Inventario = () => {

    // Estado para los checkbox de Productos o Materia Prima, por defecto Productos
    const [opcionSeleccionada, setOpcionSeleccionada] = useState("opcion1");

    // Funcion para cambiar el estado
    const cambiarOpcion = (opcion) => {
        setOpcionSeleccionada(opcion)
    }

  return (
    <main className='main-home inventario'>
        {/* Titulo */}
        <div className="container">
            <h2 className='inventario'>Inventarios</h2>
        </div>
        {/* Checkbuttons */}
        <div className="container inventario-div-checks">

            {/* Boton para exportar */}
            <button type="button" className="btn-exportar">
                {/* Icono de agregar*/}
                <i class="bi bi-plus-circle"></i>

                {/* Renderizado condicional para el texto del boton de agregra dependencia del inventario seleccionado*/}
                {
                    (opcionSeleccionada === "opcion1" ? ("Agregar Producto"): ("Agregar Materia"))
                }
            </button>
            
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
            <button type="button" className="btn-exportar">
                <i class="bi bi-file-earmark-arrow-down-fill"></i>
                    Exportar
            </button>
        </div>
        
        {/* Se renderiza una tabla segun el check del inventario */}
        {
            (opcionSeleccionada === "opcion1" ? <TableProductos/>: <TableMateria/>)
        }

    </main>
  )
}
