import React, { useState, useEffect } from 'react';
import '../styles/tablaReportes.css';

const TablaReportes = ({ encabezados, registros, mapeo }) => {
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    function getValue(item, header) {
        if (!item) return '-';

        const key = mapeo[header];
        if (!key) return '-';

        let value = item[key];

        if (header === 'Abonos') {
            if (item.metodoPago === 'Efectivo') {
                return 'N/A';
            }
            return typeof value === 'number' ? `$${Math.round(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0';
        }

        if (header === 'Subtotal' || header === 'Total Factura' || header === 'Total') {
            return typeof value === 'number' ? `$${Math.round(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0';
        }

        if (header === 'IVA') {
            return typeof value === 'number' && !isNaN(value) ? `${Math.round(value)}%` : '0%';
        }

        if (header === 'Fecha' || header === 'Fecha Movimiento' || header === 'Ultima Compra') {
            if (value) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleString('es-CO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    });
                }
            }
            return value || '-';
        }

        if (header === 'Movimiento') {
            const cantidadPasada = item.cantidadPasada;
            const cantidadActual = item.cantidadActual;
            if (cantidadPasada == null || cantidadActual == null) return '-';
            const diferencia = Math.abs(cantidadActual - cantidadPasada);
            return diferencia;
        }

        return value || '-';
    }

    const handleSort = (columna) => {
        const newOrder = sortField === columna && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(columna);
        setSortOrder(newOrder);
        setCurrentPage(1);
    };

    const sortedRegistros = [...registros].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = getValue(a, sortField);
        const bValue = getValue(b, sortField);

        if (aValue === '-' && bValue === '-') return 0;
        if (aValue === '-') return 1;
        if (bValue === '-') return -1;

        if (sortField === 'Subtotal' || sortField === 'Total Factura' || sortField === 'Total') {
            const aNum = aValue === '-' ? 0 : parseFloat(aValue.replace('$', '').replace(/\./g, ''));
            const bNum = bValue === '-' ? 0 : parseFloat(bValue.replace('$', '').replace(/\./g, ''));
            return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (sortField === 'Abonos') {
            if (aValue === 'N/A' && bValue === 'N/A') return 0;
            if (aValue === 'N/A') return 1;
            if (bValue === 'N/A') return -1;
            const aNum = parseFloat(aValue.replace('$', '').replace(/\./g, ''));
            const bNum = parseFloat(bValue.replace('$', '').replace(/\./g, ''));
            return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (sortField === 'IVA') {
            const aNum = aValue === '-' ? 0 : parseFloat(aValue.replace('%', ''));
            const bNum = bValue === '-' ? 0 : parseFloat(bValue.replace('%', ''));
            return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }

        return sortOrder === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [registros]);

    const totalItems = sortedRegistros.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageItems = sortedRegistros.slice(startIndex, endIndex);

    const getPageNumbers = () => {
        const maxButtons = 7;
        const pages = [];

        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        let start = Math.max(1, currentPage - 3);
        let end = Math.min(totalPages, currentPage + 3);

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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