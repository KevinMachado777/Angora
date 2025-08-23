import React, { useState } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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

  // Paginación
  const totalItems = registros.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = registros.slice(startIndex, endIndex);

  // Renderizar botones con elipsis
  const renderPageButtons = (totalPages, currentPage, setPageFn) => {
    if (totalPages <= 1) return null;
    const delta = 2;
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range.map((p, idx) => {
      if (p === "...") {
        return (
          <li key={`dots-${idx}`} className="page-item disabled">
            <span className="page-link">…</span>
          </li>
        );
      }
      return (
        <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
          <button className="page-link" onClick={() => setPageFn(p)}>{p}</button>
        </li>
      );
    });
  };

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
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={cabeceros.length + 1} className="text-center text-muted">
                No hay proveedores registrados
              </td>
            </tr>
          ) : (
            currentItems.map((row, filaIndex) => {
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

      {/* Paginación */}
      <nav>
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
              Anterior
            </button>
          </li>
          {renderPageButtons(totalPages, currentPage, setCurrentPage)}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
              Siguiente
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};