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

  const url = "http://localhost:8080/angora/api/v1/proveedores";

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

    cargarProveedores();
  }, []);

  useEffect(() => {
    const cargarOrdenes = async () => {
      try {
        const response = await axios.get("http://localhost:8080/angora/api/v1/ordenes");
        setOrdenes(response.data);
      } catch (error) {
        console.error("Error al cargar órdenes:", error);
      }
    };

    cargarOrdenes();
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
    } else {
      const id = registroEliminar.id || registroEliminar.idOrden;
      await axios.delete(`http://localhost:8080/angora/api/v1/ordenes/${id}`);

      const response = await axios.get("http://localhost:8080/angora/api/v1/ordenes");
      setOrdenes(response.data);
    }

    setConfirmarEliminacion(false);
    setRegistroEliminar(null);
  } catch (error) {
    console.error("Error al eliminar:", error);
    alert("Hubo un problema al eliminar el registro.");
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
    } catch (error) {
      console.log("Error al guardar: ", error);
    }
  };

  const guardarOrden = async (nuevaOrden) => {
    try {
      const response = await axios.post("http://localhost:8080/angora/api/v1/ordenes", {
        proveedor: { idProveedor: nuevaOrden.id },
        materiaPrima: nuevaOrden.items.map((item) => ({
          nombre: item.nombre,
          cantidad: parseInt(item.cantidad),
          // si tu entidad MateriaPrima espera más datos, agrégalos aquí
        })),
        notas: nuevaOrden.notas,
        estado: true,
        fecha: new Date(),
      });

      // Recargar órdenes desde el backend
      const ordenesResponse = await axios.get("http://localhost:8080/angora/api/v1/ordenes");
      setOrdenes(ordenesResponse.data);
      setModalAbierta(false);
    } catch (error) {
      console.error("Error al guardar orden:", error);
      alert("Hubo un problema al guardar la orden.");
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
      id: p.idProveedor ?? p.id,
      nombre: p.nombre,
      telefono: p.telefono,
      correo: p.correo,
      direccion: p.direccion,
    })) ?? []
  : ordenes.map((orden) => ({
      id: orden.idOrden ?? orden.id,
      nombre: orden.proveedor?.nombre || "Desconocido",
      cantidadArticulos: orden.materiaPrima?.length || 0,
      total: "N/A", // opcional si no tienes precios en el backend
      notas: orden.notas,
    }));


  return (
    <main className="proveedores inventario">
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
