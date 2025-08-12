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
import { CreadorTablaOrdenes } from "../components/CreadorTablaOrdenes"; // Import the new component

const Proveedores = () => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");
  const [modoProveedor, setModoProveedor] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [editando, setEditando] = useState(null); // 'editando' holds the original object being edited
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
    setEditando(null); // Ensure 'editando' is null for new entries
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
      setEditando(registroOriginal); // Sets 'editando' with the full original object
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
      if (editando) { // If 'editando' exists, it's an update
        await api.put(`${urlProveedores}`, {
          idProveedor: nuevo.id, // 'id' from formulario is idProveedor
          nombre: nuevo.nombre,
          telefono: nuevo.telefono,
          correo: nuevo.correo,
          direccion: nuevo.direccion,
        });
      } else { // Otherwise, it's a new entry
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
        // idOrden will be undefined for new orders, or the actual ID for updates
        idOrden: nuevaOrden.idOrden || undefined, 
        proveedor: { idProveedor: parseInt(nuevaOrden.id) }, // nuevaOrden.id is the supplier ID from the form
        // Map items to the structure expected by backend's OrdenMateriaPrima
        ordenMateriaPrimas: nuevaOrden.items.map((item) => ({
          id: item.id || undefined, // Include item ID for updates of OrdenMateriaPrima
          materiaPrima: { idMateria: parseInt(item.idMateria) }, // Ensure ID is parsed as integer
          cantidad: parseFloat(item.cantidad),
          // costoUnitario is NOT included here, it will be set on confirmation
        })),
        notas: nuevaOrden.notas || null,
        // Preserve existing state/date on edit, default to false/new date on create
        // IMPORTANT: Use 'editando' safely with optional chaining for existing order data
        estado: nuevaOrden.idOrden ? (editando?.estado ?? false) : false, 
        fecha: nuevaOrden.idOrden ? (editando?.fecha ?? new Date().toISOString()) : new Date().toISOString(),
        total: nuevaOrden.total || 0, // Total is optional/calculated in backend later
      };

      console.log("Datos de la Orden a enviar al backend:", ordenData); // Log para depuración

      if (nuevaOrden.idOrden) { // If idOrden exists, it's an update (PUT)
        await api.put(`${urlOrdenes}`, ordenData); // No id in URL for PUT, as per backend design
      } else { // Otherwise, it's a creation (POST)
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
    // "Acciones" header will be added by CreadorTablaOrdenes
  ];

  // The 'registrosTabla' mapping is for CreadorTabla (for proveedores)
  // CreadorTablaOrdenes will directly use the 'ordenes' state
  const registrosTabla = modoProveedor
    ? proveedores?.map((p) => ({
        idProveedor: p.idProveedor,
        nombre: p.nombre,
        telefono: p.telefono,
        correo: p.correo,
        direccion: p.direccion,
      })) ?? []
    : []; // No mapping needed here, pass 'ordenes' directly to CreadorTablaOrdenes

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
          registros={registrosTabla} // This uses the mapped data
          onEditar={abrirModalEditar}
          onEliminar={abrirModalEliminar}
        />
      ) : (
        <CreadorTablaOrdenes // Use the specific table for orders
          cabeceros={cabecerosOrden}
          registros={ordenes} // Pass the raw 'ordenes' array
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
            const response = await api.get(urlOrdenes);
            setOrdenes(response.data);
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
