import "../styles/inventario.css";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";

// Componente creador de tablas
export const CreadorTabla = ({ cabeceros = [], registros = [], onEditar, onEliminar }) => {
  // Mapear cabeceros a claves de datos (en minúsculas, sin espacios, para coincidir con las propiedades)
  const claves = cabeceros.map((header) =>
    header.toLowerCase().replace(/\s+/g, "")
  );

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
        {registros.map((registro, filaIndex) => (
          <tr key={filaIndex}>
            {claves.map((clave, colIndex) => (
              <td key={colIndex}>{registro[clave] || ""}</td>
            ))}
            <td>
              <BotonEditar onClick={() => onEditar(registro)} />
              <BotonEliminar onClick={() => onEliminar(registro)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};