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

  const [totalOrden, setTotalOrden] = useState(0);
  
  useEffect(() => {
    const total = items.reduce((total, item) => {
      return total + item.costoUnitario * item.cantidad;
    }, 0);
    setTotalOrden(total);
  }, [items]);

  useEffect(() => {
    const fetchCostos = async () => {
      try {
        const updatedItems = await Promise.all(
          orden.ordenMateriaPrimas.map(async (item) => {
            try {
              console.log(
                `Consultando costo para idMateria ${item.materiaPrima.idMateria}`
              );
              const response = await api.get(
                `/lotes/ultimo/${item.materiaPrima.idMateria}`
              );
              console.log(
                `Respuesta para idMateria ${item.materiaPrima.idMateria}:`,
                response.data
              );
              return {
                id: item.id,
                idMateria: item.materiaPrima.idMateria,
                nombre: item.materiaPrima.nombre || "",
                cantidad: parseFloat(item.cantidad) || 0,
                costoUnitario: parseFloat(response.data.costoUnitario) || 0,
              };
            } catch (error) {
              console.error(
                `Error al cargar costo para idMateria ${item.materiaPrima.idMateria}:`,
                error.response?.status,
                error.response?.data
              );
              return {
                id: item.id,
                idMateria: item.materiaPrima.idMateria,
                nombre: item.materiaPrima.nombre || "",
                cantidad: parseFloat(item.cantidad) || 0,
                costoUnitario: 0,
              };
            }
          })
        );
        console.log("Ítems actualizados:", updatedItems);
        setItems(updatedItems);
      } catch (error) {
        console.error("Error general al procesar ítems:", error);
        abrirModal("error", "Error al procesar los ítems de la orden.");
        setItems([]);
      }
    };

    fetchCostos();
  }, [isOpen, orden]);

  const handleCostoChange = (idMateria, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.idMateria === idMateria
          ? { ...item, costoUnitario: parseFloat(value) || 0 }
          : item
      )
    );
  };

  const confirmarOrden = async () => {
    try {
      const lotes = items.map((item) => ({
        id: item.id || null,
        idMateria: item.idMateria,
        costoUnitario: item.costoUnitario,
        cantidad: item.cantidad,
        idProveedor: orden.proveedor.idProveedor,
      }));

      const body = { lotes, totalOrden };
      await api.post(`/ordenes/confirmar/${orden.idOrden}`, body);

      console.log("Body: ",body);

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
          {items.length === 0 ? (
            <p>No hay ítems para mostrar.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Costo Unitario</th>
                  <th>Subtotal</th>
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
                        step="0.01"
                      />
                    </td>
                    <td>${(item.costoUnitario * item.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Campo del Total de la Orden */}
        <div className="grupo-formulario">
          <label>Total de la orden:</label>
          <input
            type="text"
            value={`$${totalOrden.toFixed(2)}`}
            readOnly
            className="form-control"
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              backgroundColor: "#f8f9fa",
              color: "#495057",
            }}
          />
        </div>

        <div className="pie-modal">
          <BotonCancelar onClick={onClose} />
          <BotonAceptar
            onClick={() => setModalConfirmacion(true)}
            disabled={
              items.length === 0 || items.some((item) => item.cantidad <= 0)
            }
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
