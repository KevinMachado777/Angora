import React, { useState, useEffect, useContext } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/Perfil.css";
import Modal from "../components/Modal";
import BotonEditar from "../components/BotonEditar";
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import { AuthContext } from "../context/AuthContext";

const ModalMensaje = ({ tipo, mensaje }) => {
  const iconos = {
    exito: "bi bi-check-circle-fill text-success display-4 mb-2",
    error: "bi bi-x-circle-fill text-danger display-4 mb-2",
    advertencia: "bi bi-exclamation-triangle-fill text-warning display-4 mb-2",
  };

  const titulos = {
    exito: "¡Éxito!",
    error: "Error",
    advertencia: "Advertencia",
  };

  return (
    <div className="text-center p-3">
      <i className={iconos[tipo]}></i>
      <h2>{titulos[tipo]}</h2>
      <p>{mensaje}</p>
    </div>
  );
};

const Perfil = () => {
  const { user, setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    direccion: "",
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [editado, setEditado] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTipo, setModalTipo] = useState("exito"); // exito | error | advertencia
  const [modalMensaje, setModalMensaje] = useState("");

  useEffect(() => {
    if (modalAbierto) {
      const duracion = modalTipo === "error" ? 3000 : 2000; // error = 3s, otros = 2s
      const timer = setTimeout(() => {
        setModalAbierto(false);
      }, duracion);
      return () => clearTimeout(timer);
    }
  }, [modalAbierto, modalTipo]);

  useEffect(() => {
    if (user && user.id) {
      setFormData({
        id: user.id,
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        correo: user.correo || "",
        telefono: user.telefono || "",
        direccion: user.direccion || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setEditado(true);
  };

  const toggleEdicion = () => {
  if (modoEdicion) {
    // Si estamos cancelando la edición, restauramos los datos originales
    setFormData({
      id: user.id || "",
      nombre: user.nombre || "",
      apellido: user.apellido || "",
      correo: user.correo || "",
      telefono: user.telefono || "",
      direccion: user.direccion || "",
    });
    setEditado(false);
  }
  setModoEdicion(!modoEdicion);
};


  const verificarCorreoExistente = async (correo) => {
    try {
      const response = await fetch(
        `http://localhost:8080/angora/api/v1/user/exists/${correo}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (!response.ok) {
        return false;
      }
      const exists = await response.json();
      return exists;
    } catch (error) {
      console.error("Error al verificar correo:", error);
      return false;
    }
  };

  const abrirModal = (tipo, mensaje) => {
    setModalTipo(tipo);
    setModalMensaje(mensaje);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validación de correo electrónico
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo);
  if (!correoValido) {
    abrirModal("advertencia", "Por favor ingresa un correo electrónico válido.");
    return;
  }

  // Validación de teléfono: solo 10 dígitos numéricos
  const telefonoValido = /^\d{10}$/.test(formData.telefono);
  if (!telefonoValido) {
    abrirModal("advertencia", "El número de teléfono debe tener exactamente 10 dígitos.");
    return;
  }

  try {
    if (formData.correo !== user.correo) {
      const existe = await verificarCorreoExistente(formData.correo);
      if (existe) {
        abrirModal("advertencia", "Ya existe un usuario con ese correo electrónico.");
        return;
      }
    }

    const response = await fetch("http://localhost:8080/angora/api/v1/user/perfil", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();

    if (formData.correo !== user.correo) {
      abrirModal(
        "exito",
        "Correo actualizado correctamente. Por favor, vuelve a iniciar sesión."
      );
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
      setUser(null);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }

    setUser(data);
    setFormData({
      id: data.id,
      nombre: data.nombre || "",
      apellido: data.apellido || "",
      correo: data.correo || "",
      telefono: data.telefono || "",
      direccion: data.direccion || "",
    });
    localStorage.setItem("userData", JSON.stringify(data));
    setModoEdicion(false);
    setEditado(false);
    abrirModal("exito", "Perfil actualizado correctamente.");
  } catch (error) {
    abrirModal("error", "Error al actualizar perfil: " + error.message);
    console.error("Error:", error.message);
  }
};


  return (
    <div className="perfil-wrapper d-flex align-items-center justify-content-center">
      <div className={`perfil-card p-4 ${modoEdicion ? "transicion-edicion" : ""}`}>
        <div className="text-center mb-4">
          <div className="avatar-container">
            <i className="bi bi-person-circle icono-perfil mb-2"></i>
          </div>
          <h2 className="fw-bold">
            {user?.nombre} {user?.apellido}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Correo</label>
            <input
              type="email"
              className="form-control"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              disabled={!modoEdicion}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Teléfono</label>
            <input
              type="text"
              className="form-control"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              disabled={!modoEdicion}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className="form-control"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={!modoEdicion}
            />
          </div>

          <div className="d-flex justify-content-center gap-3">
            {modoEdicion ? (
              <>
                <BotonCancelar onClick={toggleEdicion} />
                {editado && <BotonGuardar onClick={handleSubmit} />}
              </>
            ) : (
              <BotonEditar onClick={toggleEdicion} />
            )}
          </div>
        </form>

      </div>

      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)}>
        <ModalMensaje tipo={modalTipo} mensaje={modalMensaje} />
      </Modal>
    </div>
  );
};

export default Perfil;