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
  const [materiasPrimasDisponibles, setMateriasPrimasDisponibles] = useState([]);
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

  // Estado para el checkbox de envío de correo
  const [enviarCorreo, setEnviarCorreo] = useState(false);
  // Nuevo estado para tracking del ID de orden creada
  const [ordenCreadaId, setOrdenCreadaId] = useState(null);

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 1500);
  };

  const enviarOrdenPorCorreo = async (idOrdenParam = null) => {
    const idOrdenUsar = idOrdenParam || formulario.idOrden || ordenCreadaId;

    if (!idOrdenUsar) {
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
        idOrden: idOrdenUsar,
        enviarCorreo: true,
      });

      abrirModal("exito", "Lista de compras enviada correctamente al proveedor.");
      return true;
    } catch (error) {
      console.error(
        "Error al enviar lista de compras:",
        error.response?.status,
        error.response?.data
      );
      abrirModal(
        "error",
        `Error al enviar lista de compras: ${error.response?.data || error.message
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
      // Cargar solo proveedores activos para las órdenes
      api
        .get("/proveedores") // Solo proveedores activos
        .then((res) => setProveedoresDisponibles(res.data))
        .catch((err) => {
          console.error(
            "Error al cargar proveedores:",
            err.response?.status,
            err.response?.data
          );
          abrirModal(
            "error",
            `Error al cargar proveedores: ${err.response?.data?.message || err.message
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
            `Error al cargar materias primas: ${err.response?.data?.message || err.message
            }`
          );
        });
    }

    if (datosIniciales) {
      console.log("datosIniciales recibidos:", datosIniciales);
      if (tipo === "proveedor") {
        setFormulario({
          id: datosIniciales.idProveedor || "",
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
          id: datosIniciales.proveedor?.idProveedor || "",
          idOrden: datosIniciales.idOrden || "",
          nombre: datosIniciales.proveedor?.nombre || "",
          telefono: "",
          correo: datosIniciales.proveedor?.correo || "",
          direccion: "",
          notas: datosIniciales.notas || "",
          total: datosIniciales.total || 0,
          items:
            datosIniciales.ordenMateriaPrimas &&
              Array.isArray(datosIniciales.ordenMateriaPrimas)
              ? datosIniciales.ordenMateriaPrimas.map((omp) => {
                console.log("Mapeando omp:", omp);
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
    setEnviarCorreo(false);
    setOrdenCreadaId(null); // Reset del ID de orden creada
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

  // En la función agregarItem, cambiar esta parte:
  const agregarItem = () => {
    // Validaciones básicas
    if (!nuevoItem.idMateria || !nuevoItem.cantidad) {
      abrirModal(
        "advertencia",
        "Por favor complete todos los campos del producto."
      );
      return;
    }

    if (parseFloat(nuevoItem.cantidad) <= 0) {
      abrirModal("advertencia", "La cantidad debe ser mayor a 0.");
      return;
    }

    // CORRECCIÓN: Comparar como strings directamente
    const materiaEncontrada = materiasPrimasDisponibles.find(
      (mp) => mp.idMateria === nuevoItem.idMateria
    );

    if (!materiaEncontrada) {
      console.log("ID buscado:", nuevoItem.idMateria);
      console.log("IDs disponibles:", materiasPrimasDisponibles.map(mp => mp.idMateria));
      abrirModal("advertencia", "Materia prima no encontrada o ID inválido.");
      return;
    }

    // Verificar que no esté duplicado
    const yaExiste = formulario.items.some(
      (item) => item.idMateria === nuevoItem.idMateria
    );

    if (yaExiste) {
      abrirModal("advertencia", "Esta materia prima ya está en la lista.");
      return;
    }

    // Crear el nuevo item con el costo de la materia prima encontrada
    const itemCompleto = {
      idMateria: nuevoItem.idMateria,
      nombre: materiaEncontrada.nombre,
      cantidad: parseFloat(nuevoItem.cantidad),
      costoUnitario: materiaEncontrada.costo || 0,
    };

    // Agregar el item y recalcular el total
    setFormulario((prev) => {
      const nuevosItems = [...prev.items, itemCompleto];
      const nuevoTotal = nuevosItems.reduce(
        (total, item) => total + item.cantidad * item.costoUnitario,
        0
      );

      return {
        ...prev,
        items: nuevosItems,
        total: nuevoTotal,
      };
    });

    // Limpiar el formulario de nuevo item
    setNuevoItem({
      idMateria: "",
      nombre: "",
      cantidad: "",
    });
  };

  const editarProducto = (item) => {
    const index = formulario.items.findIndex(
      (i) => i.idMateria === item.idMateria
    );
    if (index !== -1) {
      console.log("Item seleccionado para edición:", item);
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

  // Función para manejar cambios en los campos del formulario
  const manejarCambio = (e, setState, stateKey, validacion) => {
    const { value } = e.target;
    let nuevoValor = value;

    switch (stateKey) {
      case "nombre":
        nuevoValor = value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, "").trim();
        break;
      case "telefono":
        nuevoValor = value.replace(/\D/g, "").slice(0, 10); // Solo números, máximo 10
        break;
      case "direccion":
        nuevoValor = value.trim(); // No restringimos caracteres, solo longitud
        break;
      case "correo":
        nuevoValor = value.trim(); // Permitimos formato de correo completo
        break;
      default:
        break;
    }

    setState((prev) => ({ ...prev, [stateKey]: nuevoValor }));
  };

  // Función modificada para manejar correctamente el envío de correos
  const guardar = async (e) => {
    e.preventDefault();

    if (!token) {
      abrirModal("error", "No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    if (esOrden) {
      // Validaciones para la orden (sin cambios)
      if (!formulario.id) {
        abrirModal("advertencia", "Debe seleccionar un proveedor para la orden.");
        return;
      }

      if (!formulario.items || formulario.items.length === 0) {
        abrirModal("advertencia", "La orden debe tener al menos un ítem.");
        return;
      }

      const datosOrdenParaGuardar = {
        id: formulario.id,
        idOrden: formulario.idOrden,
        notas: formulario.notas,
        items: formulario.items,
        total: formulario.total,
      };

      try {
        await onGuardar(datosOrdenParaGuardar);

        if (enviarCorreo && formulario.idOrden) {
          setTimeout(async () => {
            await enviarOrdenPorCorreo(formulario.idOrden);
          }, 500);
        }
      } catch (error) {
        console.error("Error al guardar orden:", error);
        abrirModal("error", "Error al guardar la orden.");
      }
    } else {
      // Validaciones para proveedores
      if (!formulario.nombre || formulario.nombre.length < 3 || !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(formulario.nombre)) {
        abrirModal("advertencia", "El nombre debe tener al menos 3 caracteres y solo letras (incluyendo tildes y ñ).");
        return;
      }

      if (!formulario.telefono || !/^\d{10}$/.test(formulario.telefono)) {
        abrirModal("advertencia", "El teléfono debe tener exactamente 10 dígitos numéricos.");
        return;
      }

      const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo);
      if (!correoValido) {
        abrirModal("advertencia", "Por favor ingresa un correo válido.");
        return;
      }

      if (!formulario.direccion || formulario.direccion.length <= 3) {
        abrirModal("advertencia", "La dirección debe tener más de 3 caracteres.");
        return;
      }

      const existe = await verificarCorreoExistente(formulario.correo, formulario.id || 0);
      if (existe) {
        abrirModal("advertencia", "Ya existe un proveedor con ese correo.");
        return;
      }

      try {
        await onGuardar({ ...formulario });
      } catch (error) {
        console.error("Error al guardar proveedor:", error);
        abrirModal("error", "Error al guardar el proveedor.");
      }
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
                onChange={(e) => manejarCambio(e, setFormulario, "nombre")}
                className="form-control"
                required
                placeholder="Solo letras, mínimo 3 caracteres"
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
                  onChange={(e) => manejarCambio(e, setFormulario, "telefono")}
                  className="form-control"
                  required
                  placeholder="Solo 10 dígitos"
                />
              </div>

              <div className="grupo-formulario">
                <label>Correo electrónico:</label>
                <input
                  name="correo"
                  type="email"
                  value={formulario.correo}
                  onChange={(e) => manejarCambio(e, setFormulario, "correo")}
                  className="form-control"
                  required
                  placeholder="ejemplo@dominio.com"
                />
              </div>

              <div className="grupo-formulario">
                <label>Dirección:</label>
                <input
                  name="direccion"
                  value={formulario.direccion}
                  onChange={(e) => manejarCambio(e, setFormulario, "direccion")}
                  className="form-control"
                  required
                  placeholder="Mínimo 4 caracteres"
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
                    value: m.idMateria, // Mantener como string
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
                    console.log("Selected option:", selected);
                    if (!selected || !selected.value) {
                      setNuevoItem((prev) => ({
                        ...prev,
                        idMateria: "",
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
                    console.log("Found materia:", materia);
                    if (!materia) {
                      abrirModal(
                        "error",
                        "Materia prima no encontrada o ID inválido."
                      );
                      setNuevoItem((prev) => ({
                        ...prev,
                        idMateria: "",
                        nombre: "",
                      }));
                      return;
                    }
                    setNuevoItem((prev) => ({
                      ...prev,
                      idMateria: materia.idMateria, // Mantener como string
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

              {/* Checkbox para envío automático de correo */}
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
                    Enviar orden al proveedor por correo
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