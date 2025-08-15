import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import dashboardService from "../service/dashboardService";
import "../styles/Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  // Estados para los datos del dashboard
  const [resumenDiario, setResumenDiario] = useState(null);
  const [tendencias, setTendencias] = useState([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [alertasInventario, setAlertasInventario] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [vistaActual, setVistaActual] = useState('diario'); // 'diario', 'semanal', 'mensual'

  // Cargar datos del dashboard
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar datos según la vista actual
      let resumen;
      if (vistaActual === 'diario') {
        resumen = await dashboardService.getResumenDiario(fechaSeleccionada);
        const metricas = await dashboardService.getMetricasFinancieras(fechaSeleccionada);
        setMetricas(metricas);
      } else if (vistaActual === 'semanal') {
        resumen = await dashboardService.getResumenSemanal();
      } else if (vistaActual === 'mensual') {
        resumen = await dashboardService.getResumenMensual();
      }

      setResumenDiario(resumen);

      // Cargar datos complementarios
      const [tendenciasData, ordenesData, pedidosData, alertasData] = await Promise.all([
        dashboardService.getTendencias(7),
        dashboardService.getOrdenesPendientes(),
        dashboardService.getPedidosPendientes(),
        dashboardService.getAlertasInventario(10)
      ]);

      setTendencias(tendenciasData);
      setOrdenesPendientes(ordenesData);
      setPedidosPendientes(pedidosData);
      setAlertasInventario(alertasData);

    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente y cuando cambien las dependencias
  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada, vistaActual]);

  // Formatear números como moneda
  const formatearMoneda = (valor) => {
    if (!valor) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Formatear números
  const formatearNumero = (valor) => {
    if (!valor) return '0';
    return new Intl.NumberFormat('es-CO').format(valor);
  };

  // Preparar datos para gráficos
  const prepararDatosTendencias = () => {
    if (!tendencias.length) return { labels: [], datasets: [] };

    return {
      labels: tendencias.map(t => new Date(t.fecha).toLocaleDateString('es-CO', { 
        month: 'short', 
        day: 'numeric' 
      })),
      datasets: [
        {
          label: 'Ingresos',
          data: tendencias.map(t => t.ingresos || 0),
          backgroundColor: 'rgba(13, 110, 253, 0.8)',
          borderColor: '#0d6efd',
          borderRadius: 8,
        },
        {
          label: 'Egresos',
          data: tendencias.map(t => t.egresos || 0),
          backgroundColor: 'rgba(220, 53, 69, 0.8)',
          borderColor: '#dc3545',
          borderRadius: 8,
        }
      ],
    };
  };

  // Preparar datos de las tarjetas KPI
  const prepararTarjetasKPI = () => {
    if (!resumenDiario) return [];

    const variacionIngresos = metricas?.variacionIngresos || 0;
    const tendenciaIngresos = tendencias.slice(-7).map(t => t.ingresos || 0);
    const tendenciaVentas = tendencias.slice(-7).map(t => t.ventas || 0);

    return [
      {
        titulo: "Ingresos " + (vistaActual === 'diario' ? 'del Día' : 
                           vistaActual === 'semanal' ? 'Semanales' : 'Mensuales'),
        valor: formatearMoneda(resumenDiario.totalIngresos),
        icono: "bi bi-currency-dollar",
        color: variacionIngresos >= 0 ? "#198754" : "#dc3545",
        miniData: tendenciaIngresos,
        variacion: variacionIngresos,
      },
      {
        titulo: "Egresos " + (vistaActual === 'diario' ? 'del Día' : 
                           vistaActual === 'semanal' ? 'Semanales' : 'Mensuales'),
        valor: formatearMoneda(resumenDiario.totalEgresos),
        icono: "bi bi-arrow-down-circle",
        color: "#dc3545",
        miniData: tendencias.slice(-7).map(t => t.egresos || 0),
      },
      {
        titulo: vistaActual === 'diario' ? "Ventas del Día" : "Ventas",
        valor: formatearNumero(resumenDiario.ventasDelDia),
        icono: "bi bi-cart3",
        color: "#0d6efd",
        miniData: tendenciaVentas,
      },
      {
        titulo: "Utilidad " + (vistaActual === 'diario' ? 'del Día' : 
                           vistaActual === 'semanal' ? 'Semanal' : 'Mensual'),
        valor: formatearMoneda(resumenDiario.utilidad),
        icono: "bi bi-graph-up-arrow",
        color: resumenDiario.utilidad >= 0 ? "#198754" : "#dc3545",
        miniData: tendencias.slice(-7).map(t => (t.ingresos || 0) - (t.egresos || 0)),
      },
    ];
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={cargarDatos}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const tarjetasKPI = prepararTarjetasKPI();

  return (
    <div className="dashboard-wrapper">
      {/* Header con controles */}
      <div className="dashboard-header">
        <h2 className="titulo-dashboard">
          Dashboard {vistaActual === 'diario' ? 'Diario' : 
                   vistaActual === 'semanal' ? 'Semanal' : 'Mensual'}
        </h2>
        
        <div className="dashboard-controles">
          {/* Selector de vista */}
          <div className="btn-group me-3" role="group">
            <button 
              type="button" 
              className={`btn ${vistaActual === 'diario' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaActual('diario')}
            >
              Diario
            </button>
            <button 
              type="button" 
              className={`btn ${vistaActual === 'semanal' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaActual('semanal')}
            >
              Semanal
            </button>
            <button 
              type="button" 
              className={`btn ${vistaActual === 'mensual' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaActual('mensual')}
            >
              Mensual
            </button>
          </div>

          {/* Selector de fecha (solo para vista diaria) */}
          {vistaActual === 'diario' && (
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />
          )}

          {/* Botón de actualizar */}
          <button 
            className="btn btn-outline-secondary ms-3" 
            onClick={cargarDatos}
            title="Actualizar datos"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="tarjetas-grid">
        {tarjetasKPI.map((item, i) => (
          <div className="tarjeta-kpi" key={i} style={{ borderLeft: `5px solid ${item.color}` }}>
            <div className="kpi-info">
              <div className="icono-kpi">
                <i className={item.icono} style={{ color: item.color }}></i>
              </div>
              <div>
                <h5>{item.titulo}</h5>
                <h4>{item.valor}</h4>
                {item.variacion !== undefined && (
                  <small className={`variacion ${item.variacion >= 0 ? 'text-success' : 'text-danger'}`}>
                    <i className={`bi bi-arrow-${item.variacion >= 0 ? 'up' : 'down'}`}></i>
                    {Math.abs(item.variacion).toFixed(1)}% vs ayer
                  </small>
                )}
              </div>
            </div>
            <div className="kpi-mini-chart">
              <Line
                data={{
                  labels: item.miniData.map((_, i) => i),
                  datasets: [
                    {
                      data: item.miniData,
                      borderColor: item.color,
                      backgroundColor: "transparent",
                      pointRadius: 0,
                      borderWidth: 2,
                      tension: 0.3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  elements: { point: { radius: 0 } },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos principales */}
      <div className="graficas-grid">
        <div className="grafica-container">
          <h6 className="grafica-titulo">Tendencia de Ingresos y Egresos (7 días)</h6>
          <Bar 
            data={prepararDatosTendencias()} 
            options={{ 
              responsive: true, 
              plugins: { legend: { display: true } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return formatearMoneda(value);
                    }
                  }
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Sección de alertas y datos adicionales */}
      <div className="info-adicional-grid">
        {/* Alertas de inventario */}
        <div className="alertas-inventario">
          <h5>
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Alertas de Inventario
          </h5>
          <div className="alertas-lista">
            {alertasInventario.length > 0 ? (
              alertasInventario.slice(0, 5).map((alerta, i) => (
                <div key={i} className={`alerta-item ${alerta.nivelAlerta.toLowerCase()}`}>
                  <div className="alerta-info">
                    <strong>{alerta.nombre}</strong> ({alerta.tipo})
                    <small>Stock actual: {alerta.cantidadActual}</small>
                  </div>
                  <span className={`badge badge-${alerta.nivelAlerta.toLowerCase()}`}>
                    {alerta.nivelAlerta}
                  </span>
                </div>
              ))
            ) : (
              <div className="no-datos">0</div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="info-adicional">
          <h5>Información Adicional</h5>
          <div className="info-stats">
            <div className="stat-item">
              <span className="stat-label">Clientes Atendidos:</span>
              <span className="stat-value">{formatearNumero(resumenDiario?.clientesAtendidos)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Órdenes Pendientes:</span>
              <span className="stat-value">{formatearNumero(ordenesPendientes.length)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pedidos Pendientes:</span>
              <span className="stat-value">{formatearNumero(pedidosPendientes.length)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;