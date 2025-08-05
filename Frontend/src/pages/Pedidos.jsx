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
  const [isLoading, setIsLoading] = useState(true); // Estado para indicador de carga

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 3000);
  };

  useEffect(() => {
    console.log("Token enviado:", token);

    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Cargar inventario
        const inventarioResponse = await axios.get("http://localhost:8080/angora/api/v1/inventarioProducto/listado", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Productos recibidos:", inventarioResponse.data);
        setInventario(inventarioResponse.data);

        // Cargar facturas pendientes
        const pedidosResponse = await axios.get("http://localhost:8080/angora/api/v1/pedidos/pendientes", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Facturas pendientes recibidas:", pedidosResponse.data);
        setPedidosPendiente(pedidosResponse.data);
      } catch (err) {
        console.error("Error al cargar datos:", err.response?.status, err.response?.data);
        abrirModal("error", `Error al cargar datos: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    console.log("Producción pendiente calculada:", produccionPendiente);
    console.log("Registros enviados a TablaDetalles:", produccionPendiente.map((p) => ({
      idProducto: p.idProducto,
      nombre: p.nombre,
      cantidad: p.cantidad,
    })));
  }, [inventario, pedidosPendiente]);

  const confirmarVenta = async (imprimir) => {
    if (!pedidoAConfirmar || productosAConfirmar.length === 0) {
      abrirModal("advertencia", "No hay productos para confirmar la factura.");
      return;
    }

    const actualizarCartera = pedidoAConfirmar.saldoPendiente > 0 && pedidoAConfirmar.saldoPendiente === pedidoAConfirmar.total;
    const productosDTO = productosAConfirmar.map((p) => ({
      idProducto: p.idProducto || p.id, // Maneja idProducto o id
      cantidad: p.cantidad,
    }));

    const confirmarFacturaDTO = {
      actualizarCartera,
      productos: productosDTO,
    };

    try {
      await axios.put(`http://localhost:8080/angora/api/v1/pedidos/confirmar/${pedidoAConfirmar.idFactura}`, confirmarFacturaDTO, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const nuevoInventario = inventario.map((prod) => {
        const encontrado = productosAConfirmar.find((p) => (p.idProducto || p.id) === prod.idProducto);
        if (encontrado) {
          return { ...prod, stock: prod.stock - encontrado.cantidad };
        }
        return prod;
      });
      setInventario(nuevoInventario);

      setPedidosPendiente(pedidosPendiente.filter((p) => p.idFactura !== pedidoAConfirmar.idFactura));

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
    } catch (err) {
      console.error("Error al confirmar factura:", err.response?.status, err.response?.data);
      abrirModal("error", `Error al confirmar la factura: ${err.response?.data || err.message}`);
    }
  };

  const generarPDF = (pedido) => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Factura - Ticket #${pedido.idFactura}`, 10, 10);
    doc.text(`Cliente: ${pedido.cliente.nombre}`, 10, 20);
    doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleString()}`, 10, 30);
    let y = 45;
    doc.text("Productos:", 10, y);
    y += 10;
    pedido.productos.forEach((p, i) => {
      const precioConIva = p.iva ? p.precio * 1.19 : p.precio;
      doc.text(`- ${p.nombre} x${p.cantidad} ($${precioConIva.toFixed(2)})`, 10, y);
      y += 10;
    });
    doc.text(`Total: $${pedido.total}`, 10, y + 10);
    doc.save(`Factura_Ticket_${pedido.idFactura}.pdf`);
  };

  const abrirModalConfirmar = (pedido) => {
    if (!pedido || pedido.productos.length === 0) {
      abrirModal("advertencia", "No hay productos para confirmar la factura.");
      return;
    }
    setPedidoAConfirmar(pedido);
    setProductosAConfirmar([...pedido.productos]);
    setMostrarConfirmarVenta(true);
  };

  const produccionPendiente = inventario
    .map((producto) => {
      const cantidadTotal = pedidosPendiente.reduce((total, pedido) => {
        const encontrado = pedido.productos.find((p) => {
          const match = (p.idProducto || p.id) === producto.idProducto;
          console.log(`Comparando producto ${producto.idProducto} con pedido producto ${p.idProducto || p.id}: ${match}`);
          return match;
        });
        return encontrado ? total + encontrado.cantidad : total;
      }, 0);
      console.log(`Producto ${producto.idProducto} (${producto.nombre}): ${cantidadTotal} unidades pendientes`);
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
        const productoEnFactura = ticket.productos.find((p) => (p.idProducto || p.id) === producto.idProducto);
        if (productoEnFactura) {
          return {
            cliente: ticket.cliente.nombre,
            cantidad: productoEnFactura.cantidad,
            ticketId: ticket.idFactura,
          };
        }
        return null;
      })
      .filter(Boolean);
    console.log("Clientes con producto pendiente:", resultado);
    setClientesProducto(resultado);
    setProductoSeleccionado(producto);
    setMostrarClientesProducto(true);
  };

  const abrirModalEliminarPedido = (pedido) => {
    setPedidoAEliminar(pedido);
    setConfirmarEliminacion(true);
  };

  const eliminarPedido = async () => {
    try {
      await axios.delete(`http://localhost:8080/angora/api/v1/pedidos/${pedidoAEliminar.idFactura}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setPedidosPendiente(pedidosPendiente.filter((p) => p.idFactura !== pedidoAEliminar.idFactura));
      abrirModal("exito", "Factura eliminada correctamente.");
      setConfirmarEliminacion(false);
    } catch (err) {
      console.error("Error al eliminar factura:", err.response?.status, err.response?.data);
      abrirModal("error", `Error al eliminar la factura: ${err.response?.data?.message || err.message}`);
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
            <p className="text-center text-muted">Cargando producción pendiente...</p>
          ) : produccionPendiente.length === 0 ? (
            <p className="text-center text-muted">No hay producción pendiente.</p>
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
            <p className="text-center text-muted">Cargando pedidos pendientes...</p>
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
                    <td>{pedido.cliente.nombre}</td>
                    <td>
                      <NumericFormat
                        value={pedido.total}
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
            <p className="text-center text-muted">No hay clientes con este producto pendiente.</p>
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
        <p className="text-center">
          ¿Desea confirmar la factura del cliente{" "}
          <span className="fw-bold">{pedidoAConfirmar?.cliente.nombre}</span>?
        </p>
        <p className="text-center text-muted">
          Seleccione una opción para finalizar la venta de la factura{" "}
          <strong>(Ticket #{pedidoAConfirmar?.idFactura})</strong>.
        </p>
        <div className="ticket">
          <h3 style={{ textAlign: "center" }}>Fragancey´s</h3>
          <p>Fecha: {pedidoAConfirmar && new Date(pedidoAConfirmar.fecha).toLocaleString()}</p>
          <p>Cajero: {user?.nombre}</p>
          <p>Cliente: {pedidoAConfirmar?.cliente.nombre}</p>
          <hr />
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {productosAConfirmar.map((item, i) => (
                <tr key={i}>
                  <td>{item.idProducto || item.id}</td>
                  <td>{item.nombre}</td>
                  <td>{item.cantidad}</td>
                  <td>
                    <NumericFormat
                      value={item.iva ? item.precio * 1.19 : item.precio}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="$"
                    />
                  </td>
                  <td>
                    <NumericFormat
                      value={item.cantidad * (item.iva ? item.precio * 1.19 : item.precio)}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="$"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <p>
            <strong>Total a pagar: </strong>
            <NumericFormat
              value={pedidoAConfirmar?.total}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$"
            />
          </p>
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
          <strong>{pedidoAEliminar?.cliente.nombre}</strong>?
        </p>
        <div className="pie-modal">
          <BotonCancelar onClick={() => setConfirmarEliminacion(false)} />
          <button className="btn btn-danger" onClick={eliminarPedido}>
            Eliminar
          </button>
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