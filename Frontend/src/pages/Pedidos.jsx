import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonEliminar from "../components/BotonEliminar";
import { jsPDF } from "jspdf";
import "../styles/pedidos.css";
import TablaDetalles from "../components/TablaDetalles";
import { NumericFormat } from "react-number-format";
import BotonAceptar from "../components/BotonAceptar";

const Pedidos = () => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");

  const [inventario, setInventario] = useState([]);
  const [pedidosPendiente, setPedidosPendiente] = useState([]);
  const [mostrarConfirmarVenta, setMostrarConfirmarVenta] = useState(false);
  const [pedidoAConfirmar, setPedidoAConfirmar] = useState(null);
  const [productosAConfirmar, setProductosAConfirmar] = useState([]);
  const [mostrarClientesProducto, setMostrarClientesProducto] = useState(false);
  const [clientesProducto, setClientesProducto] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);
  const [modalMensaje, setModalMensaje] = useState({
    tipo: "",
    mensaje: "",
    visible: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [enviarCorreo, setEnviarCorreo] = useState(false);

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 1500);
  };

  const abrirModalEliminarPedido = (pedido) => {
    setPedidoAEliminar(pedido);
    setConfirmarEliminacion(true);
  };

  // Helper function to round to the nearest multiple of 50
  const roundToNearest50 = (value) => {
    return Math.round(value / 50) * 50;
  };

  useEffect(() => {
    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Cargar inventario
        const inventarioResponse = await axios.get(
          "http://localhost:8080/angora/api/v1/inventarioProducto/listado",
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setInventario(inventarioResponse.data);

        // Cargar facturas pendientes
        const pedidosResponse = await axios.get(
          "http://localhost:8080/angora/api/v1/pedidos/pendientes",
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Facturas pendientes recibidas:", pedidosResponse.data);
        pedidosResponse.data.forEach((pedido) => {
          console.log(
            `Factura ID: ${pedido.idFactura}, Cliente: ${
              pedido.cliente ? `${pedido.cliente.nombre} ${pedido.cliente.apellido || ""}` : "Consumidor final"
            }, Notas: ${pedido.notas || "Sin notas"}`
          );
        });
        setPedidosPendiente(pedidosResponse.data);
      } catch (err) {
        console.error(
          "Error al cargar datos:",
          err.response?.status,
          err.response?.data
        );
        abrirModal(
          "error",
          `Error al cargar datos: ${err.response?.data?.message || err.message}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const confirmarVenta = async (imprimir) => {
    if (!pedidoAConfirmar || productosAConfirmar.length === 0) {
      abrirModal("advertencia", "No hay productos para confirmar la factura.");
      return;
    }

    const actualizarCartera =
      pedidoAConfirmar.saldoPendiente > 0 &&
      pedidoAConfirmar.saldoPendiente === pedidoAConfirmar.total;
    const productosDTO = productosAConfirmar.map((p) => ({
      idProducto: p.idProducto || p.id,
      cantidad: p.cantidad,
    }));

    const confirmarFacturaDTO = {
      actualizarCartera,
      productos: productosDTO,
    };

    try {
      // Confirmar la factura
      await axios.put(
        `http://localhost:8080/angora/api/v1/pedidos/confirmar/${pedidoAConfirmar.idFactura}`,
        confirmarFacturaDTO,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Enviar correo si está habilitado
      if (enviarCorreo && pedidoAConfirmar.cliente && pedidoAConfirmar.cliente.correo) {
        await axios.post(
          "http://localhost:8080/angora/api/v1/pedidos/enviar-factura",
          {
            idFactura: pedidoAConfirmar.idFactura,
            enviarCorreo: true,
          },
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      const nuevoInventario = inventario.map((prod) => {
        const encontrado = productosAConfirmar.find(
          (p) => (p.idProducto || p.id) === prod.idProducto
        );
        if (encontrado) {
          return { ...prod, stock: prod.stock - encontrado.cantidad };
        }
        return prod;
      });
      setInventario(nuevoInventario);

      setPedidosPendiente(
        pedidosPendiente.filter(
          (p) => p.idFactura !== pedidoAConfirmar.idFactura
        )
      );

      if (imprimir) {
        generarPDF({
          ...pedidoAConfirmar,
          productos: productosAConfirmar,
        });
      }

      abrirModal("exito", "Factura confirmada correctamente.");
      setMostrarConfirmarVenta(false);
      setPedidoAConfirmar(null);
      setProductosAConfirmar([]);
      setEnviarCorreo(false);
    } catch (err) {
      console.error(
        "Error al confirmar factura:",
        err.response?.status,
        err.response?.data
      );
      abrirModal(
        "error",
        `Error al confirmar la factura: ${err.response?.data || err.message}`
      );
    }
  };

  // Función corregida para generar PDF con precios correctos
  const generarPDF = (pedido) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Fragancey's", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Factura - Ticket #${pedido.idFactura}`, 10, 25);
    doc.text(
      `Cliente: ${pedido.cliente ? `${pedido.cliente.nombre} ${pedido.cliente.apellido || ""}` : "Consumidor final"}`,
      10,
      35
    );
    doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleString()}`, 10, 45);
    doc.text(`Cajero: ${pedido.cajero ? `${pedido.cajero.nombre} ${pedido.cajero.apellido || ""}` : "Sin cajero asignado"}`, 10, 55);
    
    let y = 65;
    if (pedido.notas) {
      doc.text(`Notas: ${pedido.notas}`, 10, y);
      y += 10;
    }
    
    // Línea separadora
    doc.line(10, y, 200, y);
    y += 10;
    
    // Encabezados de tabla
    doc.setFontSize(10);
    doc.text("Producto", 10, y);
    doc.text("Cant.", 80, y);
    doc.text("P. Unit. (sin IVA)", 100, y);
    doc.text("P. Unit. (con IVA)", 140, y);
    doc.text("Total", 180, y);
    y += 10;
    
    // Línea separadora
    doc.line(10, y - 5, 200, y - 5);
    
    // Productos con precios corregidos
    pedido.productos.forEach((p) => {
      // Precio unitario SIN IVA (precio base)
      const precioSinIva = p.precio;
      // Precio unitario CON IVA (si aplica)
      const precioConIva = p.iva ? p.precio * 1.19 : p.precio;
      // Total del producto (cantidad × precio con IVA)
      const totalProducto = p.cantidad * precioConIva;
      
      doc.text(`${p.nombre}`, 10, y);
      doc.text(`${p.cantidad}`, 80, y);
      doc.text(`$${precioSinIva.toLocaleString()}`, 100, y);
      doc.text(`$${precioConIva.toLocaleString()}`, 140, y);
      doc.text(`$${totalProducto.toLocaleString()}`, 180, y);
      y += 8;
    });
    
    // Línea separadora
    y += 5;
    doc.line(10, y, 200, y);
    y += 10;
    
    // Totales
    doc.setFontSize(11);
    doc.text(`Subtotal (sin IVA): $${pedido.subtotal.toLocaleString()}`, 120, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`TOTAL: $${roundToNearest50(pedido.total).toLocaleString()}`, 120, y);
    
    // Pie de página
    y += 20;
    doc.setFontSize(10);
    doc.text("¡Gracias por tu compra!", 105, y, { align: "center" });
    
    doc.save(`Factura_Ticket_${pedido.idFactura}.pdf`);
  };

  const abrirModalConfirmar = (pedido) => {
    if (!pedido || pedido.productos.length === 0) {
      abrirModal("advertencia", "No hay productos para confirmar la factura.");
      return;
    }
    setPedidoAConfirmar(pedido);
    setProductosAConfirmar([...pedido.productos]);
    setEnviarCorreo(false);
    setMostrarConfirmarVenta(true);
  };

  const produccionPendiente = inventario
    .map((producto) => {
      const cantidadTotal = pedidosPendiente.reduce((total, pedido) => {
        const encontrado = pedido.productos.find((p) => {
          const match = (p.idProducto || p.id) === producto.idProducto;
          return match;
        });
        return encontrado ? total + encontrado.cantidad : total;
      }, 0);
      return {
        idProducto: producto.idProducto,
        nombre: producto.nombre,
        cantidad: cantidadTotal,
      };
    })
    .filter((p) => p.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad);

  const abrirModalClientesProducto = (producto) => {
    const resultado = pedidosPendiente
      .map((ticket) => {
        const productoEnFactura = ticket.productos.find(
          (p) => (p.idProducto || p.id) === producto.idProducto
        );
        if (productoEnFactura) {
          return {
            cliente: ticket.cliente
              ? `${ticket.cliente.nombre} ${ticket.cliente.apellido || ""}`
              : "Consumidor final",
            cantidad: productoEnFactura.cantidad,
            ticketId: ticket.idFactura,
            notas: ticket.notas,
          };
        }
        return null;
      })
      .filter(Boolean);
    setClientesProducto(resultado);
    setProductoSeleccionado(producto);
    setMostrarClientesProducto(true);
  };

  const eliminarPedido = async () => {
    try {
      await axios.delete(
        `http://localhost:8080/angora/api/v1/pedidos/${pedidoAEliminar.idFactura}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPedidosPendiente(
        pedidosPendiente.filter(
          (p) => p.idFactura !== pedidoAEliminar.idFactura
        )
      );
      setConfirmarEliminacion(false);
      abrirModal("exito", "Factura eliminada correctamente.");
    } catch (err) {
      console.error(
        "Error al eliminar factura:",
        err.response?.status,
        err.response?.data
      );
      abrirModal(
        "error",
        `Error al eliminar la factura: ${
          err.response?.data?.message || err.message
        }`
      );
    }
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

  return (
    <main className="main-home inventario pedidos">
      <div className="container">
        <h2 className="text-center">Pedidos</h2>
      </div>

      <div className="container-tablas">
        <div>
          <h4 className="text-center">Producción Pendiente</h4>
          {isLoading ? (
            <p className="text-center text-muted">
              Cargando producción pendiente...
            </p>
          ) : produccionPendiente.length === 0 ? (
            <p className="text-center text-muted">
              No hay producción pendiente.
            </p>
          ) : (
            <TablaDetalles
              encabezados={["ID", "Nombre", "Cantidad", "Detalles"]}
              registros={produccionPendiente.map((p) => ({
                idProducto: p.idProducto,
                nombre: p.nombre,
                cantidad: p.cantidad,
              }))}
              onIconClick={abrirModalClientesProducto}
            />
          )}
        </div>

        <div>
          <h4 className="text-center">Pedidos Pendientes</h4>
          {isLoading ? (
            <p className="text-center text-muted">
              Cargando pedidos pendientes...
            </p>
          ) : pedidosPendiente.length === 0 ? (
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th># Ticket</th>
                  <th>Cliente</th>
                  <th>Precio Total</th>
                  <th>Opciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No hay pedidos pendientes.
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th># Ticket</th>
                  <th>Cliente</th>
                  <th>Precio Total</th>
                  <th>Opciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosPendiente.map((pedido, i) => (
                  <tr key={i}>
                    <td>{pedido.idFactura}</td>
                    <td>
                      {pedido.cliente
                        ? `${pedido.cliente.nombre} ${pedido.cliente.apellido || ""}`
                        : "Consumidor final"}
                    </td>
                    <td>
                      <NumericFormat
                        value={roundToNearest50(pedido.total)}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => abrirModalConfirmar(pedido)}
                      >
                        Confirmar
                      </button>
                      <BotonEliminar
                        onClick={() => abrirModalEliminarPedido(pedido)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={mostrarClientesProducto}
        onClose={() => setMostrarClientesProducto(false)}
      >
        <div className="encabezado-modal">
          <h2 className="text-center">Clientes con Producto Pendiente</h2>
        </div>
        <div className="mb-2 text-center">
          <h6 className="fw-bold text-success">
            <i className="bi bi-box-seam me-2"></i>
            {productoSeleccionado?.nombre}
          </h6>
        </div>
        <div className="row tarjetas-ajuste">
          {clientesProducto.length === 0 ? (
            <p className="text-center text-muted">
              No hay clientes con este producto pendiente.
            </p>
          ) : (
            clientesProducto.map((c, i) => (
              <div key={i}>
                <div className="card card-cliente shadow-sm">
                  <div className="card-body">
                    <p>
                      <i className="bi bi-person-circle text-primary"></i>
                      <strong>{c.cliente}</strong>
                    </p>
                    <p>
                      <i className="bi bi-receipt-cutoff text-dark"></i>
                      Ticket #{c.ticketId}
                    </p>
                    <p>
                      <i className="bi bi-box2-heart-fill text-success"></i>
                      Cantidad: {c.cantidad}
                    </p>
                    {c.notas && (
                      <p>
                        <i className="bi bi-chat-left-text text-info"></i>
                        Notas: {c.notas}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="pie-modal mt-2">
          <BotonAceptar onClick={() => setMostrarClientesProducto(false)} />
        </div>
      </Modal>

      <Modal
        isOpen={mostrarConfirmarVenta}
        onClose={() => setMostrarConfirmarVenta(false)}
      >
        <div className="encabezado-modal">
          <h2 className="text-center">
            <i className="bi bi-check-circle-fill text-success me-2"></i>
            Confirmar Factura
          </h2>
        </div>
        <hr className="my-3" />
        <p className="text-center text-muted">
          Seleccione una opción para finalizar la venta de la factura{" "}
          <strong>(Ticket #{pedidoAConfirmar?.idFactura})</strong>.
        </p>
        <div className="ticket">
          <h3 style={{ textAlign: "center" }}>Fraganceys</h3>
          <p>
            Fecha:{" "}
            {pedidoAConfirmar &&
              new Date(pedidoAConfirmar.fecha).toLocaleString()}
          </p>
          <p>
            Cajero: {pedidoAConfirmar?.cajero
              ? `${pedidoAConfirmar.cajero.nombre} ${pedidoAConfirmar.cajero.apellido || ""}`
              : "Sin cajero asignado"}
          </p>
          <p>
            Cliente: {pedidoAConfirmar?.cliente
              ? `${pedidoAConfirmar.cliente.nombre} ${pedidoAConfirmar.cliente.apellido || ""}`
              : "Consumidor final"}
          </p>
          {pedidoAConfirmar?.notas && (
            <p>
              <strong>Notas:</strong> {pedidoAConfirmar.notas}
            </p>
          )}
          <hr />
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cant.</th>
                <th>Precio (sin IVA)</th>
                <th>Subtotal (con IVA)</th>
                <th>IVA</th>
              </tr>
            </thead>
            <tbody>
              {productosAConfirmar.map((item, i) => {
                // Precio sin IVA (precio base)
                const precioSinIva = item.precio;
                // Precio con IVA si aplica
                const precioConIva = item.iva ? item.precio * 1.19 : item.precio;
                // Subtotal = cantidad × precio con IVA
                const subtotalProducto = item.cantidad * precioConIva;
                
                return (
                  <tr key={i}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>
                      <NumericFormat
                        value={precioSinIva}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$"
                      />
                    </td>
                    <td>
                      <NumericFormat
                        value={subtotalProducto}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$"
                      />
                    </td>
                    <td>{item.iva ? "Sí" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <hr />
          <p>
            <strong>Subtotal (sin IVA): </strong>
            <NumericFormat
              value={pedidoAConfirmar?.subtotal || 0}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$"
            />
          </p>
          <p>
            <strong>Total a pagar: </strong>
            <NumericFormat
              value={roundToNearest50(pedidoAConfirmar?.total || 0)}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$"
            />
          </p>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="enviarCorreo"
            checked={enviarCorreo}
            onChange={(e) => setEnviarCorreo(e.target.checked)}
            disabled={!pedidoAConfirmar?.cliente?.correo}
          />
          <label className="form-check-label" htmlFor="enviarCorreo">
            Enviar factura por correo electrónico
            {!pedidoAConfirmar?.cliente?.correo && (
              <span className="text-muted"> (Cliente sin correo)</span>
            )}
          </label>
        </div>
        <div className="pie-modal">
          <BotonCancelar onClick={() => setMostrarConfirmarVenta(false)} />
          <button
            className="btn btn-outline-success"
            onClick={() => confirmarVenta(false)}
          >
            Confirmar sin Imprimir
          </button>
          <button
            className="btn btn-success ms-2"
            onClick={() => confirmarVenta(true)}
          >
            Confirmar e Imprimir
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={confirmarEliminacion}
        onClose={() => setConfirmarEliminacion(false)}
      >
        <div className="encabezado-modal">
          <h2>Confirmar Eliminación</h2>
        </div>
        <p>
          ¿Desea eliminar la factura del cliente{" "}
          <strong>
            {pedidoAEliminar?.cliente
              ? `${pedidoAEliminar.cliente.nombre} ${pedidoAEliminar.cliente.apellido || ""}`
              : `Consumidor final${pedidoAEliminar?.notas ? ` (${pedidoAEliminar.notas})` : ""}`}
          </strong>
          ?
        </p>
        <div className="pie-modal">
          <BotonCancelar onClick={() => setConfirmarEliminacion(false)} />
          <BotonAceptar onClick={eliminarPedido}></BotonAceptar>
        </div>
      </Modal>

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
    </main>
  );
};

export default Pedidos;