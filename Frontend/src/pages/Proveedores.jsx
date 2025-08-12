import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";
import { CreadorTabla } from "../components/CreadorTabla";
import ModalProveedor from "../components/ModalProveedor";
import ModalConfirmarOrden from "../components/ModalConfirmarOrden";
import BotonAgregar from "../components/BotonAgregar";
import BotonOrdenes from "../components/BotonOrdenes";
import BotonProveedores from "../components/BotonProveedores";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonAceptar from "../components/BotonAceptar";

const Proveedores = () => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");
  const [modoProveedor, setModoProveedor] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [tipoModal, setTipoModal] = useState("proveedor");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [registroEliminar, setRegistroEliminar] = useState(null);
  const [modalConfirmarOrden, setModalConfirmarOrden] = useState(false);
  const [ordenConfirmar, setOrdenConfirmar] = useState(null);
  const [modalMensaje, setModalMensaje] = useState({
    tipo: "",
    mensaje: "",
    visible: false,
  });

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 1500);
  };

  const urlProveedores = "/proveedores";
  const urlOrdenes = "/ordenes";

  const abrirModalAgregar = () => {
    setEditando(null);
    setTipoModal(modoProveedor ? "proveedor" : "orden");
    setModalAbierta(true);
  };

  const abrirModalConfirmarOrden = (orden) => {
    setOrdenConfirmar(orden);
    setModalConfirmarOrden(true);
  };

  useEffect(() => {
    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    const cargarProveedores = async () => {
      try {
        const respuesta = await api.get(urlProveedores);
        setProveedores(respuesta.data);
      } catch (error) {
        console.error("Error al cargar proveedores:", error.response?.status, error.response?.data);
        abrirModal("error", `Error al cargar proveedores: ${error.response?.data?.message || error.message}`);
      }
    };

    cargarProveedores();
  }, [token]);

  useEffect(() => {
    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    const cargarOrdenes = async () => {
      try {
        const response = await api.get(urlOrdenes);
        setOrdenes(response.data);
      } catch (error) {
        console.error("Error al cargar órdenes:", error.response?.status, error.response?.data);
        abrirModal("error", `Error al cargar órdenes: ${error.response?.data?.message || error.message}`);
      }
    };

    cargarOrdenes();
  }, [token]);

  const abrirModalEditar = (registro) => {
    const registroOriginal = modoProveedor
      ? proveedores.find((p) => p.idProveedor === registro.idProveedor)
      : ordenes.find((o) => o.idOrden === registro.idOrden);
    if (registroOriginal) {
      setEditando(registroOriginal);
      setTipoModal(modoProveedor ? "proveedor" : "orden");
      setModalAbierta(true);
    } else {
      abrirModal("error", "Registro no encontrado.");
    }
  };

  const abrirModalEliminar = (registro) => {
    setRegistroEliminar(registro);
    setConfirmarEliminacion(true);
  };

  const eliminarRegistro = async () => {
    try {
      if (modoProveedor) {
        await api.delete(`${urlProveedores}/${registroEliminar.idProveedor}`);
        const response = await api.get(urlProveedores);
        setProveedores(response.data);
      } else {
        await api.delete(`${urlOrdenes}/${registroEliminar.idOrden}`);
        const response = await api.get(urlOrdenes);
        setOrdenes(response.data);
      }
      setConfirmarEliminacion(false);
      setRegistroEliminar(null);
      abrirModal("exito", "Registro eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar:", error.response?.status, error.response?.data);
      abrirModal("error", `Error al eliminar: ${error.response?.data?.message || error.message}`);
    }
  };

  const guardarProveedor = async (nuevo) => {
    try {
      if (editando) {
        await api.put(`${urlProveedores}`, {
          idProveedor: nuevo.id,
          nombre: nuevo.nombre,
          telefono: nuevo.telefono,
          correo: nuevo.correo,
          direccion: nuevo.direccion,
        });
      } else {
        await api.post(urlProveedores, {
          nombre: nuevo.nombre,
          telefono: nuevo.telefono,
          correo: nuevo.correo,
          direccion: nuevo.direccion,
        });
      }
      const respuesta = await api.get(urlProveedores);
      setProveedores(respuesta.data);
      setModalAbierta(false);
      abrirModal("exito", "Proveedor guardado correctamente.");
    } catch (error) {
      console.error("Error al guardar proveedor:", error.response?.status, error.response?.data);
      abrirModal("error", `Error al guardar proveedor: ${error.response?.data?.message || error.message}`);
    }
  };

  const guardarOrden = async (nuevaOrden) => {
    try {
      const ordenData = {
        idOrden: editando ? parseInt(nuevaOrden.id) : undefined,
        proveedor: { idProveedor: parseInt(nuevaOrden.id) },
        materiaPrima: nuevaOrden.items.map((item) => ({
          idMateria: parseInt(item.idMateria),
          nombre: item.nombre,
          cantidad: parseFloat(item.cantidad),
        })),
        notas: nuevaOrden.notas || null,
        estado: false, // Estado Pendiente
        fecha: new Date().toISOString(),
        total: parseFloat(nuevaOrden.total) || 0,
      };

      if (editando) {
        await api.put(`${urlOrdenes}`, ordenData);
      } else {
        await api.post(urlOrdenes, ordenData);
      }

      const response = await api.get(urlOrdenes);
      setOrdenes(response.data);
      setModalAbierta(false);
      abrirModal("exito", "Orden guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar orden:", error.response?.status, error.response?.data);
      abrirModal("error", `Error al guardar orden: ${error.response?.data?.message || error.message}`);
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
    "ID Orden",
    "Nombre Proveedor",
    "Cantidad Artículos",
    "Notas",
    "Acciones",
  ];

  const registrosTabla = modoProveedor
    ? proveedores?.map((p) => ({
        idProveedor: p.idProveedor,
        nombre: p.nombre,
        telefono: p.telefono,
        correo: p.correo,
        direccion: p.direccion,
      })) ?? []
    : ordenes.map((orden) => ({
        idOrden: orden.idOrden,
        nombre: orden.proveedor?.nombre || "Desconocido",
        cantidadArticulos: orden.materiaPrima?.length || 0,
        notas: orden.notas || "",
        acciones: (
          <>
            <button
              className="btn btn-primary me-2"
              onClick={() => abrirModalEditar(orden)}
            >
              Editar
            </button>
            <button
              className="btn btn-danger me-2"
              onClick={() => abrirModalEliminar(orden)}
            >
              Eliminar
            </button>
            <button
              className="btn btn-success"
              onClick={() => abrirModalConfirmarOrden(orden)}
            >
              Confirmar Orden
            </button>
          </>
        ),
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

      <ModalConfirmarOrden
        isOpen={modalConfirmarOrden}
        onClose={() => setModalConfirmarOrden(false)}
        orden={ordenConfirmar}
        onConfirmar={() => {
          setModalConfirmarOrden(false);
          setOrdenConfirmar(null);
          abrirModal("exito", "Orden confirmada correctamente.");
          api.get(urlOrdenes).then((response) => setOrdenes(response.data));
        }}
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

      <Modal
        isOpen={modalMensaje.visible}
        onClose={() => setModalMensaje({ ...modalMensaje, visible: false })}
      >
        <div className="text-center p-3">
          <i
            className={
              modalMensaje.tipo === "exito"
                ? "bi bi-check-circle-fill text-success display-4 mb-2"
                : modalMensaje.tipo === "error"
                ? "bi bi-x-circle-fill text-danger display-4 mb-2"
                : "bi bi-exclamation-triangle-fill text-warning display-4 mb-2"
            }
          ></i>
          <h2>
            {modalMensaje.tipo === "exito"
              ? "¡Éxito!"
              : modalMensaje.tipo === "error"
              ? "Error"
              : "Advertencia"}
          </h2>
          <p>{modalMensaje.mensaje}</p>
        </div>
      </Modal>
    </main>
  );
};

export default Proveedores;