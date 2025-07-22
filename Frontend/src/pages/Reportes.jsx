import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/reportes.css';
import TablaReportes from '../components/TablaReportes';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';

// Registrando componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const urlBackend = 'http://localhost:8080/angora/api/v1';

const Reportes = () => {
    const [tipoReporte, setTipoReporte] = useState('finanzas');
    const [filtroTipo, setFiltroTipo] = useState('ingresos');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [datos, setDatos] = useState([]);
    const [metricas, setMetricas] = useState({
        totalInventario: 0, // Solo para productos
        totalProductos: 0,
        totalMateriaPrima: 0,
    });
    const [financialMetrics, setFinancialMetrics] = useState({
        totalIngresos: 0,
        totalEgresos: 0,
        utilidad: 0,
    });

    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            let endpoint = '';
            const params = {};
            if (fechaInicio) params.fechaInicio = `${fechaInicio}T00:00:00`; // Formato ajustado
            if (fechaFin) params.fechaFin = `${fechaFin}T23:59:59`; // Formato ajustado

            switch (tipoReporte) {
                case 'finanzas':
                    endpoint = `/reportes/finanzas`;
                    params.tipo = filtroTipo === 'egresos' ? 'egresos' : 'ingresos';
                    break;
                case 'inventario':
                    endpoint = `/reportes/inventario`;
                    params.tipo = filtroTipo === 'materiaPrima' ? 'materiaPrima' : 'productos';
                    break;
                case 'usuarios':
                    endpoint = `/reportes/usuarios`;
                    params.tipo = filtroTipo === 'clientes' ? 'clientes' : 'personal';
                    break;
                default:
                    endpoint = '/reportes/finanzas';
            }

            try {
                const response = await axios.get(`${urlBackend}${endpoint}`, { params });
                const data = response.data || [];
                console.log('Datos recibidos:', data); // Depuración
                setDatos(data);

                // Fetch métricas financieras siempre
                const financialParams = { ...params };
                const [ingresosResp, egresosResp] = await Promise.all([
                    axios.get(`${urlBackend}/reportes/totalIngresos`, { params: financialParams }),
                    axios.get(`${urlBackend}/reportes/totalEgresos`, { params: financialParams })
                ]);
                const totalIngresos = ingresosResp.data || 0;
                const totalEgresos = egresosResp.data || 0;
                setFinancialMetrics({
                    totalIngresos,
                    totalEgresos,
                    utilidad: totalIngresos - totalEgresos,
                });

                // Fetch métricas de inventario (totalInventario solo para productos)
                if (tipoReporte === 'inventario') {
                    const inventarioParams = { ...params, tipo: 'productos' };
                    const [valorResp, prodResp, matResp] = await Promise.all([
                        axios.get(`${urlBackend}/reportes/valorInventario`, { params: inventarioParams }),
                        axios.get(`${urlBackend}/reportes/inventario?tipo=productos`, { params: financialParams }),
                        axios.get(`${urlBackend}/reportes/inventario?tipo=materiaPrima`, { params: financialParams })
                    ]);
                    setMetricas({
                        totalInventario: valorResp.data || 0, // Valor monetario de productos
                        totalProductos: filtroTipo === 'productos' ? data.length : prodResp.data.length,
                        totalMateriaPrima: filtroTipo === 'materiaPrima' ? data.length : matResp.data.length,
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [tipoReporte, filtroTipo, fechaInicio, fechaFin]);

    const limpiarFechas = () => {
        setFechaInicio('');
        setFechaFin('');
    };

    const renderizarEncabezados = () => {
        switch (tipoReporte) {
            case 'inventario':
                return filtroTipo === 'productos'
                    ? ['Id', 'Producto', 'Cantidad', 'Cantidad Actual', 'Concepto', 'Fecha Movimiento']
                    : ['Id', 'Materia Prima', 'Cantidad Pasada', 'Cantidad Actual', 'Concepto', 'Fecha Movimiento'];
            case 'finanzas':
                return filtroTipo === 'ingresos'
                    ? ['Id', 'Cliente', 'Método Pago', 'Fecha', 'Total']
                    : ['Id', 'Proveedor', 'Fecha', 'Total'];
            case 'usuarios':
                return filtroTipo === 'personal'
                    ? ['Id', 'Nombre', 'Acción', 'Fecha']
                    : ['Id', 'Cliente', 'Estado', 'Nº Compras', 'Ultima Compra'];
            default:
                return [];
        }
    };

    const renderizarTarjetas = () => {
        if (tipoReporte === 'inventario') {
            return (
                <div className="tarjetas-container">
                    <div className="tarjeta">
                        <h3>Valor Total Inventario (Productos)</h3>
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
                        <p>${financialMetrics.totalIngresos.toLocaleString()}</p>
                    </div>
                    <div className="tarjeta">
                        <h3>Total Egresos</h3>
                        <p>${financialMetrics.totalEgresos.toLocaleString()}</p>
                    </div>
                    <div className="tarjeta">
                        <h3>Utilidad</h3>
                        <p>${financialMetrics.utilidad.toLocaleString()}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderizarGraficos = () => {
        if (!datos.length) return null;

        const barData = {
            labels: datos.map(item => item.producto || item.materiaPrima || item.cliente || item.proveedor || item.nombre || 'Sin Nombre'),
            datasets: [
                {
                    label: tipoReporte === 'inventario' 
                    ? 'Cantidad Actual' 
                    : tipoReporte === 'finanzas' 
                    ? 'Total'
                    : 'Acciones',
                    data: datos.map(item => item.cantidadActual || item.total || item.cantidad || 0),
                    backgroundColor: 'rgba(0, 80, 120, 0.8)',
                    borderColor: 'rgba(0, 120, 180, 1)',
                    borderWidth: 1,
                },
            ],
        };

        const pieData = {
            labels: datos.map(item => item.producto || item.materiaPrima || item.cliente || item.proveedor || item.nombre || 'Sin Nombre'),
            datasets: [
                {
                    data: datos.map(item => item.cantidadActual || item.total || item.cantidad || 1),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderColor: '#fff',
                    borderWidth: 1,
                },
            ],
        };

        const lineData = tipoReporte === 'finanzas' ? {
            labels: datos.map(item => item.fecha || 'Sin Fecha'),
            datasets: [
                {
                    label: filtroTipo === 'ingresos' ? 'Ingresos' : 'Egresos',
                    data: datos.map(item => item.total || 0),
                    borderColor: 'rgba(0, 120, 180, 1)',
                    backgroundColor: 'rgba(0, 80, 120, 0.5)',
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        } : null;

        return (
            <div className="graficos-container">
                <div className="grafico-item">
                    <div className="chart-container bar">
                        <Bar
                            ref={chartRef}
                            data={barData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'top', labels: { color: '#fff' } },
                                    title: { display: true, text: barData.datasets[0].label, color: '#fff' },
                                },
                                animation: { duration: 1000, easing: 'easeOutQuad' },
                                scales: {
                                    y: { ticks: { color: '#fff' } },
                                    x: { ticks: { color: '#fff', maxRotation: 45, minRotation: 45 } },
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
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'right', labels: { color: '#fff' } },
                                    title: { display: true, text: 'Proporción', color: '#fff' },
                                },
                                animation: { duration: 1000, easing: 'easeOutQuad' },
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
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top', labels: { color: '#fff' } },
                                        title: { display: true, text: lineData.datasets[0].label, color: '#fff' },
                                    },
                                    animation: { duration: 1000, easing: 'easeOutQuad' },
                                    scales: {
                                        y: { ticks: { color: '#fff' } },
                                        x: { ticks: { color: '#fff' } },
                                    },
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const exportarAExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(datos.map(item => ({
            ...item,
            ValorTotal: item.cantidadActual || item.total || item.cantidad || 0
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        XLSX.writeFile(workbook, 'reporte.xlsx');
    };

    return (
        <div className="reportes-container">
            <button className="btn-exportar-reporte" style={{ left: '20px' }} onClick={exportarAExcel}>
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
                            <input
                                type="radio"
                                name="filtroInventario"
                                value="productos"
                                checked={filtroTipo === 'productos'}
                                onChange={() => setFiltroTipo('productos')}
                            />
                            Productos
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="filtroInventario"
                                value="materiaPrima"
                                checked={filtroTipo === 'materiaPrima'}
                                onChange={() => setFiltroTipo('materiaPrima')}
                            />
                            Materia Prima
                        </label>
                        <button className="btn-guardar" onClick={limpiarFechas}>Limpiar fechas</button>
                    </div>
                )}
                {tipoReporte === 'finanzas' && (
                    <div className="radio-botones">
                        <label>
                            <input
                                type="radio"
                                name="filtroFinanzas"
                                value="ingresos"
                                checked={filtroTipo === 'ingresos'}
                                onChange={() => setFiltroTipo('ingresos')}
                            />
                            Ingresos
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="filtroFinanzas"
                                value="egresos"
                                checked={filtroTipo === 'egresos'}
                                onChange={() => setFiltroTipo('egresos')}
                            />
                            Egresos
                        </label>
                        <button className="btn-guardar" onClick={limpiarFechas}>Limpiar fechas</button>
                    </div>
                )}
                {tipoReporte === 'usuarios' && (
                    <div className="radio-botones">
                        <label>
                            <input
                                type="radio"
                                name="filtroUsuarios"
                                value="personal"
                                checked={filtroTipo === 'personal'}
                                onChange={() => setFiltroTipo('personal')}
                            />
                            Personal
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="filtroUsuarios"
                                value="clientes"
                                checked={filtroTipo === 'clientes'}
                                onChange={() => setFiltroTipo('clientes')}
                            />
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
                {renderizarGraficos()}
            </div>
        </div>
    );
};

export default Reportes;