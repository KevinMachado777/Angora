import React from "react";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import "../styles/inventario.css";

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
          const valores = Object.values(registro).slice(0, -1); // Excluir el campo de acciones
          return (
            <tr key={filaIndex}>
              {valores.map((valor, colIndex) => (
                <td key={colIndex}>{valor}</td>
              ))}
              <td>
                <BotonEditar onClick={() => onEditar(registro)} />
                <BotonEliminar onClick={() => onEliminar(registro)} />
                <button
                  className="btn btn-success"
                  onClick={() => onConfirmar(registro)}
                >
                  Confirmar Orden
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};