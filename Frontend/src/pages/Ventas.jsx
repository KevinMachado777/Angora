// Importaciones necesarias de React y componentes personalizados
import React, { useState } from "react";
import "../styles/ventas.css";
import "../styles/inventario.css";
import Modal from "../components/Modal";
import BotonAgregar from "../components/botonAgregar";
import BotonGuardar from "../components/BotonGuardar";
import { CreadorTabla } from "../components/CreadorTabla";
import BotonAceptar from "../components/BotonAceptar";
import { NumericFormat } from "react-number-format";
import "../styles/botones.css";

const Ventas = () => {
  // Encabezados para la tabla de productos
  const cabeceros = ["ID", "Nombre", "Cantidad", "Precio unitario", "Total"];

  // Lista de productos disponibles para facturar
  const productosDisponibles = [
    { id: "1", nombre: "Lava manos x500", precio: 25000 },
    { id: "2", nombre: "Lava loza x500", precio: 30000 },
    { id: "3", nombre: "Multiusos x500", precio: 18000 },
  ];

  // Estado para controlar el formulario de producto
  const [formulario, setFormulario] = useState({
    id: "",
    nombre: "",
    cantidad: "",
    precio: "",
  });

  // Lista de productos ya agregados a la venta
  const [registros, setRegistros] = useState([]);

  // Datos de cliente, notas y método de pago
  const [cliente, setCliente] = useState("");
  const [pagoCon, setPagoCon] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("");

  // Control del modal y edición
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  // Manejo de cambio de inputs del formulario
  const handleChange = (e) => {
    const { id, value } = e.target;

    // Si cambia el ID, autocompletamos nombre y precio
    if (id === "id") {
      const producto = productosDisponibles.find((p) => p.id === value);
      if (producto) {
        setFormulario((prev) => ({
          ...prev,
          id: value,
          nombre: producto.nombre,
          precio: producto.precio,
        }));
      } else {
        setFormulario((prev) => ({
          ...prev,
          id: value,
          nombre: "",
          precio: "",
        }));
      }
    } else {
      setFormulario((prev) => ({ ...prev, [id]: value }));
    }
  };

  // Agrega producto o actualiza si está en modo edición
  const handleAgregar = () => {
    if (!formulario.id || !formulario.cantidad) {
      alert("Por favor ingresa el ID y la cantidad");
      return;
    }

    const producto = productosDisponibles.find((p) => p.id === formulario.id);
    if (!producto) {
      alert("El ID ingresado no corresponde a un producto existente");
      return;
    }

    const cantidad = parseInt(formulario.cantidad);
    const precio = parseInt(formulario.precio);
    const total = cantidad * precio;

    if (modoEdicion) {
      const actualizado = {
        id: formulario.id,
        nombre: formulario.nombre,
        cantidad,
        precio,
        total,
      };

      setRegistros((prev) =>
        prev.map((item) => (item.id === idEditando ? actualizado : item))
      );

      setModoEdicion(false);
      setIdEditando(null);
    } else {
      const nuevoRegistro = { ...formulario, cantidad, precio, total };
      setRegistros((prev) => [...prev, nuevoRegistro]);
    }

    // Reiniciar formulario
    setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
  };

  // Carga los datos de un producto al formulario para edición
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

  // Elimina producto de la tabla
  const handleEliminar = (dato) => {
    setRegistros(registros.filter((item) => item.id !== dato.id));
    if (modoEdicion && dato.id === idEditando) {
      setModoEdicion(false);
      setIdEditando(null);
      setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
    }
  };

  // Calcula el total y el cambio
  const total = registros.reduce((acu, item) => acu + item.total, 0);
  const cambio = pagoCon - total;

  // Abre el modal de confirmación
  const handleGuardar = () => {
    setMostrarModal(true);
  };

  // Render del componente
  return (
    <main className="main-home ventas inventario">
      <h1 className="titulo">Facturación</h1>

      {/* Formulario de producto */}
      <form className="ventas-formulario" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="id">ID</label>
          <input
            type="text"
            id="id"
            value={formulario.id}
            onChange={handleChange}
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

        {/* Botón para agregar o aceptar edición */}
        <div onClick={handleAgregar}>
          {modoEdicion ? <BotonAceptar /> : <BotonAgregar />}
        </div>
      </form>

      {/* Tabla de productos añadidos */}
      <CreadorTabla
        cabeceros={cabeceros}
        registros={registros}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      {/* Formulario inferior con cliente y total */}
      <form
        className="ventas-formulario ventas-inferior"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label htmlFor="cliente">Id o Nombre del cliente</label>
          <input
            type="text"
            id="cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="total">Total</label>
          <NumericFormat
            id="total"
            value={total}
            displayType="text"
            thousandSeparator="."
            decimalSeparator=","
            prefix="$"
            className="input-readonly" // Usa esta clase para mantener el estilo del input
          />
        </div>

        <div onClick={handleGuardar}>
          <BotonGuardar />
        </div>
      </form>

      {/* Modal de confirmación de venta */}
      <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)}>
        <div className="modal-flex">
          {/* Ticket de venta */}
          <div className="ticket">
            <h2 style={{ textAlign: "center" }}>Fragancey´s</h2>
            <p>
              <strong>Ticket #1</strong>
            </p>
            <p>Fecha: {new Date().toLocaleDateString()}</p>
            <p>Cajero: Kevin Machado</p>
            <p>Cliente: {cliente}</p>
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
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                      />
                    </td>
                    <td>
                      <NumericFormat
                        value={item.total}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
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
                displayType={"text"}
                thousandSeparator={true}
                prefix={"$"}
              />
            </p>
            {pagoCon && (
              <p>
                <strong>Pago con: </strong>
                <NumericFormat
                  value={pagoCon}
                  displayType={"text"}
                  thousandSeparator={true}
                  prefix={"$"}
                />
              </p>
            )}
            {pagoCon && (
              <p>
                <strong>Cambio: </strong>
                <NumericFormat
                  value={cambio}
                  displayType={"text"}
                  thousandSeparator={true}
                  prefix={"$"}
                />
              </p>
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

          {/* Panel derecho: controles de pago */}
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
                disabled={cliente.trim() === ""}
              />
              Crédito
            </label>

            <h4>Pagó con</h4>
            <NumericFormat
              disabled={metodoPago === "credito"}
              value={pagoCon}
              onValueChange={(val) => {
                setPagoCon(val.floatValue || "");
              }}
              thousandSeparator={true}
              prefix="$"
              allowNegative={false}
              placeholder="Ingrese el valor"
            />

            <h4>Agregar notas</h4>
            <textarea
              rows="4"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escribe una nota aquí..."
            ></textarea>

            <div className="acciones">
              <button
                className="btn-agregar"
                onClick={() => {
                  setTimeout(() => window.print());
                  setPagoCon("");
                  setNotas("");
                }}
              >
                Confirmar e imprimir
              </button>

              <button
                className="btn-agregar"
                onClick={() => {
                  setMostrarModal(false);
                  setPagoCon("");
                  setNotas("");
                }}
              >
                Confirmar y no imprimir
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default Ventas;
