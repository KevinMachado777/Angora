import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";
import { CreadorTabla } from "../components/CreadorTabla";
import ModalProveedor from "../components/ModalProveedor";
import ModalConfirmarOrden from "../components/ModalConfirmarOrden";
import BotonAgregar from "../components/botonAgregar";
import BotonOrdenes from "../components/BotonOrdenes";
import BotonProveedores from "../components/BotonProveedores";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonAceptar from "../components/BotonAceptar";
import { CreadorTablaOrdenes } from "../components/CreadorTablaOrdenes";

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

  // Función reutilizable para cargar órdenes pendientes
  const cargarOrdenesPendientes = async () => {
    try {
      const response = await api.get(urlOrdenes);
      console.log("Órdenes recibidas:", response.data);
      const ordenesPendientes = response.data.filter((orden) => orden.estado === false);
      setOrdenes(ordenesPendientes);
    } catch (error) {
      console.error(
        "Error al cargar órdenes:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al cargar órdenes: ${
          error.response?.data?.message || error.message
        }`
      );
      setOrdenes([]);
    }
  };

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
        console.error(
          "Error al cargar proveedores:",
          error.response?.status,
          error.response?.data
        );
        abrirModal(
          "error",
          `Error al cargar proveedores: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    };

    if (modoProveedor) {
      cargarProveedores();
    } else {
      cargarOrdenesPendientes();
    }
  }, [modoProveedor, token]);

  const abrirModalEditar = (registro) => {
    const registroOriginal = modoProveedor
      ? proveedores.find((p) => p.idProveedor === registro.idProveedor)
      : ordenes.find((o) => o.idOrden === registro.idOrden);
    if (registroOriginal) {
      console.log("Registro original para edición:", registroOriginal);
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
      // 1️⃣ Verificar si el proveedor tiene órdenes abiertas
      const ordenesRes = await api.get(
        `${urlOrdenes}?idProveedor=${registroEliminar.idProveedor}&estado=false`
      );

      if (ordenesRes.data.length > 0) {
        abrirModal(
          "error",
          "No se puede eliminar este proveedor porque tiene órdenes de compra abiertas."
        );
        return; // Cancelar eliminación
      }

      // 2️⃣ Eliminar proveedor si no tiene órdenes abiertas
      await api.delete(`${urlProveedores}/${registroEliminar.idProveedor}`);
      const response = await api.get(urlProveedores);
      setProveedores(response.data);
    } else {
      await api.delete(`${urlOrdenes}/${registroEliminar.idOrden}`);
      await cargarOrdenesPendientes();
    }

    setConfirmarEliminacion(false);
    setRegistroEliminar(null);
    abrirModal("exito", "Registro eliminado correctamente.");
  } catch (error) {
    console.error(
      "Error al eliminar:",
      error.response?.status,
      error.response?.data
    );
    abrirModal(
      "error",
      `Error al eliminar: ${error.response?.data?.message || error.message}`
    );
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
      console.error(
        "Error al guardar proveedor:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al guardar proveedor: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const guardarOrden = async (nuevaOrden) => {
    try {
      console.log("nuevaOrden recibida en guardarOrden:", nuevaOrden);

      const ordenData = {
        idOrden: nuevaOrden.idOrden || undefined,
        proveedor: { idProveedor: parseInt(nuevaOrden.id) },
        ordenMateriaPrimas: nuevaOrden.items.map((item) => {
          console.log("Item antes de mapear:", item);
          const parsedIdMateria = parseInt(item.idMateria);
          if (
            !parsedIdMateria ||
            isNaN(parsedIdMateria) ||
            parsedIdMateria <= 0
          ) {
            throw new Error(
              `ID de Materia Prima inválido para el ítem: ${JSON.stringify(item)}`
            );
          }

          const ordenMateriaPrimaObj = {
            materiaPrima: { idMateria: parsedIdMateria },
            cantidad: parseFloat(item.cantidad),
          };

          if (item.id) {
            ordenMateriaPrimaObj.id = item.id;
          }

          return ordenMateriaPrimaObj;
        }),
        notas: nuevaOrden.notas || null,
        estado: editando?.estado ?? false,
        fecha: editando?.fecha ?? new Date().toISOString(),
        total: nuevaOrden.total || 0,
      };

      console.log("Datos de la Orden a enviar al backend:", ordenData);

      if (ordenData.idOrden) {
        console.log("Enviando PUT:", ordenData);
        await api.put(`${urlOrdenes}`, ordenData);
      } else {
        console.log("Enviando POST:", ordenData);
        await api.post(urlOrdenes, ordenData);
      }

      await cargarOrdenesPendientes(); // Usar la función reutilizable
      setModalAbierta(false);
      abrirModal("exito", "Orden guardada correctamente.");
    } catch (error) {
      console.error(
        "Error al guardar orden:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al guardar orden: ${
          error.response?.data?.message || error.message
        }`
      );
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
  ];

  const registrosTabla = modoProveedor
    ? proveedores?.map((p) => ({
        id: p.idProveedor,
        nombre: p.nombre,
        teléfono: p.telefono,
        correoelectrónico: p.correo,
        dirección: p.direccion,
        original: p,
      })) ?? []
    : [];

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
      {modoProveedor ? (
        <CreadorTabla
          cabeceros={cabecerosProveedor}
          registros={registrosTabla}
          onEditar={(registro) =>
            abrirModalEditar(registro.original || registro)
          }
          onEliminar={(registro) =>
            abrirModalEliminar(registro.original || registro)
          }
        />
      ) : (
        <CreadorTablaOrdenes
          cabeceros={cabecerosOrden}
          registros={ordenes}
          onEditar={abrirModalEditar}
          onEliminar={abrirModalEliminar}
          onConfirmar={abrirModalConfirmarOrden}
        />
      )}
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
        onConfirmar={async () => {
          setModalConfirmarOrden(false);
          setOrdenConfirmar(null);
          abrirModal("exito", "Orden confirmada correctamente.");
          try {
            await cargarOrdenesPendientes(); // Usar la función reutilizable
          } catch (error) {
            console.error("Error al recargar órdenes:", error);
            abrirModal("error", "Error al recargar la lista de órdenes.");
          }
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