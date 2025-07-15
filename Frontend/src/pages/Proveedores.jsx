import React, { useState } from "react";
import { CreadorTabla } from "../components/CreadorTabla";
import ModalProveedor from "../components/ModalProveedor";
import BotonAgregar from "../components/botonAgregar";
import BotonOrdenes from "../components/BotonOrdenes";
import BotonProveedores from "../components/BotonProveedores";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonAceptar from "../components/BotonAceptar";

const Proveedores = () => {
  const [modoProveedor, setModoProveedor] = useState(true);

  const [proveedores, setProveedores] = useState([
    {
      id: 1001,
      nombre: "Distribuciones Andina",
      telefono: "3104567890",
      correo: "contacto@andina.com",
      direccion: "Cra 15 #45-67, Bogotá",
    },
    {
      id: 1002,
      nombre: "Suministros Rápidos",
      telefono: "3012345678",
      correo: "ventas@suministrosrapidos.com",
      direccion: "Cl 23 #12-34, Medellín",
    },
  ]);

  const [ordenes, setOrdenes] = useState([]);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [tipoModal, setTipoModal] = useState("proveedor"); // 'proveedor' | 'orden'
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [registroEliminar, setRegistroEliminar] = useState(null);

  const abrirModalAgregar = () => {
    setEditando(null);
    setTipoModal(modoProveedor ? "proveedor" : "orden");
    setModalAbierta(true);
  };

  const abrirModalEditar = (registro) => {
    const ordenOriginal = ordenes.find((o) => o.id === registro.id) || registro;
    setEditando(ordenOriginal);
    setTipoModal(modoProveedor ? "proveedor" : "orden");
    setModalAbierta(true);
  };

  const abrirModalEliminar = (registro) => {
    setRegistroEliminar(registro);
    setConfirmarEliminacion(true);
  };

  const eliminarRegistro = () => {
    if (modoProveedor) {
      setProveedores((prev) => prev.filter((p) => p.id !== registroEliminar.id));
    } else {
      setOrdenes((prev) => prev.filter((o) => o.id !== registroEliminar.id));
    }
    setConfirmarEliminacion(false);
    setRegistroEliminar(null);
  };

  const guardarProveedor = (nuevo) => {
    if (editando) {
      setProveedores((prev) =>
        prev.map((p) => (p.id === editando.id ? nuevo : p))
      );
    } else {
      setProveedores((prev) => [...prev, nuevo]);
    }
  };

  const guardarOrden = (nuevaOrden) => {
    if (editando) {
      setOrdenes((prev) =>
        prev.map((o) => (o.id === editando.id ? nuevaOrden : o))
      );
    } else {
      setOrdenes((prev) => [...prev, nuevaOrden]);
    }
  };

  const cabecerosProveedor = [
    "ID",
    "Nombre",
    "Teléfono",
    "Correo electrónico",
    "Dirección",
  ];
  const cabecerosOrden = [
    "ID",
    "Nombre",
    "Cantidad artículos",
    "Total",
    "Notas",
  ];

  const registrosTabla = modoProveedor
    ? proveedores
    : ordenes.map((orden) => ({
        id: orden.id,
        nombre: orden.nombre,
        cantidadArticulos: orden.cantidadArticulos,
        total: orden.total,
        notas: orden.notas,
      }));

  return (
    <main className="main-home proveedores inventario">
      <h1 className="titulo">
        {modoProveedor ? "Proveedores" : "Órdenes de Compra"}
      </h1>

      <div className="proveedores opciones">
        <BotonAgregar onClick={abrirModalAgregar} />
        {modoProveedor ? (
          <BotonOrdenes onClick={() => setModoProveedor(false)} />
        ) : (
          <BotonProveedores onClick={() => setModoProveedor(true)} />
        )}
      </div>

      <CreadorTabla
        cabeceros={modoProveedor ? cabecerosProveedor : cabecerosOrden}
        registros={registrosTabla}
        onEditar={abrirModalEditar}
        onEliminar={abrirModalEliminar}
      />

      <ModalProveedor
        isOpen={modalAbierta}
        onClose={() => setModalAbierta(false)}
        tipo={tipoModal}
        onGuardar={modoProveedor ? guardarProveedor : guardarOrden}
        datosIniciales={editando}
      />

      {confirmarEliminacion && (
        <Modal
          isOpen={confirmarEliminacion}
          onClose={() => setConfirmarEliminacion(false)}
        >
          <div className="encabezado-modal">
            <h2>Confirmar Eliminación</h2>
          </div>
          <p>
            ¿Desea eliminar {modoProveedor ? "el proveedor" : "la orden"}{" "}
            <strong>{registroEliminar?.nombre}</strong>?
          </p>
          <div className="pie-modal">
            <BotonCancelar onClick={() => setConfirmarEliminacion(false)} />
            <BotonAceptar onClick={eliminarRegistro} />
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Proveedores;
