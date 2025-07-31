import { useState, useEffect, useContext } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import Modal from "../components/Modal";
import perfil from "../assets/images/perfil.jpg";
import "../styles/personal.css";
import BotonAgregar from "../components/BotonAgregar";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import BotonCancelar from "../components/BotonCancelar";
import BotonGuardar from "../components/BotonGuardar";
import BotonAceptar from "../components/BotonAceptar";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";

const Personal = () => {
  // URL del backend
  const urlBackend = "http://localhost:8080/angora/api/v1";

  // Permisos disponibles
  const permisosDisponibles = [
    "dashboard",
    "personal",
    "inventarios",
    "reportes",
    "ventas",
    "clientes",
    "pedidos",
    "proveedores",
  ];

  // Permisos chequeados por defecto al agregar un nuevo usuario
  const permisosPorDefecto = ["inventarios", "ventas", "clientes", "pedidos"]; 

  // Estado para manejar los datos del personal
  const [personas, setPersonas] = useState([]);
  // Estados para manejar el modal y el formulario
  const [modalAbierta, setModalAbierta] = useState(false);
  // Estado para manejar si es edición o creación
  const [modalEdicion, setModalEdicion] = useState(false);
  // Nuevo estado para manejar el modal de mensajes de validación
  const [modalMensaje, setModalMensaje] = useState({ abierto: false, tipo: "", mensaje: "" });
  // Estado para manejar el formulario
  const [formulario, setFormulario] = useState({
    id: "",
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    direccion: "",
    foto: "",
    permisos: [], 
  });

  // Estado para manejar la persona seleccionada para editar
  const [personaSelect, setPersonaSelect] = useState(null);
  // Estado para manejar la confirmación de eliminación
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  // Estado para manejar la persona a eliminar
  const [personaEliminar, setPersonaEliminar] = useState(null);

  // Contexto de autenticación para obtener el usuario actual
  const { user } = useContext(AuthContext);
  // Token de acceso del usuario
  const token = localStorage.getItem("accessToken");

  // Cargar los usuarios al montar el componente y cuando cambie el usuario o el token
  useEffect(() => {
    if (!user || !Array.isArray(user.permisos) || !user.permisos.some((p) => p.name === "PERSONAL")) {
      return;
    }
    cargarUsuarios();
  }, [user, token]);

  // Función para cargar los usuarios desde el backend
  const cargarUsuarios = () => {
    api
      .get(`${urlBackend}/user/public`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPersonas(res.data))
      .catch((err) => console.error("Error al cargar usuarios:", err));
  };

  // Funciones para abrir los modales de agregar
  const abrirModalAgregar = () => {
    setFormulario({
      id: "",
      nombre: "",
      apellido: "",
      correo: "",
      telefono: "",
      direccion: "",
      foto: "",
      // Asignar permisos por defecto al agregar un nuevo usuario
      permisos: permisosPorDefecto.map(permiso => ({ name: permiso })),
    });
    setPersonaSelect(null);
    setModalEdicion(false);
    setModalAbierta(true);
  };

  // Funciones para abrir la modal de edicion
  const abrirModalEditar = (persona) => {
    // Convertir los permisos a minúsculas para que coincidan con el formato esperado
    const permisosUsuario = persona.permisos ? persona.permisos.map((p) => ({ name: p.name.toLowerCase() })) : [];
    setFormulario({
      id: persona.id || "",
      nombre: persona.nombre || "",
      apellido: persona.apellido || "",
      correo: persona.correo || "",
      telefono: persona.telefono || "",
      direccion: persona.direccion || "",
      foto: persona.foto || "",
      permisos: permisosUsuario,
    });
    setPersonaSelect(persona);
    setModalAbierta(true);
    setModalEdicion(true);
  };

  // Función para abrir el modal de confirmación de eliminación
  const abrirModalEliminacion = (persona) => {
    setPersonaEliminar(persona);
    setConfirmarEliminacion(true);
  };

  // Función para cerrar los modales
  const cerrarModal = () => {
    setModalAbierta(false);
    setPersonaSelect(null);
  };

  // Función para cerrar el modal de confirmación de eliminación
  const cerrarModalConfirmacion = (aceptar) => {
    if (aceptar && personaEliminar) {
      api
        .delete(`${urlBackend}/user/${personaEliminar.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.status === 204) {
            setPersonas(personas.filter((p) => p.id !== personaEliminar.id));
          }
        })
        .catch((err) => console.error("Error al eliminar:", err));
    }
    setConfirmarEliminacion(false);
    setPersonaEliminar(null);
  };

  // Nueva función para abrir el modal de mensajes de validación
  const abrirModalMensaje = (tipo, mensaje) => {
    setModalMensaje({ abierto: true, tipo, mensaje });
  };

  // Nueva función para cerrar el modal de mensajes de validación
  const cerrarModalMensaje = () => {
    setModalMensaje({ abierto: false, tipo: "", mensaje: "" });
  };

  // Función para manejar los cambios en el formulario
  const manejarCambioFormulario = (evento) => {
    const { name, value, type, checked, files } = evento.target;
    if (type === "file") {
      const archivo = files[0];
      if (archivo) {
        const lector = new FileReader();
        lector.onloadend = () => {
          setFormulario({ ...formulario, foto: lector.result });
        };
        lector.readAsDataURL(archivo);
      }
    } else if (type === "checkbox") {
      const permiso = value.toLowerCase();
      const nuevosPermisos = checked
        ? [...formulario.permisos, { name: permiso }]
        : formulario.permisos.filter((p) => p.name !== permiso);
      setFormulario({ ...formulario, permisos: nuevosPermisos });
    } else {
      setFormulario({ ...formulario, [name]: value });
    }
  };

  // Función para guardar el empleado (agregar o editar)
  const guardarEmpleado = async (evento) => {
    evento.preventDefault();

    // Nueva validación: Asegurar que el nombre tenga al menos 3 caracteres
    if (formulario.nombre.length < 3) {
      abrirModalMensaje("advertencia", "El nombre debe tener al menos 3 caracteres.");
      return;
    }

    // Nueva validación: Asegurar que el apellido tenga al menos 3 caracteres
    if (formulario.apellido.length < 3) {
      abrirModalMensaje("advertencia", "El apellido debe tener al menos 3 caracteres.");
      return;
    }

    // Nueva validación: Asegurar que el teléfono tenga exactamente 10 dígitos
    if (!/^\d{10}$/.test(formulario.telefono)) {
      abrirModalMensaje("advertencia", "El teléfono debe tener exactamente 10 dígitos.");
      return;
    }

    // Nueva validación: Asegurar que la dirección tenga al menos 3 caracteres
    if (formulario.direccion.length < 3) {
      abrirModalMensaje("advertencia", "La dirección debe tener al menos 3 caracteres.");
      return;
    }

    // Nueva validación: Verificar que el ID no exista en la base de datos al agregar
    if (!modalEdicion && formulario.id && personas.some(p => p.id === formulario.id)) {
      abrirModalMensaje("advertencia", "El ID ya está en uso.");
      return;
    }

    // Nueva validación: Verificar que el correo no esté duplicado
    const correoExistente = personas.find(p => p.correo === formulario.correo);
    if (correoExistente && (!modalEdicion || correoExistente.id !== formulario.id)) {
      abrirModalMensaje("advertencia", "El correo ya está en uso.");
      return;
    }

    const url = modalEdicion
      ? `${urlBackend}/user/personal/${formulario.id}`
      : `${urlBackend}/user/register`;
    const method = modalEdicion ? "put" : "post";
    // Preparar el cuerpo de la solicitud
    const body = modalEdicion
      ? {
          id: formulario.id || null,
          nombre: formulario.nombre,
          apellido: formulario.apellido,
          correo: formulario.correo,
          telefono: formulario.telefono,
          direccion: formulario.direccion || "",
          foto: formulario.foto || "URL_FOTO_USUARIO",
          permisos: formulario.permisos,
        }
      : {
          id: formulario.id || null,
          nombre: formulario.nombre,
          apellido: formulario.apellido,
          correo: formulario.correo,
          telefono: formulario.telefono,
          direccion: formulario.direccion || "",
          foto: formulario.foto || "URL_FOTO_USUARIO",
          permissions: {
            listPermissions: formulario.permisos.map(p => p.name),
          },
        };

    console.log("Solicitud enviada:", { url, method, body, token }); // Depuración
    api({
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: body,
    })
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          const updatedPersona = res.data;
          if (!modalEdicion) {
            setPersonas([...personas, updatedPersona]);
          } else {
            setPersonas(personas.map((p) => (p.id === updatedPersona.id ? updatedPersona : p)));
          }
          cargarUsuarios(); // Forzar recarga para asegurar datos actualizados
          cerrarModal();
        }
      })
      .catch((err) => console.error("Error al guardar:", err));
  };

  // Función para manejar el clic en la tarjeta
  const clicTarjeta = (evento) => {
    const tarjeta = evento.currentTarget;
    const esBoton = evento.target.closest(".btn");
    if (!esBoton) {
      tarjeta.classList.toggle("girar");
    }
  };

  return (
    <main>
      <div className="titulo">
        <h1>Personal</h1>
        {user && user.permisos.some((p) => p.name === "PERSONAL") && (
          <BotonAgregar onClick={abrirModalAgregar} />
        )}
      </div>

      {/* Mostrar mensaje si no hay personal registrado */}
      <div className="cards-container">
        {personas.map((persona) => (
          <div key={persona.id} className="personal" onClick={clicTarjeta}>
            <div className="card-front">
              <img src={persona.foto || perfil} alt="imagen_perfil" />
              <p>{`${persona.nombre} ${persona.apellido || ""}`.trim()}</p>
              {persona.permisos && persona.permisos.length > 0 && (
                <div className="permisos-lista mt-2">
                  {persona.permisos.map((permiso, i) => (
                    <span key={i} className="badge bg-secondary me-1">
                      {permiso.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="card-back">
              <p>Correo: {persona.correo}</p>
              <p>Teléfono: {persona.telefono}</p>
              <p>Dirección: {persona.direccion || "Sin dirección"}</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <BotonEditar onClick={() => abrirModalEditar(persona)} />
                <BotonEliminar onClick={() => abrirModalEliminacion(persona)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de agregar o edicion */}
      {modalAbierta && (
        <Modal isOpen={modalAbierta} onClose={cerrarModal}>
          <div className="encabezado-modal">
            <h2>{personaSelect ? "Modificar Personal" : "Agregar Personal"}</h2>
          </div>
          <form onSubmit={guardarEmpleado}>
            {!modalEdicion && (
              <div className="grupo-formulario">
                <label>Id:</label>
                <input
                  type="text"
                  name="id"
                  value={formulario.id}
                  onChange={manejarCambioFormulario}
                  className="form-control mb-2"
                  required
                  disabled={modalEdicion}
                />
              </div>
            )}
            <div className="grupo-formulario">
              <label>Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambioFormulario}
                className="form-control mb-2"
                required
              />
            </div>
            <div className="grupo-formulario">
              <label>Apellido:</label>
              <input
                type="text"
                name="apellido"
                value={formulario.apellido}
                onChange={manejarCambioFormulario}
                className="form-control mb-2"
              />
            </div>
            <div className="grupo-formulario">
              <label>Correo:</label>
              <input
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={manejarCambioFormulario}
                className="form-control mb-2"
                required
              />
            </div>
            <div className="grupo-formulario">
              <label>Teléfono:</label>
              <input
                type="text"
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambioFormulario}
                className="form-control mb-2"
                required
              />
            </div>
            <div className="grupo-formulario">
              <label>Dirección:</label>
              <input
                type="text"
                name="direccion"
                value={formulario.direccion}
                onChange={manejarCambioFormulario}
                className="form-control mb-2"
                required
              />
            </div>
            <div className="grupo-formulario">
              <label>Foto de perfil:</label>
              <input
                type="file"
                accept="image/*"
                onChange={manejarCambioFormulario}
                className="form-control mb-2"
              />
            </div>
            <div className="grupo-formulario text-center">
              <img
                src={formulario.foto || perfil}
                alt="Vista previa"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: "2px solid #ccc",
                  marginBottom: "10px",
                }}
              />
            </div>
            <div className="grupo-formulario">
              <label>Permisos:</label>
              <div className="d-flex justify-content-between mb-2">
                {permisosDisponibles.map((permiso) => (
                  <label key={permiso} className="me-3">
                    <input
                      type="checkbox"
                      name="permisos"
                      value={permiso}
                      checked={formulario.permisos.some(p => p.name === permiso)}
                      onChange={manejarCambioFormulario}
                    />{" "}
                    {permiso.charAt(0).toUpperCase() + permiso.slice(1)} {/* Capitalizar para mostrar */}
                  </label>
                ))}
              </div>
            </div>
            <div className="pie-modal">
              <BotonCancelar type="button" onClick={cerrarModal} />
              <BotonGuardar type="submit" />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmarEliminacion && (
        <Modal isOpen={confirmarEliminacion} onClose={cerrarModalConfirmacion}>
          <div className="encabezado-modal">
            <h2>Confirmar Eliminación</h2>
          </div>
          <p>¿Desea eliminar al empleado {personaEliminar?.nombre}?</p>
          <div className="pie-modal">
            <BotonCancelar onClick={() => cerrarModalConfirmacion(false)} />
            <BotonAceptar onClick={() => cerrarModalConfirmacion(true)} />
          </div>
        </Modal>
      )}

      {/* Nuevo modal para mostrar mensajes de validación */}
      {modalMensaje.abierto && (
        <Modal isOpen={modalMensaje.abierto} onClose={cerrarModalMensaje}>
          <div className="encabezado-modal">
            <i className={`bi ${modalMensaje.tipo === "exito" ? "bi-check-circle-fill text-success" : modalMensaje.tipo === "error" ? "bi-x-circle-fill text-danger" : "bi-exclamation-triangle-fill text-warning"} display-4 mb-2`}></i>
            <h2>{modalMensaje.tipo.charAt(0).toUpperCase() + modalMensaje.tipo.slice(1)}</h2>
          </div>
          <p>{modalMensaje.mensaje}</p>
          <div className="pie-modal">
            <BotonAceptar onClick={cerrarModalMensaje} />
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Personal;