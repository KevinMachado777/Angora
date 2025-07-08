// Importamos React y useState para manejar estados
import React, { useState } from "react";

// Importamos estilos CSS para esta vista
import "../styles/ventas.css";
import "../styles/inventario.css";

// Importamos componentes personalizados reutilizables
import Modal from "../components/Modal";
import BotonAgregar from "../components/botonAgregar";
import BotonGuardar from "../components/BotonGuardar";
import { CreadorTabla } from "../components/CreadorTabla";
import BotonAceptar from "../components/BotonAceptar";

// Importamos una librería para formatear números (como valores monetarios)
import { NumericFormat } from "react-number-format";
import "../styles/botones.css";

const Ventas = () => {
  // Nombres de las columnas para la tabla de productos
  const cabeceros = ["ID", "Nombre", "Cantidad", "Precio unitario", "Total"];

  // Lista de productos disponibles para seleccionar
  const productosDisponibles = [
    { id: "1", nombre: "Lava manos x500", precio: 25000 },
    { id: "2", nombre: "Lava loza x500", precio: 30000 },
    { id: "3", nombre: "Multiusos x500", precio: 18000 },
  ];

  // Estado para controlar los datos del formulario (producto a ingresar)
  const [formulario, setFormulario] = useState({
    id: "",
    nombre: "",
    cantidad: "",
    precio: "",
  });

  // Lista de productos que ya han sido agregados a la factura
  const [registros, setRegistros] = useState([]);

  // Estados para datos adicionales de la venta
  const [cliente, setCliente] = useState(""); // Nombre del cliente
  const [pagoCon, setPagoCon] = useState(""); // Valor con el que paga
  const [notas, setNotas] = useState(""); // Notas opcionales
  const [metodoPago, setMetodoPago] = useState(""); // Método de pago: efectivo o crédito

  // Estados para controlar el modal y si se está editando un producto
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null); // ID del producto que se está editando

  // Maneja los cambios en los inputs del formulario
  const handleChange = (e) => {
    const { id, value } = e.target;

    // Si cambia el ID, autocompleta nombre y precio
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
        // Si el ID no existe, se limpia el formulario
        setFormulario((prev) => ({
          ...prev,
          id: value,
          nombre: "",
          precio: "",
        }));
      }
    } else {
      // Para los demás campos solo actualiza el valor
      setFormulario((prev) => ({ ...prev, [id]: value }));
    }
  };

  // Función para agregar o actualizar un producto
  const handleAgregar = () => {
    // Validación: ID y cantidad son obligatorios
    if (!formulario.id || !formulario.cantidad) {
      alert("Por favor ingresa el ID y la cantidad");
      return;
    }

    // Verificamos que el ID exista en la lista de productos
    const producto = productosDisponibles.find((p) => p.id === formulario.id);
    if (!producto) {
      alert("El ID ingresado no corresponde a un producto existente");
      return;
    }

    // Convertimos los valores numéricos
    const cantidad = parseInt(formulario.cantidad);
    const precio = parseInt(formulario.precio);
    const total = cantidad * precio;

    // Si estamos editando, reemplazamos el producto en la lista
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
      // Si no estamos editando, simplemente lo agregamos a la lista
      const nuevoRegistro = { ...formulario, cantidad, precio, total };
      setRegistros((prev) => [...prev, nuevoRegistro]);
    }

    // Limpiamos el formulario
    setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
  };

  // Cargar un producto en el formulario para editarlo
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

  // Eliminar un producto de la lista
  const handleEliminar = (dato) => {
    setRegistros(registros.filter((item) => item.id !== dato.id));
    // Si estaba editando ese producto, cancelamos edición
    if (modoEdicion && dato.id === idEditando) {
      setModoEdicion(false);
      setIdEditando(null);
      setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
    }
  };

  // Calcular el total y el cambio (si pagó con efectivo)
  const total = registros.reduce((acu, item) => acu + item.total, 0);
  const cambio = pagoCon - total;

  // Muestra el modal de confirmación
  const handleGuardar = () => {
    setMostrarModal(true);
  };

  // Render del componente
  return (
    <main className="main-home ventas inventario">
      <h1 className="titulo">Facturación</h1>

      {/* Formulario para agregar productos */}
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

        {/* Botón que cambia si estás en modo edición */}
        <div onClick={handleAgregar}>
          {modoEdicion ? <BotonAceptar /> : <BotonAgregar />}
        </div>
      </form>

      {/* Tabla que muestra los productos agregados */}
      <CreadorTabla
        cabeceros={cabeceros}
        registros={registros}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      {/* Formulario inferior con datos del cliente y total */}
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
            className="input-readonly"
          />
        </div>

        {/* Botón para guardar y mostrar modal */}
        <div onClick={handleGuardar}>
          <BotonGuardar />
        </div>
      </form>

      {/* Modal con resumen de venta y opciones de pago */}
      <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)}>
        <div className="modal-flex">
          {/* Ticket de venta (lado izquierdo del modal) */}
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
                {/* Lista de productos en el ticket */}
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
                displayType="text"
                thousandSeparator
                prefix="$"
              />
            </p>
            {pagoCon && (
              <p>
                <strong>Pago con: </strong>
                <NumericFormat
                  value={pagoCon}
                  displayType="text"
                  thousandSeparator
                  prefix="$"
                />
              </p>
            )}
            {pagoCon && (
              <p>
                <strong>Cambio: </strong>
                <NumericFormat
                  value={cambio}
                  displayType="text"
                  thousandSeparator
                  prefix="$"
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

          {/* Controles del lado derecho del modal */}
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

            {/* Campo para registrar con cuánto pagó el cliente */}
            <h4>Pagó con</h4>
            <NumericFormat
              disabled={metodoPago === "credito"} // Desactivado si es a crédito
              value={pagoCon}
              onValueChange={(val) => {
                setPagoCon(val.floatValue || "");
              }}
              thousandSeparator={true}
              prefix="$"
              allowNegative={false}
              placeholder="Ingrese el valor"
            />

            {/* Notas adicionales */}
            <h4>Agregar notas</h4>
            <textarea
              rows="4"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escribe una nota aquí..."
            ></textarea>

            {/* Botones de acción finales */}
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
