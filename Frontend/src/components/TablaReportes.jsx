import React, { useState } from 'react';
import '../styles/TablaReportes.css';

const TablaReportes = ({ encabezados, registros, mapeo }) => {
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');

    const handleSort = (columna) => {
        const newOrder = sortField === columna && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(columna);
        setSortOrder(newOrder);
    };

    const sortedRegistros = [...registros].sort((a, b) => {
        if (!sortField) return 0;
        const aValue = getValue(a, sortField);
        const bValue = getValue(b, sortField);
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return sortOrder === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    });

    const getValue = (item, header) => {
        const key = mapeo[header];
        if (!key) return '-'; // Si no hay mapeo, devuelve "-"

        let value = item[key];
        if (value === undefined || value === null) return '-';

        // Formatear fechas si corresponde
        if (header === 'Fecha' || header === 'Fecha Movimiento' || header === 'Ultima Compra') {
            return new Date(value).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        }

        // Convertir a número si es numérico (Total, Cantidad, Nº Compras)
        if (header === 'Total' || header === 'Cantidad' || header === 'Cantidad Pasada' || header === 'Cantidad Actual' || header === 'Nº Compras') {
            const numValue = Number(value);
            return isNaN(numValue) ? '-' : numValue;
        }

        return String(value); // Para strings como Nombre, Cliente, etc.
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
                    {sortedRegistros.length > 0 ? (
                        sortedRegistros.map((registro, index) => (
                            <tr key={index}>
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
        </div>
    );
};

export default TablaReportes;