import React from "react";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import BotonAceptar from "../components/BotonAceptar"; // Re-import BotonAceptar for the Confirmar Orden button
import "../styles/inventario.css";

// Componente creador de tablas para Órdenes de Compra
export const CreadorTablaOrdenes = ({ cabeceros = [], registros = [], onEditar, onEliminar, onConfirmar }) => {
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
          // Accede a las propiedades directamente desde el objeto 'registro'
          // 'registro' aquí es el objeto 'orden' completo
          const { idOrden, proveedor, ordenMateriaPrimas, notas, estado } = registro;
          const nombreProveedor = proveedor?.nombre || "Desconocido";
          const cantidadArticulos = ordenMateriaPrimas?.length || 0;

          return (
            <tr key={filaIndex}>
              <td>{idOrden}</td>
              <td>{nombreProveedor}</td>
              <td>{cantidadArticulos}</td>
              <td>{notas || ""}</td>
              <td>
                {onEditar && (
                  <BotonEditar onClick={() => onEditar(registro)} />
                )}
                {onEliminar && (
                  <BotonEliminar onClick={() => onEliminar(registro)} />
                )}
                {onConfirmar && !estado && ( // Mostrar botón Confirmar solo si la orden NO está confirmada
                  <BotonAceptar onClick={() => onConfirmar(registro)}>Confirmar Orden</BotonAceptar>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
