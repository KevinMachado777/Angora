import React, { useState } from 'react';
import '../styles/TablaReportes.css';

const TablaReportes = ({ encabezados, registros, tipoReporte }) => {
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
        if (typeof aValue === 'number' && typeof bValue === 'number') return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        return sortOrder === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    });

    const getValue = (item, header) => {
        switch (header) {
            case 'Id':
                return item.id || '-';
            case 'Cliente':
            case 'Proveedor':
            case 'Nombre':
            case 'Producto':
            case 'Materia':
                return item.entidad || item.nombre || '-';
            case 'Método Pago':
                return item.metodoPago || '-';
            case 'Fecha':
            case 'Fecha Movimiento':
                return item.fecha || '-';
            case 'Total':
                return item.total || 0;
            case 'Cantidad':
                return item.cantidad || 0;
            case 'Concepto':
                return item.concepto || '-';
            case 'Acción':
                return item.accion || '-';
            case 'Estado':
                return item.estado || '-';
            case 'Nº Compras':
                return item.compras || 0;
            default:
                return '-';
        }
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