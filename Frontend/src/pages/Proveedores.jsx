import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";
import ModalProveedor from "../components/ModalProveedor";
import ModalConfirmarOrden from "../components/ModalConfirmarOrden";
import BotonAgregar from "../components/botonAgregar";
import BotonOrdenes from "../components/BotonOrdenes";
import BotonProveedores from "../components/BotonProveedores";
import Modal from "../components/Modal";
import BotonCancelar from "../components/BotonCancelar";
import BotonAceptar from "../components/BotonAceptar";
import { CreadorTablaOrdenes } from "../components/CreadorTablaOrdenes";
import { CreadorTablaProveedores } from "../components/CreadorTablaProveedores";

const Proveedores = () => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");
  const [modoProveedor, setModoProveedor] = useState(true);
  const [verInactivos, setVerInactivos] = useState(false); // Nuevo estado
  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [tipoModal, setTipoModal] = useState("proveedor");
  const [confirmarAccion, setConfirmarAccion] = useState(false);
  const [registroAccion, setRegistroAccion] = useState(null);
  const [tipoAccion, setTipoAccion] = useState(""); // "desactivar" o "reactivar"
  const [modalConfirmarOrden, setModalConfirmarOrden] = useState(false);
  const [ordenConfirmar, setOrdenConfirmar] = useState(null);
  const [modalMensaje, setModalMensaje] = useState({
    tipo: "",
    mensaje: "",
    visible: false,
  });

  // Modifica la función abrirModal para que solo se llame cuando realmente queremos mostrar el mensaje
  const abrirModal = (tipo, mensaje) => {
    if (!mensaje) return; // Si no hay mensaje, no mostramos nada
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
      const ordenesPendientes = response.data.filter(
        (orden) => orden.estado === false
      );
      setOrdenes(ordenesPendientes);
    } catch (error) {
      console.error(
        "Error al cargar órdenes:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al cargar órdenes: ${error.response?.data?.message || error.message
        }`
      );
      setOrdenes([]);
    }
  };

  // Nueva función para cargar proveedores según el estado
  const cargarProveedores = async () => {
    try {
      const endpoint = verInactivos
        ? `${urlProveedores}/inactivos`
        : urlProveedores;
      const respuesta = await api.get(endpoint);
      setProveedores(respuesta.data);
    } catch (error) {
      console.error(
        "Error al cargar proveedores:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al cargar proveedores: ${error.response?.data?.message || error.message
        }`
      );
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

  // Nueva función para alternar entre activos e inactivos
  const alternarVistaProveedores = () => {
    setVerInactivos(!verInactivos);
  };

  useEffect(() => {
    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    if (modoProveedor) {
      cargarProveedores();
    } else {
      cargarOrdenesPendientes();
      setVerInactivos(false); // Resetear vista de inactivos al cambiar a órdenes
    }
  }, [modoProveedor, verInactivos, token]);

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

  // Función modificada para manejar desactivar/reactivar
  const abrirModalAccion = (registro, accion) => {
    setRegistroAccion(registro);
    setTipoAccion(accion);
    setConfirmarAccion(true);
  };

  // Función modificada para ejecutar la acción
  const ejecutarAccion = async () => {
    try {
      if (modoProveedor) {
        if (tipoAccion === "desactivar") {
          const conteoRes = await api.get(
            `${urlOrdenes}/pendientes/${registroAccion.idProveedor}`
          );

          if (conteoRes.data > 0) {
            abrirModal(
              "error",
              `No se puede eliminar este proveedor porque tiene ${conteoRes.data} orden(es) de compra pendiente(s).`
            );
            return;
          }

          await api.put(
            `${urlProveedores}/desactivar/${registroAccion.idProveedor}`
          );
          abrirModal("exito", "Proveedor desactivado correctamente.");
        } else if (tipoAccion === "reactivar") {
          await api.put(
            `${urlProveedores}/reactivar/${registroAccion.idProveedor}`
          );
          abrirModal("exito", "Proveedor reactivado correctamente.");
        }
        await cargarProveedores();
      } else {
        await api.delete(`${urlOrdenes}/${registroAccion.idOrden}`);
        await cargarOrdenesPendientes();
        abrirModal("exito", "Orden eliminada correctamente.");
      }

      setConfirmarAccion(false);
      setRegistroAccion(null);
      setTipoAccion("");
    } catch (error) {
      console.error(
        `Error al ${tipoAccion}:`,
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al ${tipoAccion}: ${error.response?.data?.message || error.message
        }`
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
          activo: editando.activo, // Mantener el estado actual
        });
      } else {
        await api.post(urlProveedores, {
          nombre: nuevo.nombre,
          telefono: nuevo.telefono,
          correo: nuevo.correo,
          direccion: nuevo.direccion,
        });
      }
      await cargarProveedores();
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
        `Error al guardar proveedor: ${error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Modifica la función guardarOrden
  const guardarOrden = async (nuevaOrden) => {
    try {
      const ordenData = {
        idOrden: nuevaOrden.idOrden || undefined,
        proveedor: { idProveedor: parseInt(nuevaOrden.id) },
        ordenMateriaPrimas: nuevaOrden.items.map((item) => ({
          materiaPrima: { idMateria: item.idMateria },
          cantidad: parseFloat(item.cantidad),
          costoUnitario: item.costoUnitario || 0,
          id: item.id || undefined
        })),
        notas: nuevaOrden.notas || null,
        estado: editando?.estado ?? false,
        fecha: editando?.fecha ?? new Date().toISOString(),
        total: nuevaOrden.total || 0,
      };

      if (ordenData.idOrden) {
        await api.put(`${urlOrdenes}`, ordenData);
      } else {
        await api.post(urlOrdenes, ordenData);
      }

      await cargarOrdenesPendientes();
      setModalAbierta(false);
      // Solo mostramos el mensaje aquí, después de que todo fue exitoso
      abrirModal("exito", "Orden guardada correctamente.");

    } catch (error) {
      console.error("Error al guardar orden:", error);
      abrirModal("error", "Error al guardar la orden.");
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

  // Función para obtener el texto del botón de acción
  const obtenerTextoAccion = () => {
    if (!modoProveedor) return "Eliminar";
    return verInactivos ? "Reactivar" : "Desactivar";
  };

  // Función para obtener la clase CSS del botón de acción
  const obtenerClaseAccion = () => {
    if (!modoProveedor) return "btn-danger";
    return verInactivos ? "btn-success" : "btn-warning";
  };

  return (
    <main className="proveedores inventario">
      <h1 className="titulo">
        {modoProveedor
          ? `Proveedores ${verInactivos ? "Inactivos" : "Activos"}`
          : "Órdenes de Compra"}
      </h1>
      <div className="proveedores opciones">
        <BotonAgregar onClick={abrirModalAgregar} />
        {modoProveedor ? (
          <>
            <BotonOrdenes onClick={() => setModoProveedor(false)} />
            <button
              onClick={alternarVistaProveedores}
              className={`btn ${verInactivos ? "btn-primary" : "btn-secondary"
                }`}
            >
              {verInactivos ? "Ver Activos" : "Ver Inactivos"}
            </button>
          </>
        ) : (
          <BotonProveedores onClick={() => setModoProveedor(true)} />
        )}
      </div>
      {modoProveedor ? (
        <CreadorTablaProveedores
          cabeceros={["ID", "Nombre", "Dirección", "Correo", "Telefono"]}
          campos={["idProveedor", "nombre", "direccion", "correo", "telefono"]}
          registros={registrosTabla}
          onEditar={(registro) => abrirModalEditar(registro)}
          onEliminar={(registro) =>
            abrirModalAccion(
              registro,
              verInactivos ? "reactivar" : "desactivar"
            )
          }
          modo={verInactivos ? "reactivar" : "desactivar"}
        />
      ) : (
        <CreadorTablaOrdenes
          cabeceros={cabecerosOrden}
          registros={ordenes}
          onEditar={abrirModalEditar}
          onEliminar={(registro) => abrirModalAccion(registro, "eliminar")}
          onConfirmar={abrirModalConfirmarOrden}
        />
      )}
      <ModalProveedor
        isOpen={modalAbierta}
        onClose={() => setModalAbierta(false)}
        tipo={tipoModal}
        onGuardar={modoProveedor ? guardarProveedor : guardarOrden} // Simplificado
        datosIniciales={editando}
      />
      <ModalConfirmarOrden
        isOpen={modalConfirmarOrden}
        onClose={() => {
          setModalConfirmarOrden(false);
          setOrdenConfirmar(null);
        }}
        orden={ordenConfirmar}
        onConfirmar={async (idOrden, confirmacionData) => {
          try {
            await api.post(`/ordenes/confirmar/${idOrden}`, confirmacionData);
            abrirModal("exito", "Orden confirmada exitosamente. Los lotes han sido creados e ingresados al inventario.");
            setModalConfirmarOrden(false);
            setOrdenConfirmar(null);
            if (!modoProveedor) {
              cargarOrdenesPendientes();
            }
          } catch (error) {
            console.error("Error al confirmar orden:", error);
            const mensajeError = error.response?.data || error.message;
            abrirModal("error", `Error al confirmar orden: ${mensajeError}`);
          }
        }}
      />
      {confirmarAccion && (
        <Modal
          isOpen={confirmarAccion}
          onClose={() => setConfirmarAccion(false)}
        >
          <div className="encabezado-modal">
            <h2>
              Confirmar{" "}
              {tipoAccion === "desactivar"
                ? "Desactivación"
                : tipoAccion === "reactivar"
                  ? "Reactivación"
                  : "Eliminación"}
            </h2>
          </div>
          <p>
            ¿Desea{" "}
            {tipoAccion === "desactivar"
              ? "desactivar"
              : tipoAccion === "reactivar"
                ? "reactivar"
                : "eliminar"}{" "}
            {modoProveedor ? "el proveedor" : "la orden"}{" "}
            <strong>{registroAccion?.nombre}</strong>?
          </p>
          <div className="pie-modal">
            <BotonCancelar onClick={() => setConfirmarAccion(false)} />
            <BotonAceptar onClick={ejecutarAccion} />
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