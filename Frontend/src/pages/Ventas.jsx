import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";
import "../styles/ventas.css";
import "../styles/inventario.css";
import Modal from "../components/Modal";
import BotonAgregar from "../components/botonAgregar";
import BotonGuardar from "../components/BotonGuardar";
import { CreadorTabla } from "../components/CreadorTabla";
import BotonAceptar from "../components/BotonAceptar";
import BotonCancelar from "../components/BotonCancelar";
import Select from "react-select";
import { NumericFormat } from "react-number-format";
import "../styles/botones.css";

const Ventas = () => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [formulario, setFormulario] = useState({
    id: "",
    nombre: "",
    cantidad: "",
    precio: "",
  });
  const [registros, setRegistros] = useState([]);
  const [pagoCon, setPagoCon] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [carteraCliente, setCarteraCliente] = useState(null);
  const [errorNotas, setErrorNotas] = useState(false);

  const [modalMensaje, setModalMensaje] = useState({
    tipo: "",
    mensaje: "",
    visible: false,
  });

  // Constantes para límites
  const CANTIDAD_MAXIMA = 1000;

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 1500);
  };

  useEffect(() => {
    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    // Cargar productos
    api
      .get("http://localhost:8080/angora/api/v1/inventarioProducto/listado")
      .then((res) => {
        console.log("Productos recibidos:", res.data);
        setProductos(res.data);
      })
      .catch((err) => {
        console.error(
          "Error al cargar productos:",
          err.response?.status,
          err.response?.data
        );
        abrirModal(
          "error",
          `Error al cargar productos: ${
            err.response?.data?.message || err.message
          }`
        );
      });

    // Cargar clientes
    api
      .get("http://localhost:8080/angora/api/v1/clientes/activos-con-cartera")
      .then((res) => {
        console.log("Clientes recibidos:", res.data);
        const consumidorFinal = {
          idCliente: 0,
          nombre: "Consumidor final",
          carteraActiva: false,
        };
        setClientes([consumidorFinal, ...res.data]);
      })
      .catch((err) => {
        console.error(
          "Error al cargar clientes:",
          err.response?.status,
          err.response?.data
        );
        abrirModal(
          "error",
          `Error al cargar clientes: ${
            err.response?.data?.message || err.message
          }`
        );
      });
  }, [token]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    // Validar cantidad máxima
    if (id === "cantidad") {
      const cantidad = parseInt(value);
      if (cantidad > CANTIDAD_MAXIMA) {
        abrirModal(
          "advertencia",
          `La cantidad máxima permitida es ${CANTIDAD_MAXIMA} unidades`
        );
        return;
      }
    }

    setFormulario((prev) => ({ ...prev, [id]: value }));
  };

  const handleNotasChange = (e) => {
    const value = e.target.value;
    setNotas(value);
    if (!clienteSeleccionado || clienteSeleccionado.idCliente === 0) {
      setErrorNotas(!value.trim());
    } else {
      setErrorNotas(false);
    }
  };

  const handleAgregar = () => {
    if (!formulario.id || !formulario.cantidad) {
      abrirModal("advertencia", "Por favor ingresa el producto y la cantidad");
      return;
    }

    const producto = productos.find((p) => p.idProducto === formulario.id);
    if (!producto) {
      abrirModal("error", "Selecciona un producto válido de la lista");
      return;
    }

    const cantidadNueva = parseInt(formulario.cantidad);
    if (isNaN(cantidadNueva) || cantidadNueva <= 0) {
      abrirModal("error", "La cantidad debe ser mayor a 0");
      return;
    }

    if (cantidadNueva > CANTIDAD_MAXIMA) {
      abrirModal(
        "error",
        `La cantidad máxima permitida es ${CANTIDAD_MAXIMA} unidades`
      );
      return;
    }

    const precio = Number(producto.precioDetal);

    if (modoEdicion) {
      const actualizado = {
        ...formulario,
        cantidad: cantidadNueva,
        precio,
      };
      setRegistros((prev) =>
        prev.map((item) => (item.id === idEditando ? actualizado : item))
      );
    } else {
      const productoExistente = registros.find(
        (item) => item.id === formulario.id
      );
      if (productoExistente) {
        const cantidadTotal = productoExistente.cantidad + cantidadNueva;
        if (cantidadTotal > CANTIDAD_MAXIMA) {
          abrirModal(
            "error",
            `La cantidad total no puede exceder ${CANTIDAD_MAXIMA} unidades`
          );
          return;
        }
        const actualizado = {
          ...productoExistente,
          cantidad: cantidadTotal,
        };
        setRegistros((prev) =>
          prev.map((item) => (item.id === formulario.id ? actualizado : item))
        );
      } else {
        setRegistros((prev) => [
          ...prev,
          {
            id: formulario.id,
            nombre: formulario.nombre,
            cantidad: cantidadNueva,
            precio,
          },
        ]);
      }
    }

    setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
    setModoEdicion(false);
    setIdEditando(null);
  };

  const handleEditar = (dato) => {
    setFormulario({
      id: dato.id,
      nombre: dato.nombre,
      cantidad: dato.cantidad,
      precio: dato.precio,
    });
    setModoEdicion(true);
    setIdEditando(dato.id);
  };

  const handleEliminar = (dato) => {
    setRegistros(registros.filter((item) => item.id !== dato.id));
    if (modoEdicion && dato.id === idEditando) {
      setModoEdicion(false);
      setIdEditando(null);
      setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
    }
  };

  const calculateInvoiceSummary = () => {
    let subtotal = 0;
    let totalWithIVA = 0;
    registros.forEach((item) => {
      const producto = productos.find((p) => p.idProducto === item.id);
      const precioUnitario = producto
        ? producto.iva
          ? item.precio * 1.19
          : item.precio
        : item.precio;
      subtotal += item.cantidad * item.precio;
      totalWithIVA += item.cantidad * precioUnitario;
    });
    return { subtotal, total: totalWithIVA };
  };

  const handleGuardar = () => {
    if (registros.length === 0) {
      abrirModal("advertencia", "Agrega al menos un producto.");
      return;
    }
    setMostrarModal(true);
  };

  const confirmarVenta = async () => {
    if (!metodoPago) {
      abrirModal("advertencia", "Selecciona un método de pago");
      return;
    }

    const { total } = calculateInvoiceSummary();

    if (
      metodoPago === "efectivo" &&
      (!pagoCon || parseFloat(pagoCon) < total)
    ) {
      abrirModal(
        "error",
        "El valor con el que paga debe ser mayor o igual al total."
      );
      return;
    }

    if (!clienteSeleccionado || clienteSeleccionado.idCliente === 0) {
      if (!notas.trim()) {
        setErrorNotas(true);
        abrirModal(
          "error",
          "Debes ingresar una nota cuando no hay cliente seleccionado o es Consumidor final."
        );
        return;
      }
    }

    const { subtotal } = calculateInvoiceSummary();

    const productosCompletos = registros.map((r) => ({
      producto: { idProducto: r.id },
      cantidad: r.cantidad,
    }));

    const clienteCompleto =
      clienteSeleccionado && clienteSeleccionado.idCliente !== 0
        ? { idCliente: clienteSeleccionado.idCliente }
        : null;

    const cajeroCompleto = { id: user.id };

    const carteraCompleta =
      metodoPago === "credito" &&
      clienteSeleccionado?.idCliente !== 0 &&
      carteraCliente?.idCartera
        ? {
            idCartera: carteraCliente.idCartera,
            abono: 0,
            deudas: total,
            estado: 1,
          }
        : null;

    // Fecha en formato Colombia para backend
    const fechaColombia = new Date()
      .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
      .replace(" ", "T");

    const factura = {
      fecha: fechaColombia,
      cliente: clienteCompleto,
      productos: productosCompletos,
      subtotal: subtotal,
      total: total,
      saldoPendiente: metodoPago === "credito" ? total : 0.0,
      cajero: cajeroCompleto,
      estado: metodoPago === "credito" ? "PENDIENTE" : "PAGADO",
      idCartera: carteraCompleta,
      notas: notas.trim() || null,
    };

    try {
      console.log("factura", factura);
      await api.post("http://localhost:8080/angora/api/v1/ventas", factura);
      abrirModal("exito", "Venta registrada correctamente.");
      setMostrarModal(false);
      setPagoCon("");
      setNotas("");
      setMetodoPago("");
      setClienteSeleccionado(null);
      setRegistros([]);
      setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
      setCarteraCliente(null);
      setErrorNotas(false);
    } catch (err) {
      console.error(
        "Error al registrar venta:",
        err.response?.status,
        err.response?.data
      );
      abrirModal(
        "error",
        `Error al registrar la venta: ${
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

  // Verificar si el crédito está disponible para el cliente seleccionado
  const isCreditoDisponible = () => {
    return (
      clienteSeleccionado &&
      clienteSeleccionado.idCliente !== 0 &&
      clienteSeleccionado.carteraActiva === true
    );
  };

  return (
    <main className="main-home ventas inventario">
      <h1 className="titulo">Facturación</h1>

      <form className="ventas-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo-formulario">
          <label htmlFor="id">Producto</label>
          <Select
            className="select-react"
            classNamePrefix="select"
            options={productos.map((p) => ({
              value: p.idProducto,
              label: p.nombre,
            }))}
            value={
              formulario.id
                ? {
                    value: formulario.id,
                    label:
                      productos.find((p) => p.idProducto === formulario.id)?.nombre ||
                      "Producto",
                  }
                : null
            }
            onChange={(selected) => {
              const producto = productos.find((p) => p.idProducto === selected.value);
              setFormulario((prev) => ({
                ...prev,
                id: producto.idProducto,
                nombre: producto.nombre,
                precio: Number(producto.precioDetal),
              }));
            }}
            placeholder="Seleccionar producto"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menuList: (base) => ({
                ...base,
                maxHeight: 200, // altura máxima del menú
                overflowY: "auto", // fuerza scroll si es necesario
              }),
            }}
          />
        </div>

        <div>
          <label htmlFor="cantidad">Cantidad (máx. {CANTIDAD_MAXIMA})</label>
          <input
            type="number"
            id="cantidad"
            value={formulario.cantidad}
            onChange={handleChange}
            min="1"
            max={CANTIDAD_MAXIMA}
          />
        </div>

        <div onClick={handleAgregar}>
          {modoEdicion ? <BotonAceptar /> : <BotonAgregar />}
        </div>
      </form>

      <CreadorTabla
        cabeceros={["Nombre", "Cantidad", "Precio unitario"]}
        registros={registros}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      <form
        className="ventas-formulario ventas-inferior"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="campo-formulario">
          <label>Cliente</label>
          <Select
            className="select-react"
            classNamePrefix="select"
            options={clientes.map((c) => ({
              value: c.idCliente,
              label: c.nombre,
              idCartera: c.idCartera,
              carteraActiva: c.carteraActiva,
            }))}
            value={
              clienteSeleccionado
                ? {
                    value: clienteSeleccionado.idCliente,
                    label: clienteSeleccionado.nombre,
                  }
                : null
            }
            onChange={async (selected) => {
              const nuevoCliente = selected
                ? {
                    idCliente: selected.value,
                    nombre: selected.label,
                    carteraActiva: selected.carteraActiva,
                  }
                : null;
              setClienteSeleccionado(nuevoCliente);
              setErrorNotas(
                !nuevoCliente || (nuevoCliente.idCliente === 0 && !notas.trim())
              );

              // Resetear método de pago si se selecciona un cliente sin crédito
              if (
                metodoPago === "credito" &&
                (!nuevoCliente || !nuevoCliente.carteraActiva)
              ) {
                setMetodoPago("");
              }

              if (selected && selected.value !== 0) {
                try {
                  const res = await api.get(`http://localhost:8080/angora/api/v1/carteras/${selected.value}`);
                  setCarteraCliente(res.data);
                } catch (error) {
                  console.error(
                    "Error al cargar cartera:",
                    error.response?.status,
                    error.response?.data
                  );
                  setCarteraCliente(null);
                  abrirModal(
                    "error",
                    "No se pudo cargar la cartera del cliente."
                  );
                }
              } else {
                setCarteraCliente(null);
              }
            }}
            placeholder="Seleccionar cliente"
            isClearable
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              menuList: (base) => ({
                ...base,
                maxHeight: 200, // altura máxima del menú
                overflowY: "auto", // fuerza scroll si es necesario
              }),
            }}
          />
        </div>

        <div onClick={handleGuardar}>
          <BotonGuardar />
        </div>
      </form>

      <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)}>
        <div className="modal-flex">
          <div className="ticket">
            <h2 style={{ textAlign: "center" }}>Fragancey's</h2>
            <p>
              <strong>Factura</strong>
            </p>
            <p>
              Fecha:{" "}
              {new Date().toLocaleString("es-CO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "America/Bogota",
              })}
            </p>

            <p>
              Usuario: {user?.nombre} {user?.apellido || ""}
            </p>
            <p>Cliente: {clienteSeleccionado?.nombre || "Consumidor final"}</p>
            <p>Método de pago: {metodoPago}</p>
            {notas && (
              <p>
                <strong>Notas:</strong> {notas}
              </p>
            )}
            <hr />
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>IVA</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((item, i) => {
                  const producto = productos.find((p) => p.idProducto === item.id);
                  const iva = producto ? producto.iva : false;
                  const precioUnitario = iva ? item.precio * 1.19 : item.precio;
                  const totalProducto = item.cantidad * precioUnitario;
                  return (
                    <tr key={i}>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>
                        <NumericFormat
                          value={item.precio}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$"
                        />
                      </td>
                      <td>{iva ? "Sí" : "No"}</td>
                      <td>
                        <NumericFormat
                          value={totalProducto}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <hr />
            <p>
              <strong>Subtotal (sin IVA): </strong>
              <NumericFormat
                value={calculateInvoiceSummary().subtotal}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$"
              />
            </p>
            <p>
              <strong>Total a pagar: </strong>
              <NumericFormat
                value={calculateInvoiceSummary().total}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$"
              />
            </p>
            {pagoCon && (
              <>
                <p>
                  <strong>Pago con: </strong>
                  <NumericFormat
                    value={pagoCon}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$"
                  />
                </p>
                <p>
                  <strong>Cambio: </strong>
                  <NumericFormat
                    value={pagoCon - calculateInvoiceSummary().total}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$"
                  />
                </p>
              </>
            )}
            <p style={{ textAlign: "center", marginTop: "1em" }}>
              ¡Gracias por tu compra!
            </p>
          </div>

          <div className="ticket-panel">
            <h3>Método de pago</h3>
            <label>
              <input
                type="radio"
                name="metodoPago"
                checked={metodoPago === "efectivo"}
                onChange={() => setMetodoPago("efectivo")}
              />
              Efectivo
            </label>
            <label>
              <input
                type="radio"
                name="metodoPago"
                checked={metodoPago === "credito"}
                onChange={() => setMetodoPago("credito")}
                disabled={!isCreditoDisponible()}
                title={
                  !isCreditoDisponible()
                    ? "El cliente no tiene crédito activo"
                    : ""
                }
              />
              Crédito{" "}
              {!isCreditoDisponible() && (
                <span className="text-muted">(No disponible)</span>
              )}
            </label>

            <h4>Pagó con</h4>
            <NumericFormat
              disabled={metodoPago === "credito"}
              value={pagoCon}
              onValueChange={(val) => setPagoCon(val.floatValue || "")}
              thousandSeparator="."
              decimalSeparator=","
              prefix="$"
              allowNegative={false}
              placeholder="Ingrese el valor"
            />

            <h4>
              Notas
              {!clienteSeleccionado || clienteSeleccionado.idCliente === 0
                ? " (obligatorio)"
                : " (opcional)"}
            </h4>
            <textarea
              rows="4"
              value={notas}
              onChange={handleNotasChange}
              placeholder={
                !clienteSeleccionado || clienteSeleccionado.idCliente === 0
                  ? "Ingresa una nota (obligatorio)"
                  : "Escribe una nota (opcional)..."
              }
              className={errorNotas ? "error-input" : ""}
              aria-invalid={errorNotas}
            ></textarea>

            <div className="acciones">
              <button className="btn-agregar" onClick={confirmarVenta}>
                Confirmar
              </button>
              <BotonCancelar onClick={() => setMostrarModal(false)} />
            </div>
          </div>
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

export default Ventas;