import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import BotonAceptar from "../components/BotonAceptar";
import BotonCancelar from "../components/BotonCancelar";
import api from "../api/axiosInstance";

const ModalConfirmarOrden = ({ isOpen, onClose, orden, onConfirmar }) => {
  const [items, setItems] = useState([]);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
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

  useEffect(() => {
    if (!isOpen || !orden) return;

    const fetchCostos = async () => {
      try {
        const updatedItems = await Promise.all(
          orden.materiaPrima.map(async (item) => {
            try {
              const response = await api.get(`/lotes/ultimo/${item.idMateria}`);
              return {
                idMateria: item.idMateria,
                nombre: item.nombre || "",
                cantidad: parseFloat(item.cantidad) || 0,
                costoUnitario: parseInt(response.data.costoUnitario) || 0,
              };
            } catch (error) {
              console.error(
                `Error al cargar costo para idMateria ${item.idMateria}:`,
                error
              );
              return {
                idMateria: item.idMateria,
                nombre: item.nombre || "",
                cantidad: parseFloat(item.cantidad) || 0,
                costoUnitario: 0,
              };
            }
          })
        );
        setItems(updatedItems);
      } catch (error) {
        console.error("Error al cargar costos:", error);
        abrirModal("error", "Error al cargar costos de los lotes.");
      }
    };

    fetchCostos();
  }, [isOpen, orden]);

  const handleCostoChange = (idMateria, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.idMateria === idMateria
          ? { ...item, costoUnitario: parseInt(value) || 0 }
          : item
      )
    );
  };

  const confirmarOrden = async () => {
    try {
      const lotes = items.map((item) => ({
        idMateria: item.idMateria,
        costoUnitario: item.costoUnitario,
        cantidad: item.cantidad,
        idProveedor: orden.proveedor.idProveedor,
      }));

      // --- CORRECCIÓN AQUÍ: Llamar a la nueva ruta de confirmación ---
      // Se envía el id de la orden en el path y el objeto OrdenConfirmacionDTO en el body
      const body = { lotes }; // El body debe ser un objeto con la lista de lotes
      await api.post(`/ordenes/confirmar/${orden.idOrden}`, body);

      // Si la llamada es exitosa, cerramos el modal y actualizamos
      setModalConfirmacion(false);
      onConfirmar();
    } catch (error) {
      console.error(
        "Error al confirmar orden:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al confirmar orden: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="encabezado-modal">
          <h2>Confirmar Orden #{orden?.idOrden}</h2>
        </div>
        <div className="grupo-formulario">
          <h3>Productos</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Costo Unitario</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.idMateria}>
                  <td>{item.nombre}</td>
                  <td>{item.cantidad.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      value={item.costoUnitario}
                      onChange={(e) =>
                        handleCostoChange(item.idMateria, e.target.value)
                      }
                      className="form-control"
                      step="1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pie-modal">
          <BotonCancelar onClick={onClose} />
          <BotonAceptar
            onClick={() => setModalConfirmacion(true)}
            disabled={items.some(
              (item) => item.costoUnitario <= 0 || item.cantidad <= 0
            )}
          />
        </div>
      </Modal>

      {modalConfirmacion && (
        <Modal
          isOpen={modalConfirmacion}
          onClose={() => setModalConfirmacion(false)}
        >
          <div className="encabezado-modal">
            <h2>Confirmar Orden</h2>
          </div>
          <p>¿Está seguro de que desea confirmar la orden #{orden?.idOrden}?</p>
          <div className="pie-modal">
            <BotonCancelar onClick={() => setModalConfirmacion(false)} />
            <BotonAceptar onClick={confirmarOrden} />
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
    </>
  );
};

export default ModalConfirmarOrden;
