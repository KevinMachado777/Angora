import React, { useState, useEffect, useRef } from 'react';
import '../styles/reportes.css';
import TablaReportes from '../components/TablaReportes';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';

// Registrando componentes de ChartJS para habilitar la renderización de gráficos variados
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const Reportes = () => {
    // Inicializando variables de estado para gestionar el tipo de reporte, tipo de filtro, rangos de fechas, datos y métricas acumuladas
    const [tipoReporte, setTipoReporte] = useState('inventario');
    const [filtroTipo, setFiltroTipo] = useState('productos');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [datos, setDatos] = useState([]);
    const [metricas, setMetricas] = useState({
        totalInventario: 0,
        totalProductos: 0,
        totalMateriaPrima: 0,
        totalIngresos: 0,
        totalEgresos: 0,
        utilidad: 0,
    });

    // Creando una referencia para los elementos de los gráficos, permitiendo manipularlos dinámicamente
    const chartRef = useRef(null);

    // Definiendo una estructura de datos mock que contiene información simulada para inventario, finanzas y usuarios
    const datosMock = {
        inventario: {
            productos: [
                { id: 1, producto: 'Lava Manos', cantidad: 2, concepto: 'Salida', fechaMovimiento: '2025-07-01' },
                { id: 2, producto: 'Jabón Líquido', cantidad: 5, concepto: 'Entrada', fechaMovimiento: '2025-07-02' },
            ],
            materiaPrima: [
                { id: 1, materia: 'Base Jabón', cantidad: 10, concepto: 'Entrada', fechaMovimiento: '2025-07-01' },
                { id: 2, materia: 'Esencia Floral', cantidad: 3, concepto: 'Salida', fechaMovimiento: '2025-07-02' },
            ],
        },
        finanzas: {
            ingresos: [
                { id: 1, cliente: 'Sin cliente', metodoPago: 'Efectivo', fecha: '2025-07-01', total: 82400 },
                { id: 2, cliente: 'Kevin', metodoPago: 'Crédito', fecha: '2025-07-02', total: 25000 },
            ],
            egresos: [
                { id: 1, proveedor: 'Industrias S.A.S', fecha: '2025-07-01', total: 25000 },
                { id: 2, proveedor: 'Postobon', fecha: '2025-07-02', total: 15000 },
            ],
        },
        usuarios: {
            personal: [
                { id: 1, nombre: 'John', acción: 'Inicio de sesión', fecha: '2025-07-01T10:00' },
                { id: 2, nombre: 'Kevin', acción: 'Venta realizada', fecha: '2025-07-01T12:00' },
            ],
            clientes: [
                { id: 1, cliente: 'Johan', estado: 'Activo', nCompras: '4'},
                { id: 2, cliente: 'Samuel', estado: 'Inactivo', nCompras: '7'},
            ],
        },
    };

    // Calculando métricas totales al cambiar el tipo de reporte o al cargar la página por primera vez
    useEffect(() => {
        let nuevasMetricas = {
            totalInventario: 0,
            totalProductos: 0,
            totalMateriaPrima: 0,
            totalIngresos: 0,
            totalEgresos: 0,
            utilidad: 0,
        };
        if (tipoReporte === 'inventario') {
            nuevasMetricas.totalInventario = datosMock.inventario.productos.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
            nuevasMetricas.totalProductos = datosMock.inventario.productos.length;
            nuevasMetricas.totalMateriaPrima = datosMock.inventario.materiaPrima.length;
        } else if (tipoReporte === 'finanzas') {
            nuevasMetricas.totalIngresos = datosMock.finanzas.ingresos.reduce((sum, item) => sum + item.total, 0);
            nuevasMetricas.totalEgresos = datosMock.finanzas.egresos.reduce((sum, item) => sum + item.total, 0);
            nuevasMetricas.utilidad = nuevasMetricas.totalIngresos - nuevasMetricas.totalEgresos;
        }
        setMetricas(nuevasMetricas);
    }, [tipoReporte]);

    // Actualizando datos filtrados al cambiar el tipo de filtro, los rangos de fechas o ambos
    useEffect(() => {
        const datosPorDefecto = tipoReporte === 'inventario' ? datosMock.inventario[filtroTipo] :
            tipoReporte === 'finanzas' ? datosMock.finanzas[filtroTipo] :
                datosMock.usuarios[filtroTipo];
        let nuevosDatos = [...datosPorDefecto];
        if (fechaInicio && fechaFin) {
            nuevosDatos = datosPorDefecto.filter(item => {
                const itemDate = new Date(item.fecha || '2025-07-19').toISOString().split('T')[0];
                return itemDate >= fechaInicio && itemDate <= fechaFin;
            });
        }
        setDatos(nuevosDatos);
    }, [tipoReporte, filtroTipo, fechaInicio, fechaFin]);

    // Limpiando filtros de fechas para restablecerlos a su estado inicial sin restricciones
    const limpiarFechas = () => {
        setFechaInicio('');
        setFechaFin('');
    };

    // Renderizando encabezados de la tabla según el tipo de reporte y filtro seleccionado
    const renderizarEncabezados = () => {
        switch (tipoReporte) {
            case 'inventario':
                return filtroTipo === 'productos'
                    ? ['Id', 'Producto', 'Cantidad', 'Concepto', 'Fecha Movimiento']
                    : ['Id', 'Materia', 'Cantidad', 'Concepto', 'Fecha Movimiento'];
            case 'finanzas':
                return filtroTipo === 'ingresos'
                    ? ['Id', 'Cliente', 'Metodo Pago', 'Fecha', 'Total']
                    : ['Id', 'Proveedor', 'Fecha', 'Total'];
            case 'usuarios':
                return filtroTipo === 'personal'
                    ? ['Id', 'Nombre', 'Acción', 'Fecha']
                    : ['Id', 'Cliente', 'Estado', 'N Compras'];
            default:
                return [];
        }
    };

    // Renderizando tarjetas de métricas según el tipo de reporte activo
    const renderizarTarjetas = () => {
        if (tipoReporte === 'inventario') {
            return (
                <div className="tarjetas-container">
                    <div className="tarjeta">
                        <h3>Valor Total Inventario</h3>
                        <p>${metricas.totalInventario.toLocaleString()}</p>
                    </div>
                    <div className="tarjeta">
                        <h3>Cantidad Total Productos</h3>
                        <p>{metricas.totalProductos}</p>
                    </div>
                    <div className="tarjeta">
                        <h3>Cantidad Total Materia Prima</h3>
                        <p>{metricas.totalMateriaPrima}</p>
                    </div>
                </div>
            );
        } else if (tipoReporte === 'finanzas') {
            return (
                <div className="tarjetas-container">
                    <div className="tarjeta">
                        <h3>Total Ingresos</h3>
                        <p>${metricas.totalIngresos.toLocaleString()}</p>
                    </div>
                    <div className="tarjeta">
                        <h3>Total Egresos</h3>
                        <p>${metricas.totalEgresos.toLocaleString()}</p>
                    </div>
                    <div className="tarjeta">
                        <h3>Utilidad</h3>
                        <p>${metricas.utilidad.toLocaleString()}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Renderizando gráficos basados en los datos filtrados, incluyendo barras, pastel y líneas según el contexto
    const renderizarGraficos = () => {
        // Verificando si hay datos para evitar renderizar gráficos vacíos
        if (!datos.length) return null;

        // Preparando datos para el gráfico de barras, extrayendo etiquetas y valores según el tipo de reporte
        const barData = {
            labels: datos.map(item => item.nombre || item.concepto || item.usuario),
            datasets: [
                {
                    label: tipoReporte === 'inventario' ? 'Cantidad' : tipoReporte === 'finanzas' ? 'Total' : 'Acciones',
                    data: datos.map(item => item.cantidad || item.total || 1),
                    backgroundColor: 'rgba(0, 80, 120, 0.8)', // Estableciendo color de fondo con transparencia
                    borderColor: 'rgba(0, 120, 180, 1)', // Definiendo color del borde
                    borderWidth: 1, // Configurando grosor del borde
                },
            ],
        };

        // Preparando datos para el gráfico de pastel, reutilizando etiquetas y ajustando colores
        const pieData = {
            labels: datos.map(item => item.nombre || item.concepto || item.usuario),
            datasets: [
                {
                    data: datos.map(item => item.cantidad || item.total || 1),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'], // Asignando colores variados para cada sección
                    borderColor: '#fff', // Estableciendo borde blanco
                    borderWidth: 1, // Configurando grosor del borde
                },
            ],
        };

        // Preparando datos para el gráfico de líneas, disponible solo para finanzas con etiquetas de fecha
        const lineData = tipoReporte === 'finanzas' ? {
            labels: datos.map(item => item.fecha),
            datasets: [
                {
                    label: filtroTipo === 'ingresos' ? 'Ingresos' : 'Egresos', // Determinando la etiqueta según el filtro
                    data: datos.map(item => item.total), 
                    borderColor: 'rgba(0, 120, 180, 1)', // Definiendo color de la línea
                    backgroundColor: 'rgba(0, 80, 120, 0.5)', // Estableciendo color de relleno con transparencia
                    fill: true, // Habilitando relleno bajo la línea
                    pointRadius: 5, // Configurando tamaño de los puntos
                    pointHoverRadius: 7, // Ajustando tamaño de puntos al pasar el mouse
                },
            ],
        } : null;

        // Retornando un contenedor con los tres tipos de gráficos, rindiendo solo los aplicables
        return (
            <div className="graficos-container">
                <div className="grafico-item">
                    <div className="chart-container bar">
                        <Bar
                            ref={chartRef}
                            data={barData}
                            options={{
                                responsive: true, // Asegurando que el gráfico se adapte al tamaño de la pantalla
                                maintainAspectRatio: false, // Permitiendo control manual del aspecto
                                plugins: {
                                    legend: { position: 'top', labels: { color: '#fff' } }, // Colocando la leyenda en la parte superior con texto blanco
                                    title: { display: true, text: barData.datasets[0].label, color: '#fff' }, // Mostrando título dinámico en blanco
                                },
                                animation: { duration: 1000, easing: 'easeOutQuad' }, // Aplicando animación suave de 1 segundo
                                scales: { 
                                    y: { ticks: { color: '#fff' } }, // Configurando color de las etiquetas del eje Y
                                    x: { ticks: { color: '#fff', maxRotation: 45, minRotation: 45 } }, // Ajustando rotación de etiquetas del eje X
                                },
                            }}
                        />
                    </div>
                </div>
                <div className="grafico-item">
                    <div className="chart-container">
                        <Pie
                            data={pieData}
                            options={{
                                responsive: true, // Asegurando adaptabilidad al tamaño de la pantalla
                                maintainAspectRatio: false, // Permitiendo ajuste manual del aspecto
                                plugins: {
                                    legend: { position: 'right', labels: { color: '#fff' } }, // Colocando leyenda a la derecha con texto blanco
                                    title: { display: true, text: 'Proporción', color: '#fff' }, // Mostrando título fijo en blanco
                                },
                                animation: { duration: 1000, easing: 'easeOutQuad' }, // Aplicando animación suave de 1 segundo
                            }}
                        />
                    </div>
                </div>
                {lineData && (
                    <div className="grafico-item">
                        <div className="chart-container">
                            <Line
                                ref={chartRef}
                                data={lineData}
                                options={{
                                    responsive: true, // Asegurando adaptabilidad al tamaño de la pantalla
                                    maintainAspectRatio: false, // Permitiendo ajuste manual del aspecto
                                    plugins: {
                                        legend: { position: 'top', labels: { color: '#fff' } }, // Colocando leyenda en la parte superior con texto blanco
                                        title: { display: true, text: lineData.datasets[0].label, color: '#fff' }, // Mostrando título dinámico en blanco
                                    },
                                    animation: { duration: 1000, easing: 'easeOutQuad' }, // Aplicando animación suave de 1 segundo
                                    scales: { 
                                        y: { ticks: { color: '#fff' } }, // Configurando color de las etiquetas del eje Y
                                        x: { ticks: { color: '#fff' } }, // Configurando color de las etiquetas del eje X
                                    },
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Exportando datos a un archivo Excel, transformando y organizando la información
    const exportarAExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(datos.map(item => ({ ...item, ValorTotal: item.cantidad * (item.precioUnitario || item.costoUnitario) || item.total })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        XLSX.writeFile(workbook, 'reporte.xlsx');
    };

    return (
        <div className="reportes-container">
            <button className="btn-exportar" style={{ left: '20px' }} onClick={exportarAExcel}>
                <FontAwesomeIcon icon={faFileExcel} /> Exportar
            </button>
            <div className="pestanas-reporte">
                <button className={tipoReporte === 'inventario' ? 'btn-opciones pestana-activa' : 'btn-opciones'} onClick={() => { setTipoReporte('inventario'); setFiltroTipo('productos'); }}>
                    Inventario
                </button>
                <button className={tipoReporte === 'finanzas' ? 'btn-opciones pestana-activa' : 'btn-opciones'} onClick={() => { setTipoReporte('finanzas'); setFiltroTipo('ingresos'); }}>
                    Finanzas
                </button>
                <button className={tipoReporte === 'usuarios' ? 'btn-opciones pestana-activa' : 'btn-opciones'} onClick={() => { setTipoReporte('usuarios'); setFiltroTipo('personal'); }}>
                    Usuarios
                </button>
            </div>
            <div className="filtros-reporte">
                <div className="filtro-fecha">
                    <label>Fecha Inicio</label>
                    <div className="input-icono">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                    </div>
                </div>
                <div className="filtro-fecha">
                    <label>Fecha Fin</label>
                    <div className="input-icono">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                    </div>
                </div>
                {tipoReporte === 'inventario' && (
                    <div className="radio-botones">
                        <label>
                            <input type="radio" name="filtroInventario" value="productos" checked={filtroTipo === 'productos'} onChange={() => setFiltroTipo('productos')} defaultChecked />
                            Productos
                        </label>
                        <label>
                            <input type="radio" name="filtroInventario" value="materiaPrima" checked={filtroTipo === 'materiaPrima'} onChange={() => setFiltroTipo('materiaPrima')} />
                            Materia Prima
                        </label>
                        <button className="btn-guardar" onClick={limpiarFechas}>Limpiar fechas</button>
                    </div>
                )}
                {tipoReporte === 'finanzas' && (
                    <div className="radio-botones">
                        <label>
                            <input type="radio" name="filtroFinanzas" value="ingresos" checked={filtroTipo === 'ingresos'} onChange={() => setFiltroTipo('ingresos')} defaultChecked />
                            Ingresos
                        </label>
                        <label>
                            <input type="radio" name="filtroFinanzas" value="egresos" checked={filtroTipo === 'egresos'} onChange={() => setFiltroTipo('egresos')} />
                            Egresos
                        </label>
                        <button className="btn-guardar" onClick={limpiarFechas}>Limpiar fechas</button>
                    </div>
                )}
                {tipoReporte === 'usuarios' && (
                    <div className="radio-botones">
                        <label>
                            <input type="radio" name="filtroUsuarios" value="personal" checked={filtroTipo === 'personal'} onChange={() => setFiltroTipo('personal')} defaultChecked />
                            Personal
                        </label>
                        <label>
                            <input type="radio" name="filtroUsuarios" value="clientes" checked={filtroTipo === 'clientes'} onChange={() => setFiltroTipo('clientes')} />
                            Clientes
                        </label>
                        <button className="btn-guardar" onClick={limpiarFechas}>Limpiar fechas</button>
                    </div>
                )}
            </div>
            <div className="contenido-reporte">
                <div className="tabla-container">
                    <TablaReportes encabezados={renderizarEncabezados()} registros={datos} tipoReporte={filtroTipo} />
                </div>
                {renderizarTarjetas()}
            </div>
            {renderizarGraficos()}
        </div>
    );
};

export default Reportes;