import React, { useState } from "react";
import "../styles/inventario.css";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import { NumericFormat } from "react-number-format";

export const CreadorTabla = ({ 
  cabeceros = [], 
  registros = [], 
  onEditar, 
  onEliminar,
  campos = null,
  currentPage = 1,
  pageSize = 5,
  onPageChange
}) => {
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);

  const claves = campos || cabeceros.map((header) =>
    header.toLowerCase()
      .replace(/\s+/g, "")
      .replace("unitario", "")
  );

  const renderCellContent = (registro, clave, cabecero) => {
    const valor = registro[clave];
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

  // Paginación
  const totalItems = registros.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (localCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = registros.slice(startIndex, endIndex);

  // Control de página
  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setLocalCurrentPage(newPage);
    if (onPageChange) onPageChange(newPage);
  };

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
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={cabeceros.length + 1} className="text-center text-muted">
                No hay productos agregados
              </td>
            </tr>
          ) : (
            currentItems.map((registro, filaIndex) => (
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

      {/* Paginación */}
      <nav>
        <ul className="pagination justify-content-center">
          <li className={`page-item ${localCurrentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => goToPage(localCurrentPage - 1)}>
              Anterior
            </button>
          </li>
          {renderPageButtons(totalPages, localCurrentPage, goToPage)}
          <li className={`page-item ${localCurrentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => goToPage(localCurrentPage + 1)}>
              Siguiente
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};