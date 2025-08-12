import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";
import Modal from "../components/Modal";
import BotonAceptar from "../components/BotonAceptar";
import BotonCancelar from "../components/BotonCancelar";
import { CreadorTabla } from "./CreadorTabla";
import "../styles/proveedores.css";
import Select from "react-select";

const ModalProveedor = ({
  isOpen,
  onClose,
  tipo,
  onGuardar,
  datosIniciales,
}) => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");
  const esOrden = tipo === "orden";

  const [formulario, setFormulario] = useState({
    id: "",
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
    notas: "",
    items: [],
  });

  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);
  const [materiasPrimasDisponibles, setMateriasPrimasDisponibles] = useState(
    []
  );
  const [nuevoItem, setNuevoItem] = useState({
    idMateria: "",
    nombre: "",
    cantidad: "",
  });
  const [modalEdicionProducto, setModalEdicionProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
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

  const enviarCorreoOrden = async () => {
    if (
      !formulario.id ||
      !formulario.nombre ||
      !proveedoresDisponibles.length
    ) {
      abrirModal("advertencia", "Debe seleccionar un proveedor válido.");
      return;
    }

    const proveedor = proveedoresDisponibles.find(
      (p) => p.idProveedor === parseInt(formulario.id)
    );
    if (!proveedor?.correo) {
      abrirModal("advertencia", "El proveedor no tiene un correo registrado.");
      return;
    }

    try {
      // Dentro de enviarCorreoOrden en ModalProveedor.js
      const formData = new FormData();
      formData.append("email", proveedor.correo);
      formData.append("nombre", proveedor.nombre);
      formData.append(
        "ordenNumero",
        datosIniciales?.idOrden.toString() || "N/A"
      );
      formData.append("monto", formulario.total?.toFixed(2) || "0.00");

      await api.post("/email/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      abrirModal("exito", "Correo enviado correctamente al proveedor.");
    } catch (error) {
      console.error(
        "Error al enviar correo:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al enviar correo: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const verificarCorreoExistente = async (correo, idProveedor = 0) => {
  try {
    const response = await api.get(`/proveedores/exists/${correo}/${idProveedor}`);
    return response.data; // Debería ser un booleano (true si existe, false si no)
  } catch (error) {
    console.error("Error al verificar correo:", error);
    return true;
  }
};

  useEffect(() => {
    if (!isOpen || !token) {
      if (!token) {
        abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      }
      return;
    }

    if (esOrden) {
      api
        .get("/proveedores")
        .then((res) => setProveedoresDisponibles(res.data))
        .catch((err) => {
          console.error(
            "Error al cargar proveedores:",
            err.response?.status,
            err.response?.data
          );
          abrirModal(
            "error",
            `Error al cargar proveedores: ${
              err.response?.data?.message || err.message
            }`
          );
        });

      api
        .get("/inventarioMateria")
        .then((res) => setMateriasPrimasDisponibles(res.data))
        .catch((err) => {
          console.error(
            "Error al cargar materias primas:",
            err.response?.status,
            err.response?.data
          );
          abrirModal(
            "error",
            `Error al cargar materias primas: ${
              err.response?.data?.message || err.message
            }`
          );
        });
    }

    if (datosIniciales) {
      setFormulario({
        id: datosIniciales.idOrden || datosIniciales.idProveedor || "",
        nombre: datosIniciales.nombre || datosIniciales.proveedor?.nombre || "",
        telefono: datosIniciales.telefono || "",
        correo: datosIniciales.correo || "",
        direccion: datosIniciales.direccion || "",
        notas: datosIniciales.notas || "",
        items: datosIniciales.materiaPrima || datosIniciales.items || [],
      });
    } else {
      setFormulario({
        id: "",
        nombre: "",
        telefono: "",
        correo: "",
        direccion: "",
        notas: "",
        items: [],
      });
    }

    setNuevoItem({ idMateria: "", nombre: "", cantidad: "" });
  }, [isOpen, datosIniciales, esOrden, token]);

  useEffect(() => {
    if (!modalMensaje.visible && modalMensaje.tipo === "exito") {
      onClose();
    }
  }, [modalMensaje.visible, modalMensaje.tipo, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNuevoItem((prev) => ({ ...prev, [name]: value }));
  };

  const agregarItem = () => {
    if (!nuevoItem.idMateria || !nuevoItem.nombre.trim()) {
      abrirModal("advertencia", "Debe seleccionar una materia prima.");
      return;
    }

    const cantidad = parseFloat(nuevoItem.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      abrirModal("advertencia", "La cantidad debe ser mayor a 0.");
      return;
    }

    const repetido = formulario.items.some(
      (item) => item.idMateria === nuevoItem.idMateria
    );
    if (repetido) {
      abrirModal("advertencia", "Ya has agregado esa materia prima.");
      return;
    }

    const nuevo = {
      idMateria: nuevoItem.idMateria,
      nombre: nuevoItem.nombre,
      cantidad: cantidad,
    };

    setFormulario((prev) => ({
      ...prev,
      items: [...prev.items, nuevo],
    }));

    setNuevoItem({ idMateria: "", nombre: "", cantidad: "" });
  };

  const editarProducto = (item) => {
    const index = formulario.items.findIndex(
      (i) => i.idMateria === item.idMateria
    );
    if (index !== -1) {
      setProductoEditando({ ...item, index });
      setModalEdicionProducto(true);
    }
  };

  const guardarProductoEditado = () => {
    if (
      !productoEditando ||
      !productoEditando.nombre ||
      parseFloat(productoEditando.cantidad) <= 0
    ) {
      abrirModal("advertencia", "La cantidad debe ser mayor a 0.");
      return;
    }

    const itemEditado = {
      idMateria: productoEditando.idMateria,
      nombre: productoEditando.nombre,
      cantidad: parseFloat(productoEditando.cantidad),
    };

    const nuevosItems = [...formulario.items];
    nuevosItems[productoEditando.index] = itemEditado;
    setFormulario((prev) => ({ ...prev, items: nuevosItems }));
    setModalEdicionProducto(false);
    setProductoEditando(null);
  };

  const eliminarItem = (item) => {
    setFormulario((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.idMateria !== item.idMateria),
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    if (esOrden) {
      if (!formulario.id) {
        abrirModal(
          "advertencia",
          "Debe seleccionar un proveedor para la orden."
        );
        return;
      }

      if (!formulario.items || formulario.items.length === 0) {
        abrirModal("advertencia", "La orden debe tener al menos un ítem.");
        return;
      }

      onGuardar({
        id: formulario.id,
        notas: formulario.notas,
        items: formulario.items,
        total: 0,
      });
    } else {
      const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo);
      if (!correoValido) {
        abrirModal("advertencia", "Por favor ingresa un correo válido.");
        return;
      }

      const telefonoValido = /^\d{10}$/.test(formulario.telefono);
      if (!telefonoValido) {
        abrirModal(
          "advertencia",
          "El teléfono debe tener exactamente 10 dígitos."
        );
        return;
      }

      const existe = await verificarCorreoExistente(formulario.correo, formulario.id);
        if (existe) {
            abrirModal("advertencia", "Ya existe un usuario con ese correo.");
            return;
        }

      onGuardar({ ...formulario });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <form onSubmit={guardar}>
          <div className="encabezado-modal">
            <h2>
              {esOrden
                ? "Orden de compra"
                : datosIniciales
                ? "Editar proveedor"
                : "Agregar proveedor"}
            </h2>
          </div>

          {datosIniciales && !esOrden && (
            <div className="grupo-formulario">
              <label>ID del proveedor:</label>
              <input
                type="text"
                name="id"
                value={formulario.id}
                readOnly
                className="form-control"
              />
            </div>
          )}

          <div className="grupo-formulario">
            <label>Proveedor:</label>
            {esOrden ? (
              <Select
                options={proveedoresDisponibles.map((p) => ({
                  value: p.idProveedor,
                  label: p.nombre,
                }))}
                value={
                  formulario.id
                    ? {
                        value: parseInt(formulario.id),
                        label:
                          proveedoresDisponibles.find(
                            (p) => p.idProveedor === parseInt(formulario.id)
                          )?.nombre || "Proveedor seleccionado",
                      }
                    : null
                }
                onChange={(selected) => {
                  const proveedor = proveedoresDisponibles.find(
                    (p) => p.idProveedor === selected.value
                  );
                  setFormulario((prev) => ({
                    ...prev,
                    id: proveedor.idProveedor,
                    nombre: proveedor.nombre,
                    correo: proveedor.correo,
                  }));
                }}
                placeholder="Seleccione un proveedor..."
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "38px",
                    borderRadius: "6px",
                    borderColor: "#ced4da",
                    boxShadow: "none",
                  }),
                }}
              />
            ) : (
              <input
                name="nombre"
                value={formulario.nombre}
                onChange={handleChange}
                className="form-control"
              />
            )}
          </div>

          {!esOrden && (
            <>
              <div className="grupo-formulario">
                <label>Teléfono:</label>
                <input
                  name="telefono"
                  value={formulario.telefono}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="grupo-formulario">
                <label>Correo electrónico:</label>
                <input
                  name="correo"
                  type="email"
                  value={formulario.correo}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="grupo-formulario">
                <label>Dirección:</label>
                <input
                  name="direccion"
                  value={formulario.direccion}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </>
          )}

          {esOrden && (
            <>
              <div className="grupo-formulario">
                <h3 className="proveedores subtitulo">
                  Registro de materia prima
                </h3>
                <Select
                  options={materiasPrimasDisponibles.map((m) => ({
                    value: m.idMateria,
                    label: m.nombre,
                  }))}
                  value={
                    nuevoItem.idMateria
                      ? {
                          value: nuevoItem.idMateria,
                          label:
                            materiasPrimasDisponibles.find(
                              (m) => m.idMateria === nuevoItem.idMateria
                            )?.nombre || "Materia prima seleccionada",
                        }
                      : null
                  }
                  onChange={(selected) => {
                    const materia = materiasPrimasDisponibles.find(
                      (m) => m.idMateria === selected.value
                    );
                    setNuevoItem((prev) => ({
                      ...prev,
                      idMateria: materia.idMateria,
                      nombre: materia.nombre,
                    }));
                  }}
                  placeholder="Seleccione una materia prima..."
                  classNamePrefix="select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      borderRadius: "6px",
                      borderColor: "#ced4da",
                      boxShadow: "none",
                    }),
                  }}
                />
                <input
                  placeholder="Cantidad"
                  type="number"
                  name="cantidad"
                  value={nuevoItem.cantidad}
                  onChange={handleItemChange}
                  className="form-control"
                  step="0.01"
                />
                <button
                  type="button"
                  onClick={agregarItem}
                  className="btn btn-success"
                >
                  ➕
                </button>
              </div>

              <CreadorTabla
                cabeceros={["Id", "Nombre", "Cantidad"]}
                registros={formulario.items.map((item) => ({
                  idMateria: item.idMateria,
                  nombre: item.nombre || "",
                  cantidad: item.cantidad || "",
                }))}
                onEditar={editarProducto}
                onEliminar={eliminarItem}
              />

              <div className="grupo-formulario">
                <label>Notas:</label>
                <textarea
                  name="notas"
                  value={formulario.notas}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                />
              </div>

              {datosIniciales && (
                <div className="grupo-formulario">
                  <button
                    type="button"
                    onClick={enviarCorreoOrden}
                    className="btn btn-primary"
                  >
                    Enviar a proveedor por correo
                  </button>
                </div>
              )}
            </>
          )}

          <div className="pie-modal">
            <BotonCancelar onClick={onClose} />
            <BotonAceptar type="submit" />
          </div>
        </form>
      </Modal>

      {modalEdicionProducto && productoEditando && (
        <Modal
          isOpen={modalEdicionProducto}
          onClose={() => {
            setModalEdicionProducto(false);
            setProductoEditando(null);
          }}
        >
          <div className="encabezado-modal">
            <h2>Editar Producto</h2>
          </div>
          <div className="grupo-formulario">
            <label>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={productoEditando.nombre}
              readOnly
              className="form-control"
            />
          </div>
          <div className="grupo-formulario">
            <label>Cantidad:</label>
            <input
              type="number"
              name="cantidad"
              value={productoEditando.cantidad}
              onChange={(e) =>
                setProductoEditando((prev) => ({
                  ...prev,
                  cantidad: e.target.value,
                }))
              }
              className="form-control"
              step="0.01"
            />
          </div>
          <div className="pie-modal">
            <BotonCancelar
              onClick={() => {
                setModalEdicionProducto(false);
                setProductoEditando(null);
              }}
            />
            <BotonAceptar onClick={guardarProductoEditado} />
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

export default ModalProveedor;
