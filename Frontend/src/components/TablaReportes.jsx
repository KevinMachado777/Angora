import React, { useState, useEffect } from 'react';
import '../styles/TablaReportes.css';

const TablaReportes = ({ encabezados, registros, mapeo }) => {
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');

    // paginador
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // <-- siempre 10 registros por página como pediste

    // <-- Mover getValue aquí (declaración con function para evitar hoisting issues)
    function getValue(item, header) {
        const key = mapeo[header];
        if (!key) return '-'; // Si no hay mapeo, devuelve "-"

        let value = item[key];
        if (value === undefined || value === null) return '-';

        // Formatear fechas si corresponde
        if (header === 'Fecha' || header === 'Fecha Movimiento' || header === 'Ultima Compra') {
            // Intentar parsear solo si es una fecha válida
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                return d.toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
            }
            return String(value);
        }

        // Convertir a número si es numérico (Total, Cantidad, Nº Compras)
        if (header === 'Total' || header === 'Cantidad' || header === 'Cantidad Pasada' || header === 'Cantidad Actual' || header === 'Nº Compras') {
            const numValue = Number(value);
            return isNaN(numValue) ? '-' : numValue;
        }

        return String(value); // Para strings como Nombre, Cliente, etc.
    }

    const handleSort = (columna) => {
        const newOrder = sortField === columna && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(columna);
        setSortOrder(newOrder);
        setCurrentPage(1); // ir a primera página al cambiar el orden
    };

    // Ordenar los registros (se mantiene la lógica que ya tenías)
    const sortedRegistros = [...registros].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = getValue(a, sortField);
        const bValue = getValue(b, sortField);

        // Si ambos son "-", mantener
        if (aValue === '-' && bValue === '-') return 0;
        if (aValue === '-') return 1;
        if (bValue === '-') return -1;

        // Comparar números si ambos son números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Fallback: comparar como strings
        return sortOrder === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    // Reset de página si cambian los registros (p. ej.: nueva consulta)
    useEffect(() => {
        setCurrentPage(1);
    }, [registros]);

    // cálculo de paginación
    const totalItems = sortedRegistros.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    // asegurar currentPage válido
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageItems = sortedRegistros.slice(startIndex, endIndex);

    // genera una lista de números de página (ventana)
    const getPageNumbers = () => {
        const maxButtons = 7; // máximo botones a mostrar
        const pages = [];

        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        // ventana centrada en la página actual
        let start = Math.max(1, currentPage - 3);
        let end = Math.min(totalPages, currentPage + 3);

        // ajustar si estamos cerca de los extremos
        if (currentPage <= 4) {
            start = 1;
            end = maxButtons;
        } else if (currentPage >= totalPages - 3) {
            start = totalPages - (maxButtons - 1);
            end = totalPages;
        }

        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const goToPage = (p) => {
        if (p < 1 || p > totalPages) return;
        setCurrentPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // opcional: subir al top de la tabla al cambiar página
    };

    return (
        <div className="tabla-reportes-container">
            <table className="tabla-reportes">
                <thead>
                    <tr>
                        {encabezados.map((encabezado, index) => (
                            <th key={index} onClick={() => handleSort(encabezado)}>
                                {encabezado} {sortField === encabezado && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {pageItems.length > 0 ? (
                        pageItems.map((registro, index) => (
                            <tr key={startIndex + index}>
                                {encabezados.map((encabezado, i) => (
                                    <td key={i}>{getValue(registro, encabezado)}</td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={encabezados.length}>No hay datos</td></tr>
                    )}
                </tbody>
            </table>

            {/* Paginador */}
            <div className="paginador" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                <div className="paginador-info">
                    <small>
                        Mostrando {totalItems === 0 ? 0 : startIndex + 1} - {endIndex} de {totalItems}
                    </small>
                </div>

                <div className="paginador-controles" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button className="btn-page" onClick={() => goToPage(1)} disabled={currentPage === 1}>« Primero</button>
                    <button className="btn-page" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹ Anterior</button>

                    {getPageNumbers().map(p => (
                        <button
                            key={p}
                            onClick={() => goToPage(p)}
                            className={`btn-page page-number ${p === currentPage ? 'active' : ''}`}
                            aria-current={p === currentPage ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    ))}

                    <button className="btn-page" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente ›</button>
                    <button className="btn-page" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>Último »</button>
                </div>
            </div>
        </div>
    );
};

export default TablaReportes;
