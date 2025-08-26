import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosInstance';
import '../styles/reportes.css';
import TablaReportes from '../components/TablaReportes';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';

// Registrando componentes de ChartJS
// IMPORTANT: añadimos Filler para evitar la advertencia "Tried to use the 'fill' option without the 'Filler' plugin enabled"
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const urlBackend = 'http://localhost:8080/angora/api/v1';

const Reportes = () => {
    const [tipoReporte, setTipoReporte] = useState('finanzas');
    const [filtroTipo, setFiltroTipo] = useState('ingresos');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [datos, setDatos] = useState([]);
    const [metricas, setMetricas] = useState({
        totalInventario: 0,
        totalProductos: 0,
        totalMateriaPrima: 0,
    });
    const [financialMetrics, setFinancialMetrics] = useState({
        totalIngresos: 0,
        totalEgresos: 0,
        utilidad: 0,
    });

    // Refs para cada chart y para el contenedor general de gráficos
    const barRef = useRef(null);
    const pieRef = useRef(null);
    const lineRef = useRef(null);
    const chartsContainerRef = useRef(null);

    // estado del tamaño del contenedor para forzar remount cuando cambia (soluciona problemas con DevTools device toolbar)
    const [chartsContainerSize, setChartsContainerSize] = useState({ width: 0, height: 0 });

    // Normaliza/transforma las distintas respuestas del backend
    const normalizeResponse = (raw, tipoReporte, filtroTipo) => {
        if (!Array.isArray(raw)) return [];

        if (tipoReporte === 'inventario') {
            // backend devuelve ReporteMovimientoDTO: { id, nombre, cantidadPasada, cantidadActual, tipoMovimiento, fechaMovimiento, productoId, materiaPrimaId }
            return raw
                .map(m => ({
                    id: m.id ?? m.idMovimiento ?? m.id_movimiento,
                    // El DTO ya expone "nombre" (producto o materia), pero si no está, intentar otros campos
                    nombre: m.nombre ?? m.producto ?? m.materiaPrima ?? m.productoNombre ?? m.materiaPrimaNombre ?? 'Sin Nombre',
                    cantidadPasada: m.cantidadPasada ?? m.cantidad_pasada ?? null,
                    cantidadActual: m.cantidadActual ?? m.cantidad_actual ?? null,
                    tipoMovimiento: m.tipoMovimiento ?? m.tipo_movimiento ?? m.tipo ?? '',
                    fechaMovimiento: m.fechaMovimiento ?? m.fecha_movimiento ?? m.fecha ?? null,
                    productoId: m.productoId ?? m.producto_id ?? null,
                    materiaPrimaId: m.materiaPrimaId ?? m.materia_prima_id ?? null,
                }))
                // si el usuario aplica filtro (productos/materiaPrima), filtramos aquí por ids
                .filter(item => {
                    if (filtroTipo === 'productos') return item.productoId !== null && item.productoId !== undefined;
                    if (filtroTipo === 'materiaPrima') return item.materiaPrimaId !== null && item.materiaPrimaId !== undefined;
                    return true;
                });
        }

        if (tipoReporte === 'finanzas') {
            if (filtroTipo === 'ingresos') {
                // ReporteIngresosDTO: { id, cliente, metodoPago, fecha, total }
                return raw.map(r => ({
                    id: r.id ?? r.idFactura ?? null,
                    cliente: r.cliente ?? r.nombreCliente ?? 'Sin cliente',
                    metodoPago: r.metodoPago ?? r.metodoPago ?? '',
                    fecha: r.fecha ?? r.fechaFactura ?? null,
                    total: r.total ?? 0,
                }));
            } else {
                // egresos -> ReporteEgresosDTO: { id, proveedor, fecha, total }
                return raw.map(r => ({
                    id: r.id ?? r.idOrden ?? null,
                    proveedor: r.proveedor ?? r.nombreProveedor ?? 'Sin proveedor',
                    fecha: r.fecha ?? r.fechaOrden ?? null,
                    total: r.total ?? 0,
                }));
            }
        }

        if (tipoReporte === 'usuarios') {
            if (filtroTipo === 'personal') {
                // ReportePersonalDTO: { id, nombre, accion, fecha }
                return raw.map(r => ({
                    id: r.id ?? r.idUsuario ?? null,
                    nombre: r.nombre ?? 'Sin nombre',
                    accion: r.accion ?? r.accionUsuario ?? '',
                    fecha: r.fecha ?? null,
                }));
            } else {
                // clientes -> ReporteClientesDTO: { id, nombre, estado, numeroCompras, ultimoCompra }
                return raw.map(r => ({
                    id: r.id ?? r.idCliente ?? null,
                    nombre: r.nombre ?? 'Sin nombre',
                    estado: r.estado ?? '',
                    numeroCompras: r.numeroCompras ?? r.numero_compras ?? 0,
                    ultimoCompra: r.ultimoCompra ?? r.ultima_compra ?? null,
                }));
            }
        }

        // fallback: devolver lo que venga (para seguridad)
        return raw;
    };

    useEffect(() => {
        const fetchData = async () => {
            let endpoint = '';
            const params = {};
            if (fechaInicio) params.fechaInicio = `${fechaInicio}T00:00:00`;
            if (fechaFin) params.fechaFin = `${fechaFin}T23:59:59`;

            switch (tipoReporte) {
                case 'finanzas':
                    endpoint = `/reportes/finanzas`;
                    params.tipo = filtroTipo === 'egresos' ? 'egresos' : 'ingresos';
                    break;
                case 'inventario':
                    endpoint = `/reportes/inventario`;
                    params.tipo = 'movimientos'; // Seguir usando "movimientos" como base
                    break;
                case 'usuarios':
                    endpoint = `/reportes/usuarios`;
                    params.tipo = filtroTipo === 'clientes' ? 'clientes' : 'personal';
                    break;
                default:
                    endpoint = '/reportes/finanzas';
            }

            try {
                const response = await api.get(`${urlBackend}${endpoint}`, { params });
                const rawData = response.data || [];
                console.log('Datos recibidos crudos:', rawData);

                // Normalizar según tipoReporte y filtro
                const normalized = normalizeResponse(rawData, tipoReporte, filtroTipo);
                setDatos(normalized);

                // Fetch métricas financieras
                const financialParams = { ...params };
                const [ingresosResp, egresosResp] = await Promise.all([
                    api.get(`${urlBackend}/reportes/totalIngresos`, { params: financialParams }),
                    api.get(`${urlBackend}/reportes/totalEgresos`, { params: financialParams }),
                ]);
                const totalIngresos = ingresosResp.data || 0;
                const totalEgresos = egresosResp.data || 0;
                setFinancialMetrics({
                    totalIngresos,
                    totalEgresos,
                    utilidad: totalIngresos - totalEgresos,
                });

                // Fetch métricas de inventario
                if (tipoReporte === 'inventario') {
                    const inventarioParams = { ...params, tipo: 'movimientos' };
                    const [valorResp, totalProdResp, totalMatResp] = await Promise.all([
                        api.get(`${urlBackend}/reportes/valorInventario`, { params: inventarioParams }),
                        api.get(`${urlBackend}/reportes/totalProductos`, { params: inventarioParams }),
                        api.get(`${urlBackend}/reportes/totalMateriaPrima`, { params: inventarioParams }),
                    ]);
                    setMetricas({
                        totalInventario: valorResp.data || 0,
                        totalProductos: totalProdResp.data || 0,
                        totalMateriaPrima: totalMatResp.data || 0,
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [tipoReporte, filtroTipo, fechaInicio, fechaFin]);

    // Cuando los datos cambian, forzamos un resize/update corto para los charts
    useEffect(() => {
        const triggerResize = () => {
            setTimeout(() => {
                try {
                    if (barRef.current && typeof barRef.current.resize === 'function') {
                        barRef.current.resize();
                        if (typeof barRef.current.update === 'function') barRef.current.update();
                    }
                    if (pieRef.current && typeof pieRef.current.resize === 'function') {
                        pieRef.current.resize();
                        if (typeof pieRef.current.update === 'function') pieRef.current.update();
                    }
                    if (lineRef.current && typeof lineRef.current.resize === 'function') {
                        lineRef.current.resize();
                        if (typeof lineRef.current.update === 'function') lineRef.current.update();
                    }
                } catch (err) {
                    console.warn('Error resizing charts after datos change:', err);
                }
            }, 80);
        };
        triggerResize();
    }, [datos, tipoReporte]);

    // Observador de tamaño + listeners para forzar resize cuando cambie el viewport (DevTools device toolbar problem)
    useEffect(() => {
        const resizeCharts = () => {
            // ligero delay para dejar estabilizar layout
            setTimeout(() => {
                try {
                    if (barRef.current && typeof barRef.current.resize === 'function') {
                        barRef.current.resize();
                        if (typeof barRef.current.update === 'function') barRef.current.update();
                    }
                    if (pieRef.current && typeof pieRef.current.resize === 'function') {
                        pieRef.current.resize();
                        if (typeof pieRef.current.update === 'function') pieRef.current.update();
                    }
                    if (lineRef.current && typeof lineRef.current.resize === 'function') {
                        lineRef.current.resize();
                        if (typeof lineRef.current.update === 'function') lineRef.current.update();
                    }
                } catch (err) {
                    console.warn('Error resizing charts:', err);
                }
            }, 60);
        };

        let ro;
        if (chartsContainerRef.current && window.ResizeObserver) {
            try {
                // Observador que además actualiza el estado con el tamaño del contenedor.
                ro = new ResizeObserver(() => {
                    // actualizar tamaño del contenedor para forzar remount si cambia
                    try {
                        const el = chartsContainerRef.current;
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            // redondear para evitar cambios muy pequeños que disparen remounts innecesarios
                            const next = { width: Math.round(rect.width), height: Math.round(rect.height) };
                            setChartsContainerSize(prev => {
                                if (prev.width === next.width && prev.height === next.height) return prev;
                                return next;
                            });
                        }
                    } catch (err) {
                        console.warn('Error leyendo tamaño del contenedor:', err);
                    }
                    resizeCharts();
                });
                ro.observe(chartsContainerRef.current);
            } catch (e) {
                console.warn('ResizeObserver falló, usando window resize fallback', e);
            }
        }

        // listeners complementarios (focus/visibility) porque DevTools a veces cambia visibilidad/layout
        window.addEventListener('resize', resizeCharts);
        window.addEventListener('orientationchange', resizeCharts);
        window.addEventListener('focus', resizeCharts);
        document.addEventListener('visibilitychange', resizeCharts);
        // fallback adicional: escucha cambios en la ventana para devtools toggles extremos
        window.addEventListener('mousemove', resizeCharts);

        return () => {
            if (ro && chartsContainerRef.current) {
                try { ro.unobserve(chartsContainerRef.current); } catch (e) { /* ignore */ }
            }
            window.removeEventListener('resize', resizeCharts);
            window.removeEventListener('orientationchange', resizeCharts);
            window.removeEventListener('focus', resizeCharts);
            document.removeEventListener('visibilitychange', resizeCharts);
            window.removeEventListener('mousemove', resizeCharts);
        };
    }, []); // solo al montar

    const limpiarFechas = () => {
        setFechaInicio('');
        setFechaFin('');
    };

    const renderizarEncabezados = () => {
        switch (tipoReporte) {
            case 'inventario':
                return filtroTipo === 'productos'
                    ? ['Id', 'Producto', 'Cantidad Pasada', 'Movimiento', 'Cantidad Actual', 'Concepto', 'Fecha Movimiento']
                    : ['Id', 'Materia Prima', 'Cantidad Pasada', 'Movimiento', 'Cantidad Actual', 'Concepto', 'Fecha Movimiento'];
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
                        <p>{metricas.totalProductos.toLocaleString()}</p>
                    </div>
                    <div className="tarjeta">
                        <h3>Cantidad Total Materia Prima</h3>
                        <p>{metricas.totalMateriaPrima.toLocaleString()}</p>
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

        // Labels: tratar de obtener un "nombre" visible (nombre, cliente, proveedor, producto, materiaPrima)
        const labels = datos.map(item =>
            item.nombre ?? item.cliente ?? item.proveedor ?? item.producto ?? item.materiaPrima ?? 'Sin Nombre'
        );

        const values = datos.map(item => {
            // prioridad: cantidadActual (movimientos), total (finanzas), cantidad (prod/mat)
            return item.cantidadActual ?? item.total ?? item.cantidad ?? item.cantidadActual ?? 0;
        });

        const barData = {
            labels,
            datasets: [
                {
                    label: tipoReporte === 'inventario'
                        ? 'Cantidad Actual'
                        : tipoReporte === 'finanzas'
                            ? 'Total'
                            : 'Acciones',
                    data: values,
                    backgroundColor: 'rgba(0, 80, 120, 0.8)',
                    borderColor: 'rgba(0, 120, 180, 1)',
                    borderWidth: 1,
                },
            ],
        };

        const pieData = {
            labels,
            datasets: [
                {
                    data: values.map(v => v || 1),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderColor: '#fff',
                    borderWidth: 1,
                },
            ],
        };

        const lineData = tipoReporte === 'finanzas' ? {
            labels: datos.map(item => (item.fecha ? item.fecha : item.fechaMovimiento ? item.fechaMovimiento : 'Sin Fecha')),
            datasets: [
                {
                    label: filtroTipo === 'ingresos' ? 'Ingresos' : 'Egresos',
                    data: datos.map(item => item.total ?? 0),
                    borderColor: 'rgba(0, 120, 180, 1)',
                    backgroundColor: 'rgba(0, 80, 120, 0.5)',
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        } : null;

        // clave para forzar remount si el contenedor cambia (evita que canvas quede en mal estado tras toggles DevTools)
        const chartKeyBase = `${tipoReporte}-${filtroTipo}-${datos.length}-${chartsContainerSize.width}-${chartsContainerSize.height}`;

        return (
            <div className="graficos-container" ref={chartsContainerRef}>
                <div className="grafico-item">
                    <div className="chart-container bar" style={{ minHeight: 220 }}>
                        <Bar
                            key={`${chartKeyBase}-bar`}
                            ref={barRef}
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
                    <div className="chart-container" style={{ minHeight: 220 }}>
                        <Pie
                            key={`${chartKeyBase}-pie`}
                            ref={pieRef}
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
                        <div className="chart-container" style={{ minHeight: 220 }}>
                            <Line
                                key={`${chartKeyBase}-line`}
                                ref={lineRef}
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
            ValorTotal: item.cantidadActual ?? item.total ?? item.cantidad ?? 0
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        XLSX.writeFile(workbook, 'reporte.xlsx');
    };

    const getMapeo = () => {
        switch (tipoReporte) {
            case 'inventario':
                return filtroTipo === 'productos'
                    ? {
                        'Id': 'id',
                        'Producto': 'nombre',
                        'Cantidad Pasada': 'cantidadPasada',
                        'Movimiento': 'movimiento', // Campo calculado
                        'Cantidad Actual': 'cantidadActual',
                        'Concepto': 'tipoMovimiento',
                        'Fecha Movimiento': 'fechaMovimiento',
                    }
                    : {
                        'Id': 'id',
                        'Materia Prima': 'nombre',
                        'Cantidad Pasada': 'cantidadPasada',
                        'Movimiento': 'movimiento', // Campo calculado
                        'Cantidad Actual': 'cantidadActual',
                        'Concepto': 'tipoMovimiento',
                        'Fecha Movimiento': 'fechaMovimiento',
                    };
            case 'finanzas':
                return filtroTipo === 'ingresos'
                    ? {
                        'Id': 'id',
                        'Cliente': 'cliente',
                        'Método Pago': 'metodoPago',
                        'Fecha': 'fecha',
                        'Total': 'total',
                    }
                    : {
                        'Id': 'id',
                        'Proveedor': 'proveedor',
                        'Fecha': 'fecha',
                        'Total': 'total',
                    };
            case 'usuarios':
                return filtroTipo === 'personal'
                    ? {
                        'Id': 'id',
                        'Nombre': 'nombre',
                        'Acción': 'accion',
                        'Fecha': 'fecha',
                    }
                    : {
                        'Id': 'id',
                        'Cliente': 'nombre',
                        'Estado': 'estado',
                        'Nº Compras': 'numeroCompras',
                        'Ultima Compra': 'ultimoCompra',
                    };
            default:
                return {};
        }
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
                    <TablaReportes
                        encabezados={renderizarEncabezados()}
                        registros={datos}
                        mapeo={getMapeo()}
                    />
                </div>
                {renderizarTarjetas()}
                {renderizarGraficos()}
            </div>
        </div>
    );
};

export default Reportes;
