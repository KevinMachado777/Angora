import "../styles/inventario.css";
import BotonEditar from "../components/BotonEditar"
import BotonEliminar from "../components/BotonEliminar"

export const CreadorTabla = ({ cabeceros, registros, onEditar, onEliminar }) => {
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
                                <BotonEliminar onClick={() => onEliminar(registro)}></BotonEliminar>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};