import React, { useState } from 'react';
import '../styles/TablaReportes.css';

const TablaReportes = ({ encabezados, registros, tipoReporte }) => {
    // Inicializando estado para gestionar el campo de ordenamiento y la dirección del mismo
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');

    // Manejo del evento de clic para ordenar columnas, alternando entre ascendente y descendente
    const handleSort = (columna) => {
        const newOrder = sortField === columna && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(columna);
        setSortOrder(newOrder);
    };

    // Ordenando los registros según el campo seleccionado y la dirección actual
    const sortedRegistros = [...registros].sort((a, b) => {
        if (!sortField) return 0; // Retornando 0 si no hay campo de ordenamiento
        const aValue = a[sortField.toLowerCase().replace(' ', '_')] || a[sortField.toLowerCase()];
        const bValue = b[sortField.toLowerCase().replace(' ', '_')] || b[sortField.toLowerCase()];
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1; // Ordenando ascendente o descendente
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0; // Manteniendo igualdad si los valores son idénticos
    });

    return (
        <div className="tabla-reportes-container">
            {(tipoReporte === 'materiaPrima' || tipoReporte === 'productos') && (
                <div className="tabla-leyenda">Stock bajo: Cantidad &lt; 5</div>
            )}
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
                        // Renderizando filas de registros si hay datos disponibles
                        sortedRegistros.map((registro, index) => (
                            <tr key={index} className={registro.cantidad < 5 ? 'alerta-stock' : ''}>
                                {encabezados.map((encabezado, i) => (
                                    <td key={i}>
                                        {encabezado === 'Valor Total' && registro.cantidad && (registro.precioUnitario || registro.costoUnitario)
                                            ? `$${(registro.cantidad * (registro.precioUnitario || registro.costoUnitario)).toLocaleString()}`
                                            : registro[
                                            encabezado
                                                .replace(/\s+/g, '')                     // quita todos los espacios
                                                .replace(/^./, c => c.toLowerCase())     // pone minúscula la primera letra
                                            ] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        // Mostrando mensaje de "No hay datos" si no hay registros para mostrar
                        <tr><td colSpan={encabezados.length}>No hay datos</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TablaReportes;