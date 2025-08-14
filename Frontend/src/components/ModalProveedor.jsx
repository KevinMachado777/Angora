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
    idOrden: "",
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
    notas: "",
    items: [],
    total: 0,
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
  
  // Nuevo estado para el checkbox de envío de correo
  const [enviarCorreo, setEnviarCorreo] = useState(false);

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 1500);
  };

  const enviarOrdenPorCorreo = async () => {
    if (!formulario.idOrden) {
      abrirModal("advertencia", "Debe tener una orden válida para enviar.");
      return false;
    }

    if (!formulario.id || !formulario.nombre) {
      abrirModal("advertencia", "Debe seleccionar un proveedor válido.");
      return false;
    }

    const proveedor = proveedoresDisponibles.find(
      (p) => p.idProveedor === parseInt(formulario.id)
    );

    if (!proveedor?.correo) {
      abrirModal("advertencia", "El proveedor no tiene un correo registrado.");
      return false;
    }

    try {
      await api.post("/ordenes/enviar-orden", {
        idOrden: formulario.idOrden,
        enviarCorreo: true,
      });

      abrirModal(
        "exito",
        "Lista de compras enviada correctamente al proveedor."
      );
      return true;
    } catch (error) {
      console.error(
        "Error al enviar lista de compras:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al enviar lista de compras: ${
          error.response?.data || error.message
        }`
      );
      return false;
    }
  };

  const verificarCorreoExistente = async (correo, idProveedor = 0) => {
    try {
      const response = await api.get(
        `/proveedores/exists/${correo}/${idProveedor}`
      );
      return response.data;
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
        .then((res) => {
          console.log("Materias primas recibidas:", res.data);
          setMateriasPrimasDisponibles(res.data);
        })
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
      console.log("datosIniciales recibidos:", datosIniciales); // Debug
      if (tipo === "proveedor") {
        setFormulario({
          id: datosIniciales.idProveedor || "", // Mapear idProveedor a id
          nombre: datosIniciales.nombre || "",
          telefono: datosIniciales.telefono || "",
          correo: datosIniciales.correo || "",
          direccion: datosIniciales.direccion || "",
          idOrden: "",
          notas: "",
          items: [],
          total: 0,
        });
      } else if (tipo === "orden") {
        setFormulario({
          id: datosIniciales.proveedor?.idProveedor || "", // ID del proveedor
          idOrden: datosIniciales.idOrden || "",
          nombre: datosIniciales.proveedor?.nombre || "",
          telefono: "", // No se usa para órdenes
          correo: datosIniciales.proveedor?.correo || "", // Para enviarCorreoOrden
          direccion: "", // No se usa para órdenes
          notas: datosIniciales.notas || "",
          total: datosIniciales.total || 0,
          items:
            datosIniciales.ordenMateriaPrimas &&
            Array.isArray(datosIniciales.ordenMateriaPrimas)
              ? datosIniciales.ordenMateriaPrimas.map((omp) => {
                  console.log("Mapeando omp:", omp); // Debug
                  return {
                    id: omp.id,
                    idMateria: omp.materiaPrima?.idMateria,
                    nombre: omp.materiaPrima?.nombre || "",
                    cantidad: omp.cantidad || 0,
                  };
                })
              : [],
        });
      }
    } else {
      setFormulario({
        id: "",
        idOrden: "",
        nombre: "",
        telefono: "",
        correo: "",
        direccion: "",
        notas: "",
        items: [],
        total: 0,
      });
    }

    setNuevoItem({ idMateria: "", nombre: "", cantidad: "" });
    // Resetear el checkbox cuando se abre el modal
    setEnviarCorreo(false);
  }, [isOpen, datosIniciales, tipo, token]);

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
    console.log("nuevoItem antes de agregar:", nuevoItem); // Debug
    const idMateria = parseInt(nuevoItem.idMateria);
    if (!idMateria || isNaN(idMateria) || idMateria <= 0) {
      abrirModal("advertencia", "Debe seleccionar una materia prima válida.");
      return;
    }
    const cantidad = parseFloat(nuevoItem.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      abrirModal("advertencia", "La cantidad debe ser mayor a 0.");
      return;
    }
    const repetido = formulario.items.some(
      (item) => parseInt(item.idMateria) === idMateria
    );
    if (repetido) {
      abrirModal("advertencia", "Ya has agregado esa materia prima.");
      return;
    }
    const nuevo = {
      idMateria: idMateria,
      nombre: nuevoItem.nombre,
      cantidad: cantidad,
    };
    setFormulario((prev) => ({
      ...prev,
      items: [...prev.items, nuevo],
    }));
    setNuevoItem({ idMateria: null, nombre: "", cantidad: "" });
  };

  const editarProducto = (item) => {
    const index = formulario.items.findIndex(
      (i) => i.idMateria === item.idMateria
    );
    if (index !== -1) {
      console.log("Item seleccionado para edición:", item); // Añade este log
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
      id: productoEditando.id,
      idMateria: productoEditando.idMateria,
      nombre: productoEditando.nombre,
      cantidad: parseFloat(productoEditando.cantidad),
    };

    console.log("Editando: ", itemEditado);

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

  // Función modificada para incluir el envío de correo automático
  const guardar = async (e) => {
    e.preventDefault();

    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    if (esOrden) {
      // Validaciones para la orden
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

      // Validar que no haya idMateria inválidos
      const hasInvalidItem = formulario.items.some(
        (item) =>
          !item.idMateria ||
          isNaN(parseInt(item.idMateria)) ||
          parseInt(item.idMateria) <= 0
      );
      if (hasInvalidItem) {
        abrirModal(
          "error",
          "Uno o más ítems tienen un ID de materia prima inválido."
        );
        return;
      }

      // Preparar los datos planos que el componente padre espera
      const datosOrdenParaGuardar = {
        id: formulario.id,
        idOrden: formulario.idOrden,
        notas: formulario.notas,
        items: formulario.items, // Ya están en la estructura correcta (plana)
        total: formulario.total,
      };

      // Llamada única a la función de guardado del padre
      onGuardar(datosOrdenParaGuardar);

      // Si el checkbox está marcado y hay una orden existente, enviar correo
      if (enviarCorreo && formulario.idOrden) {
        // Dar un pequeño delay para que se complete el guardado antes de enviar
        setTimeout(async () => {
          const exitoEnvio = await enviarOrdenPorCorreo();
          if (!exitoEnvio) {
            // Si hay error en el envío, mostrar mensaje pero no bloquear el cierre
            console.log("Error al enviar correo, pero la orden se guardó correctamente");
          }
        }, 500);
      }
    } else {
      // Lógica de guardado para proveedores (no necesita cambios)
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

      const existe = await verificarCorreoExistente(
        formulario.correo,
        formulario.id || 0
      );
      if (existe) {
        abrirModal("advertencia", "Ya existe un proveedor con ese correo.");
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
                    nuevoItem.idMateria && !isNaN(parseInt(nuevoItem.idMateria))
                      ? {
                          value: parseInt(nuevoItem.idMateria),
                          label:
                            materiasPrimasDisponibles.find(
                              (m) =>
                                m.idMateria === parseInt(nuevoItem.idMateria)
                            )?.nombre || "Materia prima seleccionada",
                        }
                      : null
                  }
                  onChange={(selected) => {
                    console.log("Selected option:", selected); // Debug: Ver qué valor llega
                    if (!selected || !selected.value) {
                      setNuevoItem((prev) => ({
                        ...prev,
                        idMateria: null,
                        nombre: "",
                      }));
                      abrirModal(
                        "advertencia",
                        "Por favor seleccione una materia prima válida."
                      );
                      return;
                    }
                    const materia = materiasPrimasDisponibles.find(
                      (m) => m.idMateria === selected.value
                    );
                    console.log("Found materia:", materia); // Debug: Verificar si materia existe
                    if (!materia || isNaN(parseInt(materia.idMateria))) {
                      abrirModal(
                        "error",
                        "Materia prima no encontrada o ID inválido."
                      );
                      setNuevoItem((prev) => ({
                        ...prev,
                        idMateria: null,
                        nombre: "",
                      }));
                      return;
                    }
                    setNuevoItem((prev) => ({
                      ...prev,
                      idMateria: parseInt(materia.idMateria),
                      nombre: materia.nombre,
                    }));
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
                cabeceros={["Nombre", "Cantidad"]}
                registros={formulario.items.map((item) => ({
                  id: item.id,
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

              {/* Checkbox para envío automático de correo - Se muestra tanto para agregar como editar órdenes */}
              <div className="grupo-formulario">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="enviarCorreo"
                    checked={enviarCorreo}
                    onChange={(e) => setEnviarCorreo(e.target.checked)}
                    className="form-check-input"
                  />
                  <label htmlFor="enviarCorreo" className="form-check-label">
                    Enviar orden al proveedor
                  </label>
                </div>
              </div>
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