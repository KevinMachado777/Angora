import React, { useState, useEffect, useContext, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/Perfil.css";
import Modal from "../components/Modal";
import BotonEditar from "../components/BotonEditar";
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";

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
    foto: "",
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [editado, setEditado] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTipo, setModalTipo] = useState("exito");
  const [modalMensaje, setModalMensaje] = useState("");

  const fileInputRef = useRef(null);

  const imagenPorDefecto = "https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754451121/Perfil_xtqub7.jpg";

  useEffect(() => {
    if (modalAbierto) {
      const duracion = modalTipo === "error" ? 3000 : 2000;
      const timer = setTimeout(() => {
        setModalAbierto(false);
      }, duracion);
      return () => clearTimeout(timer);
    }
  }, [modalAbierto, modalTipo]);

  // ***** AJUSTE AQUÍ: useEffect para inicializar formData desde el contexto user *****
  useEffect(() => {
    // Solo actualizamos formData si 'user' no es null y tiene al menos un ID (indicando que es un objeto de usuario cargado)
    if (user && user.id !== undefined) {
      console.log("Perfil.js useEffect (inicializar formData): user del contexto ha cambiado. user.foto:", user.foto);
      setFormData({
        id: user.id,
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        correo: user.correo || "",
        telefono: user.telefono || "",
        direccion: user.direccion || "",
        foto: user.foto || imagenPorDefecto, // Usa user.foto directamente
      });
      setSelectedFile(null); // Reinicia selectedFile al cargar nuevos datos de usuario
    } else if (user === null) {
        // Opcional: Si el user del contexto es null (ej. logout), reiniciamos el formulario
        setFormData({
            id: "", nombre: "", apellido: "", correo: "",
            telefono: "", direccion: "", foto: imagenPorDefecto,
        });
        setSelectedFile(null);
    }
  }, [user]); // Dependencia en el objeto 'user' completo

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setEditado(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 12 * 1024 * 1024;
      if (file.size > maxSize) {
        abrirModal("advertencia", "La imagen debe ser menor a 12MB.");
        setSelectedFile(null);
        setFormData({ ...formData, foto: user.foto || imagenPorDefecto });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto: reader.result });
        setEditado(true);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setFormData({ ...formData, foto: user.foto || imagenPorDefecto });
      setEditado(false);
    }
  };

  const toggleEdicion = () => {
    if (modoEdicion) {
      // Restauramos los datos del usuario del contexto
      setFormData({
        id: user.id || "",
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        correo: user.correo || "",
        telefono: user.telefono || "",
        direccion: user.direccion || "",
        foto: user.foto || imagenPorDefecto,
      });
      setSelectedFile(null);
      setEditado(false);
    }
    setModoEdicion(!modoEdicion);
  };

  const verificarCorreoExistente = async (correo) => {
    try {
      const response = await api.get(`/user/exists/${correo}`);
      return response.data;
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

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo);
    if (!correoValido) {
      abrirModal("advertencia", "Por favor ingresa un correo electrónico válido.");
      return;
    }

    const telefonoValido = /^\d{10}$/.test(formData.telefono);
    if (!telefonoValido) {
      abrirModal("advertencia", "El número de teléfono debe tener exactamente 10 dígitos.");
      return;
    }

    const dataToSend = new FormData();
    const userData = { ...formData };
    delete userData.foto;

    dataToSend.append("usuario", new Blob([JSON.stringify(userData)], { type: "application/json" }));

    if (selectedFile) {
      dataToSend.append("foto", selectedFile);
    } else if (formData.foto === imagenPorDefecto && user.foto && user.foto !== imagenPorDefecto) {
      dataToSend.append("foto", new Blob([], { type: 'application/octet-stream' }));
    }

    try {
      if (formData.correo !== user.correo) {
        const existe = await verificarCorreoExistente(formData.correo);
        if (existe) {
          abrirModal("advertencia", "Ya existe un usuario con ese correo electrónico.");
          return;
        }
      }

      const response = await api.put("/user/perfil", dataToSend);
      const data = response.data;

      if (formData.correo !== user.correo) {
        abrirModal(
          "exito",
          "Correo actualizado correctamente. Por favor, vuelve a iniciar sesión."
        );
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      setUser(data);
      setModoEdicion(false);
      setEditado(false);
      setSelectedFile(null);
      abrirModal("exito", "Perfil actualizado correctamente.");
    } catch (error) {
      let errorMessage = "Error al actualizar perfil.";
      if (error.response && error.response.data) {
        errorMessage += " " + (error.response.data.message || JSON.stringify(error.response.data));
      } else if (error.message) {
        errorMessage += " " + error.message;
      }
      abrirModal("error", errorMessage);
      console.error("Error al actualizar perfil:", error);
    }
  };

  return (
    <div className="perfil-wrapper d-flex align-items-center justify-content-center">
      <div className={`perfil-card p-4 ${modoEdicion ? "transicion-edicion" : ""}`}>
        <div className="text-center mb-4">
          <div className="avatar-container">
            {modoEdicion ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*"
                />
                <img
                  src={formData.foto || imagenPorDefecto}
                  alt="Foto de perfil"
                  className="icono-perfil-img editable-img"
                  onClick={() => fileInputRef.current.click()}
                />
                <p className="foto-cambio-mensaje">Haz clic para cambiar la foto</p>
              </>
            ) : (
              <img
                src={formData.foto || imagenPorDefecto}
                alt="Foto de perfil"
                className="icono-perfil-img"
              />
            )}
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
                {editado && <BotonGuardar type="submit" />}
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