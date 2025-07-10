import React, { useState } from "react";
import { CreadorTabla } from "../components/CreadorTabla";
import "../styles/botones.css";
import BotonAgregar from "../components/botonAgregar";
import "../styles/inventario.css";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonAceptar from "../components/BotonAceptar";
import "../styles/proveedores.css"

const Proveedores = () => {
  const [modalAbierta, setModalAbierta] = useState(false);
  const [proveedorSelect, setProveedorSelect] = useState(null);
  const [registros, setRegistros] = useState([
  {
    id: 1001,
    nombre: "Distribuciones Andina",
    telefono: "3104567890",
    correo: "contacto@andina.com",
    direccion: "Cra 15 #45-67, Bogotá"
  },
  {
    id: 1002,
    nombre: "Suministros Rápidos",
    telefono: "3012345678",
    correo: "ventas@suministrosrapidos.com",
    direccion: "Cl 23 #12-34, Medellín"
  },
  {
    id: 1003,
    nombre: "Industrias JM",
    telefono: "3159876543",
    correo: "servicio@jmindustria.com",
    direccion: "Av 68 #56-78, Cali"
  },
  {
    id: 1004,
    nombre: "Papelería Express",
    telefono: "3023344556",
    correo: "pedidos@papeleriaexpress.com",
    direccion: "Calle 10 #7-80, Bucaramanga"
  },
  {
    id: 1005,
    nombre: "Ferretería El Tornillo",
    telefono: "3001122334",
    correo: "ferre@eltornillo.co",
    direccion: "Carrera 9 #20-55, Cartagena"
  }
]);


  const abrirModalAgregar = () => {
    setProveedorSelect(null);
    setModalAbierta(true);
  };

  const abrirModalEditar = (proveedor) => {
    setProveedorSelect(proveedor);
    setModalAbierta(true);
  };

  const cerrarModal = () => {
    setProveedorSelect(null);
    setModalAbierta(false);
  };

  const guardarProveedor = (e) => {
    e.preventDefault();
    const form = e.target;

    const nuevoRegistro = {
      id: proveedorSelect ? proveedorSelect.id : parseInt(form.id.value),
      nombre: form.nombre.value,
      telefono: form.telefono.value,
      correo: form.correo.value,
      direccion: form.direccion.value,
    };

    if (proveedorSelect) {
      setRegistros((prev) =>
        prev.map((r) => (r.id === proveedorSelect.id ? nuevoRegistro : r))
      );
    } else {
      const existe = registros.some((r) => r.id === nuevoRegistro.id);
      if (existe) {
        alert("Ya existe un proveedor con este ID");
        return;
      }
      setRegistros((prev) => [...prev, nuevoRegistro]);
    }

    cerrarModal();
  };

  const [modalConfirmacionAbierta, setModalConfirmacionAbierta] =
    useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  const confirmarEliminacion = (proveedor) => {
    setProveedorAEliminar(proveedor);
    setModalConfirmacionAbierta(true);
  };

  const cancelarEliminacion = () => {
    setProveedorAEliminar(null);
    setModalConfirmacionAbierta(false);
  };

  const eliminarProveedor = () => {
    setRegistros(registros.filter((r) => r.id !== proveedorAEliminar.id));
    cancelarEliminacion();
  };

  const cabeceros = [
    "Id",
    "Nombre",
    "Teléfono",
    "Correo electrónico",
    "Dirección",
  ];

  return (
    <main className="main-home proveedores inventario">
      <h1 className="titulo">Proveedores</h1>

      <div className="proveedores opciones">
        <BotonAgregar onClick={abrirModalAgregar} />
        <button className="btn-agregar"><a href="/ordenes">Ordenes de compra</a></button>
      </div>

      <CreadorTabla
        cabeceros={cabeceros}
        registros={registros}
        onEditar={abrirModalEditar}
        onEliminar={confirmarEliminacion}
      />

      <Modal isOpen={modalAbierta} onClose={cerrarModal}>
        <form onSubmit={guardarProveedor}>
          <div className="encabezado-modal">
            <h2>
              {proveedorSelect ? "Editar proveedor" : "Agregar proveedor"}
            </h2>
          </div>

          <div className="grupo-formulario">
            <label>ID:</label>
            <input
              type="number"
              name="id"
              className="form-control"
              defaultValue={proveedorSelect?.id || ""}
              placeholder="ID"
              required
              disabled={!!proveedorSelect}
            />
          </div>

          <div className="grupo-formulario">
            <label>Nombre:</label>
            <input
              name="nombre"
              className="form-control"
              defaultValue={proveedorSelect?.nombre || ""}
              placeholder="Nombre"
              required
            />
          </div>

          <div className="grupo-formulario">
            <label>Teléfono:</label>
            <input
              name="telefono"
              className="form-control"
              defaultValue={proveedorSelect?.telefono || ""}
              placeholder="Teléfono"
              required
            />
          </div>

          <div className="grupo-formulario">
            <label>Correo electrónico:</label>
            <input
              name="correo"
              type="email"
              className="form-control"
              defaultValue={proveedorSelect?.correo || ""}
              placeholder="Correo electrónico"
              required
            />
          </div>

          <div className="grupo-formulario">
            <label>Dirección:</label>
            <input
              name="direccion"
              className="form-control"
              defaultValue={proveedorSelect?.direccion || ""}
              placeholder="Dirección"
              required
            />
          </div>

          <div className="pie-modal">
            <BotonCancelar onClick={cerrarModal} />
            <BotonAceptar />
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalConfirmacionAbierta} onClose={cancelarEliminacion}>
        <div className="encabezado-modal">
          <h2>Confirmar Eliminación</h2>
        </div>
        <p>
          ¿Desea eliminar el proveedor{" "}
          <strong>{proveedorAEliminar?.nombre}</strong>?
        </p>
        <div className="pie-modal">
          <BotonCancelar onClick={cancelarEliminacion} />
          <BotonAceptar onClick={eliminarProveedor} />
        </div>
      </Modal>
    </main>
  );
};

export default Proveedores;
