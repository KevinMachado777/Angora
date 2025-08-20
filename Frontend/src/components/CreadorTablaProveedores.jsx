import "../styles/inventario.css";
import BotonEditar from "./BotonEditar";
import { NumericFormat } from "react-number-format";

export const CreadorTablaProveedores = ({ 
  cabeceros = [], 
  registros = [], 
  onEditar, 
  onEliminar,
  campos = null,
  modo = "desactivar" 
}) => {
  const claves = campos || cabeceros.map((header) =>
    header.toLowerCase().replace(/\s+/g, "").replace("unitario", "")
  );

  const renderCellContent = (registroPlano, clave, cabecero) => {
    const valor = registroPlano?.[clave];

    if (cabecero.toLowerCase().includes("precio") || cabecero.toLowerCase().includes("total")) {
      return (
        <NumericFormat
          value={valor ?? 0}
          displayType="text"
          thousandSeparator="."
          decimalSeparator=","
          prefix="$"
        />
      );
    }

    if (typeof valor === "boolean") {
      return valor ? "Activo" : "Inactivo";
    }

    return valor ?? "";
  };

  const textoBotonAccion = modo === "reactivar" ? "Reactivar" : "Desactivar";
  const claseBotonAccion = modo === "reactivar" ? "btn-aceptar btn-pequeño" : "btn-eliminar";

  return (
    <div className="tabla-contenedor">
      <table className="tabla-clientes">
        <thead>
          <tr>
            {cabeceros.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
            <th>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {registros.length === 0 ? (
            <tr>
              <td colSpan={cabeceros.length + 1} className="text-center text-muted">
                No hay proveedores registrados
              </td>
            </tr>
          ) : (
            registros.map((row, filaIndex) => {
              // 🔑 Normalizamos: si viene de React Table, usar row.original; si no, usar la fila tal cual
              const registroPlano = row?.original ?? row;

              return (
                <tr key={filaIndex}>
                  {claves.map((clave, colIndex) => (
                    <td key={colIndex}>
                      {renderCellContent(registroPlano, clave, cabeceros[colIndex])}
                    </td>
                  ))}
                  <td>
                    <BotonEditar onClick={() => onEditar(registroPlano)} />
                    <button
                      className={claseBotonAccion}
                      onClick={() => onEliminar(registroPlano)}
                    >
                      {textoBotonAccion}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
