import React, { useState } from "react";
import "../styles/inventario.css";
import BotonEditar from "../components/BotonEditar";
import BotonDesactivar from "./BotonDesactivar";

export const CreadorTablaClientes = ({ cabeceros = [], registros = [], onEditar, onEliminar }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

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
                    {currentItems.map((registro, filaIndex) => {
                        const valores = Object.values(registro);
                        return (
                            <tr key={filaIndex}>
                                {valores.map((valor, colIndex) => (
                                    <td key={colIndex}>{valor}</td>
                                ))}
                                <td>
                                    <BotonEditar onClick={() => onEditar(registro)} />
                                    <BotonDesactivar onClick={() => onEliminar(registro)} />
                                </td>
                            </tr>
                        );
                    })}
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