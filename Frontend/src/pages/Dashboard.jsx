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
import "../styles/dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

import Modal from "../components/Modal";

const Dashboard = () => {
  // Pagination states for alerts
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Number of alerts per page

  const [modalMensaje, setModalMensaje] = useState({
    tipo: "",
    mensaje: "",
    visible: false,
  });

  const validarCorreo = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 1500);
  };

  const iconos = {
    exito: "bi bi-check-circle-fill text-success display-4 mb-2",
    error: "bi bi-x-circle-fill text-danger display-4 mb-2",
    advertencia: "bi bi-exclamation-triangle-fill text-warning display-4 mb-2",
  };

  const titulos = {
    exito: "¡Éxito!",
    error: "Error",
    advertencia: "Advertencia",
  };

  const obtenerFechaHoyLocal = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, "0");
    const day = String(hoy.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
    obtenerFechaHoyLocal()
  );
  const [vistaActual, setVistaActual] = useState("diario");

  // Estados para configuración de envío automático
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuracionEnvio, setConfiguracionEnvio] = useState({
    correoDestinatario: "",
    horaEnvio: "08:00",
    activo: false,
  });
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [enviandoManual, setEnviandoManual] = useState(false);

  // Función para validar fecha
  const validarFecha = (fecha) => {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    fechaObj.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    return fechaObj <= hoy;
  };

  // Efecto para corregir fecha al montar componente
  useEffect(() => {
    const fechaHoy = obtenerFechaHoyLocal();
    if (fechaSeleccionada > fechaHoy) {
      console.log("Corrigiendo fecha futura a fecha de hoy");
      setFechaSeleccionada(fechaHoy);
    }
  }, []);

  // Cargar datos del dashboard
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      let resumen;
      if (vistaActual === "diario") {
        resumen = await dashboardService.getResumenDiario(fechaSeleccionada);
        const metricas = await dashboardService.getMetricasFinancieras(
          fechaSeleccionada
        );
        setMetricas(metricas);
      } else if (vistaActual === "semanal") {
        resumen = await dashboardService.getResumenSemanal();
      } else if (vistaActual === "mensual") {
        resumen = await dashboardService.getResumenMensual();
      }

      setResumenDiario(resumen);

      const [tendenciasData, ordenesData, pedidosData, alertasData] =
        await Promise.all([
          dashboardService.getTendencias(7),
          dashboardService.getOrdenesPendientes(),
          dashboardService.getPedidosPendientes(),
          dashboardService.getAlertasInventario(10),
        ]);

      setTendencias(tendenciasData);
      setOrdenesPendientes(ordenesData);
      setPedidosPendientes(pedidosData);
      setAlertasInventario(alertasData);
    } catch (err) {
      console.error("Error cargando datos del dashboard:", err);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const config = await dashboardService.getConfiguracionEnvio();
      setConfiguracionEnvio(config);
    } catch (error) {
      console.error("Error cargando configuración:", error);
    }
  };

  const guardarConfiguracion = async () => {
    if (!validarCorreo(configuracionEnvio.correoDestinatario)) {
      abrirModal("advertencia", "Por favor ingrese un correo válido");
      return;
    }
    setGuardandoConfig(true);
    try {
      await dashboardService.guardarConfiguracionEnvio(configuracionEnvio);
      setShowConfigModal(false);
      abrirModal(
        "exito",
        "El dashboard se enviará automáticamente todos los días a las " +
          configuracionEnvio.horaEnvio
      );
    } catch (error) {
      console.error("Error guardando configuración:", error);
      abrirModal("error", "Error al guardar");
    } finally {
      setGuardandoConfig(false);
    }
  };

  const enviarDashboardManual = async () => {
    setEnviandoManual(true);
    try {
      await dashboardService.enviarDashboardManual();
      abrirModal("exito", "Dashboard enviado ");
    } catch (error) {
      console.error("Error enviando dashboard:", error);
      abrirModal("error", "Error al enviar el Dashboard");
    } finally {
      setEnviandoManual(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada, vistaActual]);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const formatearMoneda = (valor) => {
    if (!valor) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearNumero = (valor) => {
    if (!valor) return "0";
    return new Intl.NumberFormat("es-CO").format(valor);
  };

  const prepararDatosTendencias = () => {
    if (!tendencias.length) return { labels: [], datasets: [] };

    return {
      labels: tendencias.map((t) =>
        new Date(t.fecha).toLocaleDateString("es-CO", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "Ingresos",
          data: tendencias.map((t) => t.ingresos || 0),
          backgroundColor: "rgba(13, 110, 253, 0.8)",
          borderColor: "#0d6efd",
          borderRadius: 8,
        },
        {
          label: "Egresos",
          data: tendencias.map((t) => t.egresos || 0),
          backgroundColor: "rgba(220, 53, 69, 0.8)",
          borderColor: "#dc3545",
          borderRadius: 8,
        },
      ],
    };
  };

  const prepararTarjetasKPI = () => {
    if (!resumenDiario) return [];

    const variacionIngresos = metricas?.variacionIngresos || 0;
    const tendenciaIngresos = tendencias.slice(-7).map((t) => t.ingresos || 0);
    const tendenciaVentas = tendencias.slice(-7).map((t) => t.ventas || 0);

    return [
      {
        titulo:
          "Ingresos " +
          (vistaActual === "diario"
            ? "del Día"
            : vistaActual === "semanal"
            ? "Semanales"
            : "Mensuales"),
        valor: formatearMoneda(resumenDiario.totalIngresos),
        icono: "bi bi-currency-dollar",
        color: variacionIngresos >= 0 ? "#198754" : "#dc3545",
        miniData: tendenciaIngresos,
        variacion: variacionIngresos,
      },
      {
        titulo:
          "Egresos " +
          (vistaActual === "diario"
            ? "del Día"
            : vistaActual === "semanal"
            ? "Semanales"
            : "Mensuales"),
        valor: formatearMoneda(resumenDiario.totalEgresos),
        icono: "bi bi-arrow-down-circle",
        color: "#dc3545",
        miniData: tendencias.slice(-7).map((t) => t.egresos || 0),
      },
      {
        titulo: vistaActual === "diario" ? "Ventas del Día" : "Ventas",
        valor: formatearNumero(resumenDiario.ventasDelDia),
        icono: "bi bi-cart3",
        color: "#0d6efd",
        miniData: tendenciaVentas,
      },
      {
        titulo:
          "Utilidad " +
          (vistaActual === "diario"
            ? "del Día"
            : vistaActual === "semanal"
            ? "Semanal"
            : "Mensual"),
        valor: formatearMoneda(resumenDiario.utilidad),
        icono: "bi bi-graph-up-arrow",
        color: resumenDiario.utilidad >= 0 ? "#198754" : "#dc3545",
        miniData: tendencias
          .slice(-7)
          .map((t) => (t.ingresos || 0) - (t.egresos || 0)),
      },
    ];
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlerts = alertasInventario.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(alertasInventario.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
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
          <button className="btn btn-primary" onClick={cargarDatos}>
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
          Dashboard{" "}
          {vistaActual === "diario"
            ? "Diario"
            : vistaActual === "semanal"
            ? "Semanal"
            : "Mensual"}
        </h2>

        <div className="dashboard-controles">
          {/* Selector de vista */}
          <div className="btn-group me-3" role="group">
            <button
              type="button"
              className={`btn ${
                vistaActual === "diario" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setVistaActual("diario")}
            >
              Diario
            </button>
            <button
              type="button"
              className={`btn ${
                vistaActual === "semanal"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setVistaActual("semanal")}
            >
              Semanal
            </button>
            <button
              type="button"
              className={`btn ${
                vistaActual === "mensual"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setVistaActual("mensual")}
            >
              Mensual
            </button>
          </div>

          {/* Selector de fecha (solo para vista diaria) */}
          {vistaActual === "diario" && (
            <input
              type="date"
              className="form-control me-3"
              style={{ width: "auto" }}
              value={fechaSeleccionada}
              max={obtenerFechaHoyLocal()}
              onChange={(e) => {
                const fechaNueva = e.target.value;
                const fechaHoy = obtenerFechaHoyLocal();

                if (fechaNueva <= fechaHoy) {
                  setFechaSeleccionada(fechaNueva);
                } else {
                  abrirModal("error", "No puedes seleccionar fechas futuras");
                  setFechaSeleccionada(fechaHoy);
                }
              }}
            />
          )}

          {/* Botones de acción */}
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary"
              onClick={cargarDatos}
              title="Actualizar datos"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>

            <button
              className="btn btn-outline-info"
              onClick={() => {
                cargarConfiguracion();
                setShowConfigModal(true);
              }}
              title="Configurar envío automático"
            >
              <i className="bi bi-gear"></i>
            </button>

            <button
              className="btn btn-outline-success"
              onClick={enviarDashboardManual}
              disabled={enviandoManual}
              title="Enviar dashboard por correo"
            >
              {enviandoManual ? (
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
              ) : (
                <i className="bi bi-envelope"></i>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="tarjetas-grid">
        {tarjetasKPI.map((item, i) => (
          <div
            className="tarjeta-kpi"
            key={i}
            style={{ borderLeft: `5px solid ${item.color}` }}
          >
            <div className="kpi-info">
              <div className="icono-kpi">
                <i className={item.icono} style={{ color: item.color }}></i>
              </div>
              <div>
                <h5>{item.titulo}</h5>
                <h4>{item.valor}</h4>
                {item.variacion !== undefined && (
                  <small
                    className={`variacion ${
                      item.variacion >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    <i
                      className={`bi bi-arrow-${
                        item.variacion >= 0 ? "up" : "down"
                      }`}
                    ></i>
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
          <h6 className="grafica-titulo">
            Tendencia de Ingresos y Egresos (7 días)
          </h6>
          <Bar
            data={prepararDatosTendencias()}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return formatearMoneda(value);
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Sección de alertas y datos adicionales */}
      <div className="info-adicional-grid">
       <div className="alertas-inventario">
  <h5>
    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
    Alertas de Inventario
  </h5>
  <div className="alertas-lista">
    {currentAlerts.length > 0 ? (
      currentAlerts.map((alerta, i) => {
        // Log para depurar los datos recibidos
        console.log('Alerta recibida:', alerta);

        // Determinar texto y color basado en nivelAlerta del backend
        const nivelAlertaMostrar = alerta.nivelAlerta === "STOCK_EXCEDIDO" ? "Exceso" : "Escazo";
        const claseBadge = alerta.nivelAlerta === "STOCK_EXCEDIDO" ? "badge-warning" : "badge-danger";

        return (
          <div key={i} className={`alerta-item ${claseBadge}`}>
            <div className="alerta-info">
              <strong className="alerta-nombre">{alerta.nombre}</strong>
              <div className="alerta-tipo">({alerta.tipo})</div>
              <div className="alerta-detalle">Stock actual: {alerta.cantidadActual}</div>
              {alerta.nivelAlerta === "STOCK_EXCEDIDO" ? (
                <div className="alerta-detalle">Stock máximo: {alerta.stockMaximo}</div>
              ) : (
                <div className="alerta-detalle">Stock mínimo: {alerta.stockMinimo}</div>
              )}
              {alerta.nivelAlerta === "STOCK_EXCEDIDO" && alerta.stockMinimo != null && (
                <div className="alerta-detalle">Stock mínimo: {alerta.stockMinimo}</div>
              )}
              {alerta.nivelAlerta !== "STOCK_EXCEDIDO" && alerta.stockMaximo != null && (
                <div className="alerta-detalle">Stock máximo: {alerta.stockMaximo}</div>
              )}
            </div>
            <span className={`badge ${claseBadge}`}>
              {nivelAlertaMostrar}
            </span>
          </div>
        );
      })
    ) : (
      <div className="no-datos">Sin alertas</div>
    )}
  </div>
  {/* Controles de paginación */}
  {alertasInventario.length > itemsPerPage && (
    <nav className="mt-3">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => paginate(currentPage - 1)}
          >
            Anterior
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, i) => (
          <li
            key={i}
            className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
          >
            <button className="page-link" onClick={() => paginate(i + 1)}>
              {i + 1}
            </button>
          </li>
        ))}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => paginate(currentPage + 1)}
          >
            Siguiente
          </button>
        </li>
      </ul>
    </nav>
  )}
</div>

        <div className="info-adicional">
          <h5>Información Adicional</h5>
          <div className="info-stats">
            <div className="stat-item">
              <span className="stat-label">Clientes Atendidos:</span>
              <span className="stat-value">
                {formatearNumero(resumenDiario?.clientesAtendidos)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Órdenes Pendientes:</span>
              <span className="stat-value">
                {formatearNumero(ordenesPendientes.length)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pedidos Pendientes:</span>
              <span className="stat-value">
                {formatearNumero(pedidosPendientes.length)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuración */}
      {showConfigModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-gear me-2"></i>
                  Configurar Envío Automático del Dashboard
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfigModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="correoDestinatario" className="form-label">
                    <i className="bi bi-envelope me-1"></i>
                    Correo de destino
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="correoDestinatario"
                    placeholder="correo@ejemplo.com"
                    value={configuracionEnvio.correoDestinatario}
                    onChange={(e) =>
                      setConfiguracionEnvio({
                        ...configuracionEnvio,
                        correoDestinatario: e.target.value,
                      })
                    }
                  />
                  <div className="form-text">
                    Correo donde se enviará el resumen diario del dashboard
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="horaEnvio" className="form-label">
                    <i className="bi bi-clock me-1"></i>
                    Hora de envío
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    id="horaEnvio"
                    value={configuracionEnvio.horaEnvio}
                    onChange={(e) =>
                      setConfiguracionEnvio({
                        ...configuracionEnvio,
                        horaEnvio: e.target.value,
                      })
                    }
                  />
                  <div className="form-text">
                    Hora diaria para el envío automático del dashboard
                  </div>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="activarEnvio"
                    checked={configuracionEnvio.activo}
                    onChange={(e) =>
                      setConfiguracionEnvio({
                        ...configuracionEnvio,
                        activo: e.target.checked,
                      })
                    }
                  />
                  <label className="form-check-label" htmlFor="activarEnvio">
                    <strong>Activar envío automático diario</strong>
                  </label>
                </div>

                {configuracionEnvio.activo && (
                  <div className="alert alert-info mt-3" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Configuración activa:</strong> El dashboard se
                    enviará automáticamente todos los días a las{" "}
                    {configuracionEnvio.horaEnvio} a{" "}
                    {configuracionEnvio.correoDestinatario}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={guardarConfiguracion}
                  disabled={
                    guardandoConfig ||
                    !configuracionEnvio.correoDestinatario.trim()
                  }
                >
                  {guardandoConfig ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check me-2"></i>
                      Guardar Configuración
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Modal
        isOpen={modalMensaje.visible}
        onClose={() => setModalMensaje({ ...modalMensaje, visible: false })}
      >
        <div className="text-center p-3">
          <i className={iconos[modalMensaje.tipo]}></i>
          <h2>{titulos[modalMensaje.tipo]}</h2>
          <p>{modalMensaje.mensaje}</p>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;