import React, { useEffect, useState } from "react";
import { CreadorTabla } from "../components/CreadorTabla";
import ModalProveedor from "../components/ModalProveedor";
import BotonAgregar from "../components/botonAgregar";
import BotonOrdenes from "../components/BotonOrdenes";
import BotonProveedores from "../components/BotonProveedores";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonAceptar from "../components/BotonAceptar";
import axios from "axios";

const Proveedores = () => {
  const [modoProveedor, setModoProveedor] = useState(true);

  const url = "http://localhost:8080/proveedores";

  const [proveedores, setProveedores] = useState();

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

  useEffect(() => {
  const cargarProveedores = async () => {
    try {
      const respuesta = await axios.get(url);
      setProveedores(respuesta.data);
    } catch (error) {
      console.log("Error al cargar proveedores: ", error);
    }
  };

  cargarProveedores(); // ¡Esto faltaba!
}, []);


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

  const eliminarRegistro = async () => {
  try {
    if (modoProveedor) {
      const id = registroEliminar.idProveedor || registroEliminar.id;
      await axios.delete(`${url}/${id}`);

      const response = await axios.get(url);
      setProveedores(response.data);
    }

    setConfirmarEliminacion(false);
    setRegistroEliminar(null);
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
  }
};


  const guardarProveedor = async (nuevo) => {
  try {
    if (editando) {
      // Si estás editando, haz PUT con el ID correcto
      await await axios.put(`${url}`, {

        ...nuevo,
        idProveedor: nuevo.id, // importante para que coincida con tu entidad
      });
    } else {
      await axios.post(url, nuevo);
    }

    const respuesta = await axios.get(url);
    setProveedores(respuesta.data);
    setModalAbierta(false); // cerrar modal después de guardar
  } catch (error) {
    console.log("Error al guardar: ", error);
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
  ? proveedores?.map((p) => ({
      id: p.idProveedor ?? p.id,         // 1. ID
      nombre: p.nombre,                  // 2. Nombre
      telefono: p.telefono,              // 3. Teléfono
      correo: p.correo,                  // 4. Correo electrónico
      direccion: p.direccion,            // 5. Dirección
    })) ?? []
  : ordenes.map((orden) => ({
      id: orden.id,                      // 1. ID
      nombre: orden.nombre,              // 2. Nombre
      cantidadArticulos: orden.cantidadArticulos, // 3. Cantidad artículos
      total: orden.total,                // 4. Total
      notas: orden.notas,                // 5. Notas
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
