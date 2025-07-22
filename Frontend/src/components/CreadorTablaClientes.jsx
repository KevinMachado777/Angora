import "../styles/inventario.css";
import BotonEditar from "../components/BotonEditar"
import BotonDesactivar from "./BotonDesactivar";

// Componente creador de tablas
export const CreadorTablaClientes = ({ cabeceros=[], registros=[], onEditar, onEliminar }) => {
    return (
        <table>
            <thead>
                <tr>
                    {cabeceros.map((header, index) => (
                        <th key={index}>{header}</th>
                    ))}
                    <th>Opciones</th>
                </tr>
            </thead>
            <tbody>
                {registros.map((registro, filaIndex) => {
                    const valores = Object.values(registro); // desempaquetado por índice
                    return (
                        <tr key={filaIndex}>
                            {valores.map((valor, colIndex) => (
                                <td key={colIndex}>{valor}</td>
                            ))}
                            <td>
                                <BotonEditar onClick={() => onEditar(registro)}></BotonEditar>
                                <BotonDesactivar onClick={() => onEliminar(registro)}></BotonDesactivar>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};