import React, { useState, useEffect } from "react";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import BotonAceptar from "../components/BotonAceptar";
import "../styles/botones.css";
import "../styles/inventario.css";

export const CreadorTablaOrdenes = ({ cabeceros = [], registros = [], onEditar, onEliminar, onConfirmar }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Resetear paginación cuando cambien los registros
  useEffect(() => {
    setCurrentPage(1);
  }, [registros]);

  // Paginación
  const totalItems = Array.isArray(registros) ? registros.length : 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = Array.isArray(registros) ? registros.slice(startIndex, endIndex) : [];

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
          <button 
            type="button" // Agrega esto
            className="page-link" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentPage(p);
            }}
          >
            {p}
          </button>
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
                {totalItems === 0 ? "No hay órdenes pendientes" : "Error: No se pudieron cargar las órdenes. Los datos no tienen el formato correcto."}
              </td>
            </tr>
          ) : (
            currentItems.map((registro, filaIndex) => {
              const { idOrden, proveedor, ordenMateriaPrimas, notas, estado } = registro;
              const nombreProveedor = proveedor?.nombre || "Desconocido";
              const cantidadArticulos = Array.isArray(ordenMateriaPrimas) ? ordenMateriaPrimas.length : 0;

              return (
                <tr key={`orden-${idOrden}-${filaIndex}`}>
                  <td>{idOrden || "N/A"}</td>
                  <td>{nombreProveedor}</td>
                  <td>{cantidadArticulos}</td>
                  <td>{notas || ""}</td>
                  <td>
                    {onEditar && <BotonEditar onClick={() => onEditar(registro)} />}
                    {onEliminar && <BotonEliminar onClick={() => onEliminar(registro)} />}
                    {onConfirmar && !estado && (
                      <BotonAceptar 
                        key={`confirmar-${idOrden}-${currentPage}`}  // ← SOLUCIÓN: Key único
                        className="btn-aceptar-pequeno" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Doble verificación de seguridad
                          if (e.isTrusted && e.type === 'click') {
                            onConfirmar(registro);
                          }
                        }} 
                      />
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {totalPages > 1 && (
        <nav aria-label="Paginación" onClick={e => e.stopPropagation()}>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button 
                className="page-link" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentPage(Math.max(1, currentPage - 1));
                }}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
            </li>
            {renderPageButtons(totalPages, currentPage, setCurrentPage)}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button 
                className="page-link" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                }}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};