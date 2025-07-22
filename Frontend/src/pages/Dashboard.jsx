// Dashboard.jsx
import React from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import "../styles/Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const resumen = [
    {
      titulo: "Ventas",
      valor: "$8.250.000",
      icono: "bi bi-cart3",
      color: "#0d6efd",
      miniData: [400, 600, 500, 700, 800, 650, 900],
    },
    {
      titulo: "Clientes",
      valor: "185",
      icono: "bi bi-people",
      color: "#198754",
      miniData: [20, 25, 22, 30, 28, 26, 33],
    },
    {
      titulo: "Productos",
      valor: "92",
      icono: "bi bi-box-seam",
      color: "#ffc107",
      miniData: [10, 15, 13, 18, 16, 17, 19],
    },
    {
      titulo: "Ingresos",
      valor: "$2.450.000",
      icono: "bi bi-currency-dollar",
      color: "#dc3545",
      miniData: [200, 250, 230, 260, 290, 270, 310],
    },
  ];

  const dataBarras = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Ventas mensuales",
        data: [1200000, 950000, 1100000, 1300000, 1500000, 1250000, 1425000],
        backgroundColor: "#0d6efd",
        borderRadius: 8,
      },
    ],
  };

  const dataDoughnut = {
    labels: ["Hogar", "Baño", "Cocina", "Automotor"],
    datasets: [
      {
        label: "Categorías",
        data: [40, 25, 20, 15],
        backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545"],
        borderWidth: 1,
      },
    ],
  };

  const transacciones = [
    { id: 1, cliente: "Carlos Pérez", total: "$120.000", fecha: "2025-07-15" },
    { id: 2, cliente: "Laura Díaz", total: "$230.000", fecha: "2025-07-14" },
    { id: 3, cliente: "Ana Gómez", total: "$310.000", fecha: "2025-07-13" },
    { id: 4, cliente: "Javier Méndez", total: "$450.000", fecha: "2025-07-12" },
    { id: 5, cliente: "Marta Torres", total: "$510.000", fecha: "2025-07-11" },
  ];

  return (
    <div className="dashboard-wrapper">
      <h2 className="titulo-dashboard">Dashboard</h2>

      <div className="tarjetas-grid">
        {resumen.map((item, i) => (
          <div className="tarjeta-kpi" key={i} style={{ borderLeft: `5px solid ${item.color}` }}>
            <div className="kpi-info">
              <div className="icono-kpi">
                <i className={item.icono}></i>
              </div>
              <div>
                <h5>{item.titulo}</h5>
                <h4>{item.valor}</h4>
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

      <div className="graficas-grid">
        <div className="grafica-container">
          <Bar data={dataBarras} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="grafica-container">
          <Doughnut data={dataDoughnut} options={{ responsive: true }} />
        </div>
      </div>

      <div className="transacciones-recientes mt-4">
        <h5>Transacciones recientes</h5>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((trx) => (
              <tr key={trx.id}>
                <td>{trx.cliente}</td>
                <td>{trx.total}</td>
                <td>{trx.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
