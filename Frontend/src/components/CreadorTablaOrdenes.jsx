import React from "react";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import BotonAceptar from "../components/BotonAceptar";
import "../styles/inventario.css";

// Componente creador de tablas para Órdenes de Compra
export const CreadorTablaOrdenes = ({ cabeceros = [], registros = [], onEditar, onEliminar, onConfirmar }) => {
  // Validar que registros sea un array
  if (!Array.isArray(registros)) {
    console.error("CreadorTablaOrdenes: registros no es un array:", registros);
    return (
      <div className="error-message">
        <p>Error: No se pudieron cargar las órdenes. Los datos no tienen el formato correcto.</p>
      </div>
    );
  }

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
          // Validar que el registro tenga la estructura esperada
          if (!registro || typeof registro !== 'object') {
            console.error("Registro inválido en índice", filaIndex, ":", registro);
            return (
              <tr key={filaIndex}>
                <td colSpan={cabeceros.length + 1}>Error: Registro inválido</td>
              </tr>
            );
          }

          // Accede a las propiedades directamente desde el objeto 'registro'
          const { idOrden, proveedor, ordenMateriaPrimas, notas, estado } = registro;
          const nombreProveedor = proveedor?.nombre || "Desconocido";
          const cantidadArticulos = Array.isArray(ordenMateriaPrimas) ? ordenMateriaPrimas.length : 0;

          return (
            <tr key={filaIndex}>
              <td>{idOrden || "N/A"}</td>
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