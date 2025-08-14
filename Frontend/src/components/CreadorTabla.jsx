import React from "react";
import "../styles/inventario.css";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import { NumericFormat } from "react-number-format";

// Componente creador de tablas mejorado
export const CreadorTabla = ({ 
  cabeceros = [], 
  registros = [], 
  onEditar, 
  onEliminar,
  campos = null // Nuevo prop para mapeo personalizado
}) => {
  // Si se proporciona mapeo personalizado, usarlo, sino usar el mapeo automático
  const claves = campos || cabeceros.map((header) =>
    header.toLowerCase()
      .replace(/\s+/g, "")
      .replace("unitario", "") // Quitar "unitario" para que "precio unitario" se mapee a "precio"
  );

  // Función para renderizar el contenido de la celda
  const renderCellContent = (registro, clave, cabecero) => {
    const valor = registro[clave];
    
    // Si el cabecero contiene "precio" o "total", formatear como moneda
    if (cabecero.toLowerCase().includes('precio') || cabecero.toLowerCase().includes('total')) {
      return (
        <NumericFormat
          value={valor || 0}
          displayType="text"
          thousandSeparator="."
          decimalSeparator=","
          prefix="$"
        />
      );
    }
    
    return valor || "";
  };

  return (
    <div className="tabla-contenedor">
      <table className="tabla-productos">
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
                No hay productos agregados
              </td>
            </tr>
          ) : (
            registros.map((registro, filaIndex) => (
              <tr key={filaIndex}>
                {claves.map((clave, colIndex) => (
                  <td key={colIndex}>
                    {renderCellContent(registro, clave, cabeceros[colIndex])}
                  </td>
                ))}
                <td>
                  <div className="botones-opciones">
                    <BotonEditar onClick={() => onEditar(registro)} />
                    <BotonEliminar onClick={() => onEliminar(registro)} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};