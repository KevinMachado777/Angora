import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
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

  const [modalMensaje, setModalMensaje] = useState({
    tipo: "",
    mensaje: "",
    visible: false,
  });

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 3000);
  };

  useEffect(() => {
    axios
      .get("http://localhost:8080/angora/api/v1/inventarioProducto")
      .then((res) => setProductos(res.data))
      .catch(() => abrirModal("error", "Error al cargar productos"));

    axios
      .get("http://localhost:8080/angora/api/v1/clientes/activos-con-cartera")
      .then((res) => setClientes(res.data))
      .catch(() => abrirModal("error", "Error al cargar clientes"));
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormulario((prev) => ({ ...prev, [id]: value }));
  };

  const handleAgregar = () => {
  if (!formulario.id || !formulario.cantidad) {
    abrirModal("advertencia", "Por favor ingresa el producto y la cantidad");
    return;
  }

  const producto = productos.find((p) => p.id === formulario.id);
  if (!producto) {
    abrirModal("error", "Selecciona un producto válido de la lista");
    return;
  }

  const cantidadNueva = parseInt(formulario.cantidad);
  if (isNaN(cantidadNueva) || cantidadNueva <= 0) {
    abrirModal("error", "La cantidad debe ser mayor a 0");
    return;
  }

  const precio = parseInt(producto.precio);
  const total = cantidadNueva * precio;

  if (modoEdicion) {
    // 🟡 Modo edición: reemplazar
    const actualizado = {
      ...formulario,
      cantidad: cantidadNueva,
      precio,
      total,
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
      const actualizado = {
        ...productoExistente,
        cantidad: cantidadTotal,
        total: cantidadTotal * precio,
      };
      setRegistros((prev) =>
        prev.map((item) =>
          item.id === formulario.id ? actualizado : item
        )
      );
    } else {
      setRegistros((prev) => [
        ...prev,
        {
          id: formulario.id,
          nombre: formulario.nombre,
          cantidad: cantidadNueva,
          precio,
          total,
        },
      ]);
    }
  }

  // Limpiar estado
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

  const total = registros.reduce((acu, item) => acu + item.total, 0);
  const cambio = pagoCon - total;

  const handleGuardar = () => {
    setMostrarModal(true);
  };

  const confirmarVenta = async () => {
    if (!metodoPago) {
      abrirModal("advertencia", "Selecciona un método de pago");
      return;
    }

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

    if (!clienteSeleccionado) {
      abrirModal("error", "Selecciona un cliente válido.");
      return;
    }

    if (registros.length === 0) {
      abrirModal("advertencia", "Agrega al menos un producto.");
      return;
    }

    const productosCompletos = registros.map((r) => ({
      producto: { idProducto: r.id },
      cantidad: r.cantidad,
    }));

    const clienteCompleto = { idCliente: clienteSeleccionado.idCliente };
    const cajeroCompleto = { id: user.id };

    const carteraCompleta =
      metodoPago === "credito" && carteraCliente?.idCartera
        ? {
            idCartera: carteraCliente.idCartera,
            abono: 0,
            deudas: total,
            estado: 1,
            idCliente: {
              idCliente: clienteSeleccionado.idCliente,
            },
          }
        : null;

    const factura = {
      fecha: new Date().toISOString(),
      cliente: clienteCompleto,
      productos: productosCompletos,
      subtotal: total,
      total: total,
      saldoPendiente: metodoPago === "credito" ? total * 1.0 : 0.0,
      cajero: cajeroCompleto,
      estado: metodoPago === "credito" ? "PENDIENTE" : "PAGADO",
      idCartera: carteraCompleta,
    };

    try {
      console.log("factura", factura);
      await axios.post("http://localhost:8080/angora/api/v1/ventas", factura);
      abrirModal("exito", "Venta registrada correctamente.");
      setMostrarModal(false);
      setPagoCon("");
      setNotas("");
      setMetodoPago("");
      setClienteSeleccionado(null);
      setRegistros([]);
      setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
    } catch (err) {
      abrirModal("error", "Error al registrar la venta.");
      console.error(err);
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
    <main className="main-home ventas inventario">
      <h1 className="titulo">Facturación</h1>

      <form className="ventas-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo-formulario">
          <label htmlFor="id">Producto</label>
          <Select
            className="select-react"
            classNamePrefix="select"
            options={productos.map((p) => ({
              value: p.id,
              label: p.nombre,
            }))}
            value={
              formulario.id
                ? {
                    value: parseInt(formulario.id),
                    label:
                      productos.find((p) => p.id === parseInt(formulario.id))
                        ?.nombre || "Producto",
                  }
                : null
            }
            onChange={(selected) => {
              const producto = productos.find((p) => p.id === selected.value);
              setFormulario((prev) => ({
                ...prev,
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
              }));
            }}
            placeholder="Seleccionar producto"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        <div>
          <label htmlFor="cantidad">Cantidad</label>
          <input
            type="number"
            id="cantidad"
            value={formulario.cantidad}
            onChange={handleChange}
          />
        </div>

        <div onClick={handleAgregar}>
          {modoEdicion ? <BotonAceptar /> : <BotonAgregar />}
        </div>
      </form>

      <CreadorTabla
        cabeceros={["ID", "Nombre", "Cantidad", "Precio unitario", "Total"]}
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
              const nuevoCliente = {
                idCliente: selected.value,
                nombre: selected.label,
                carteraActiva: selected.carteraActiva,
              };
              setClienteSeleccionado(nuevoCliente);

              try {
                const res = await axios.get(
                  `http://localhost:8080/angora/api/v1/carteras/${selected.value}`
                );
                setCarteraCliente(res.data);
              } catch (error) {
                setCarteraCliente(null);
                abrirModal(
                  "error",
                  "No se pudo cargar la cartera del cliente."
                );
              }
            }}
            placeholder="Seleccionar cliente"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            />
        </div>

        <div>
          <label>Total</label>
          <NumericFormat
            value={total}
            displayType="text"
            thousandSeparator="."
            decimalSeparator=","
            prefix="$"
            className="input-readonly"
          />
        </div>

        <div onClick={handleGuardar}>
          <BotonGuardar />
        </div>
      </form>

      <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)}>
        <div className="modal-flex">
          <div className="ticket">
            <h2 style={{ textAlign: "center" }}>Fragancey´s</h2>
            <p>
              <strong>Ticket</strong>
            </p>
            <p>Fecha: {new Date().toLocaleDateString()}</p>
            <p>Cajero: {user?.nombre}</p>
            <p>Cliente: {clienteSeleccionado?.nombre}</p>
            <p>Método de pago: {metodoPago}</p>
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
                {registros.map((item, i) => (
                  <tr key={i}>
                    <td>{item.id}</td>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>
                      <NumericFormat
                        value={item.precio}
                        displayType="text"
                        thousandSeparator
                        prefix="$"
                      />
                    </td>
                    <td>
                      <NumericFormat
                        value={item.total}
                        displayType="text"
                        thousandSeparator
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
                value={total}
                displayType="text"
                thousandSeparator
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
                    thousandSeparator
                    prefix="$"
                  />
                </p>
                <p>
                  <strong>Cambio: </strong>
                  <NumericFormat
                    value={cambio}
                    displayType="text"
                    thousandSeparator
                    prefix="$"
                  />
                </p>
              </>
            )}
            {notas && (
              <p>
                <strong>Notas:</strong> {notas}
              </p>
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
                disabled={!clienteSeleccionado?.carteraActiva}
              />
              Crédito
            </label>

            <h4>Pagó con</h4>
            <NumericFormat
              disabled={metodoPago === "credito"}
              value={pagoCon}
              onValueChange={(val) => setPagoCon(val.floatValue || "")}
              thousandSeparator
              prefix="$"
              allowNegative={false}
              placeholder="Ingrese el valor"
            />

            <h4>Notas</h4>
            <textarea
              rows="4"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escribe una nota..."
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
