import React, { useState } from "react";
import "../styles/ventas.css";
import "../styles/inventario.css";
import Modal from "../components/Modal";
import BotonAgregar from "../components/botonAgregar";
import BotonGuardar from "../components/BotonGuardar";
import { CreadorTabla } from "../components/CreadorTabla";
import "../styles/ticket.css";
import BotonAceptar from "../components/BotonAceptar"

const Ventas = () => {
  const cabeceros = ["ID", "Nombre", "Cantidad", "Precio unitario", "Total"];

  const [formulario, setFormulario] = useState({
    id: "",
    nombre: "",
    cantidad: "",
    precio: "",
  });

  const [registros, setRegistros] = useState([]);
  const [cliente, setCliente] = useState("");
  const [pagoCon, setPagoCon] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState({
    efectivo: false,
    credito: false,
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormulario((prev) => ({ ...prev, [id]: value }));
  };

  const handleAgregar = () => {
    if (
      !formulario.id ||
      !formulario.nombre ||
      !formulario.cantidad ||
      !formulario.precio
    ) {
      alert("Por favor completa todos los campos");
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

    setFormulario({ id: "", nombre: "", cantidad: "", precio: "" });
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

  const total = registros.reduce((acc, item) => acc + item.total, 0);
  const cambio = pagoCon - total;

  const handleGuardar = () => {
    if (!cliente) {
      alert("Por favor ingresa el nombre del cliente.");
      return;
    }
    setMostrarModal(true);
  };

  return (
    <main className="main-home ventas inventario">
      <h1 className="titulo">Facturación</h1>

      {/* Formulario superior */}
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
          <label htmlFor="nombre">Nombre</label>
          <input
            type="text"
            id="nombre"
            value={formulario.nombre}
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
        <div>
          <label htmlFor="precio">Precio unitario</label>
          <input
            type="number"
            id="precio"
            value={formulario.precio}
            onChange={handleChange}
          />
        </div>
        <div onClick={handleAgregar}>
          {modoEdicion ? (
            <BotonAceptar />
          ) : (
            <BotonAgregar />
          )}
        </div>
      </form>

      {/* Tabla de productos */}
      <CreadorTabla
        cabeceros={cabeceros}
        registros={registros}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      {/* Formulario inferior sin campo de pago */}
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
          <input type="text" id="total" value={total} readOnly />
        </div>
        <div onClick={handleGuardar}>
          <BotonGuardar />
        </div>
      </form>

      {/* Modal con el resumen y pago */}
      <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)}>
  <div className="modal-flex">
    {/* TICKET - SOLO ESTO SE IMPRIME */}
    <div className="ticket">
      <h2 style={{ textAlign: "center" }}>Fragancey´s</h2>
      <p><strong>Ticket #1</strong></p>
      <p>Fecha: {new Date().toLocaleDateString()}</p>
      <p>Cajero: Kevin Machado</p>
      <p>Cliente: {cliente}</p>
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
              <td>${item.precio}</td>
              <td>${item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />
      <p><strong>Total a pagar:</strong> ${total}</p>
      {pagoCon && <p><strong>Pago con:</strong> ${pagoCon}</p>}
      {pagoCon && <p><strong>Cambio:</strong> ${cambio}</p>}
      {notas && <p><strong>Notas:</strong> {notas}</p>}
      <p style={{ textAlign: "center", marginTop: "1em" }}>¡Gracias por tu compra!</p>

      {/* BOTONES PARA PANTALLA (NO SE IMPRIMEN) */}
      <div className="acciones">
        <button onClick={() => setTimeout(() => window.print(), 100)}>Confirmar e imprimir</button>
        <button onClick={() => setMostrarModal(false)}>Confirmar y no imprimir</button>
      </div>
    </div>

    {/* PANEL DERECHO - NO SE IMPRIME */}
    <div className="ticket-panel">
      <h3>Método de pago</h3>
      <label>
        <input
          type="checkbox"
          checked={metodoPago.efectivo}
          onChange={(e) =>
            setMetodoPago(prev => ({ ...prev, efectivo: e.target.checked }))
          }
        />
        Efectivo
      </label>
      <label>
        <input
          type="checkbox"
          checked={metodoPago.credito}
          onChange={(e) =>
            setMetodoPago(prev => ({ ...prev, credito: e.target.checked }))
          }
        />
        Crédito
      </label>

      <h4>Pagó con</h4>
      <input
        type="number"
        value={pagoCon}
        onChange={(e) => setPagoCon(Number(e.target.value))}
        placeholder="Ingrese el valor"
      />

      <h4>Agregar notas</h4>
      <textarea
        rows="4"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Escribe una nota aquí..."
      ></textarea>
    </div>
  </div>
</Modal>

    </main>
  );
};

export default Ventas;
