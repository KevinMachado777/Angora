import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import BotonAceptar from "../components/BotonAceptar";
import BotonCancelar from "../components/BotonCancelar";
import { CreadorTabla } from "./CreadorTabla";
import "../styles/proveedores.css";
import axios from "axios";
import Select from "react-select";

// Componente de mensajes reutilizable
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

const ModalProveedor = ({
  isOpen,
  onClose,
  tipo,
  onGuardar,
  datosIniciales,
}) => {
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
  const [nuevoItem, setNuevoItem] = useState({ nombre: "", cantidad: "" });
  const [modalEdicionProducto, setModalEdicionProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTipo, setModalTipo] = useState("exito");
  const [modalMensaje, setModalMensaje] = useState("");

  const abrirModal = (tipo, mensaje) => {
    setModalTipo(tipo);
    setModalMensaje(mensaje);
    setModalAbierto(true);
  };

  const verificarCorreoExistente = async (correo) => {
    try {
      const response = await fetch(
        `http://localhost:8080/angora/api/v1/user/exists/${correo}`
      );
      if (!response.ok) return false;
      const exists = await response.json();
      return exists;
    } catch (error) {
      console.error("Error al verificar correo:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (esOrden) {
      axios
        .get("http://localhost:8080/angora/api/v1/proveedores")
        .then((res) => setProveedoresDisponibles(res.data))
        .catch((err) => console.error("Error al cargar proveedores:", err));
    }

    if (datosIniciales) {
      setFormulario({
        id: datosIniciales.id || datosIniciales.idProveedor || "",
        nombre: datosIniciales.nombre || "",
        telefono: datosIniciales.telefono || "",
        correo: datosIniciales.correo || "",
        direccion: datosIniciales.direccion || "",
        notas: datosIniciales.notas || "",
        items: datosIniciales.items || [],
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

    setNuevoItem({ nombre: "", cantidad: "" });
  }, [isOpen, datosIniciales, esOrden]);

  // Controla cuánto dura visible el mensaje modal (ModalMensaje)
  useEffect(() => {
    if (modalAbierto) {
      let duracion = 2000;
      if (modalTipo === "advertencia") duracion = 2000;
      if (modalTipo === "error") duracion = 2000;

      const timer = setTimeout(() => {
        setModalAbierto(false); // Solo cerramos el mensaje aquí
      }, duracion);

      return () => clearTimeout(timer);
    }
  }, [modalAbierto, modalTipo]);

  // Cierra la modal principal solo cuando se haya cerrado el mensaje y haya sido de tipo 'exito'
  useEffect(() => {
    if (!modalAbierto && modalTipo === "exito") {
      onClose(); // Ahora sí cerramos ModalProveedor después del mensaje de éxito
    }
  }, [modalAbierto, modalTipo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNuevoItem((prev) => ({ ...prev, [name]: value }));
  };

  const agregarItem = () => {
    if (!nuevoItem.nombre.trim()) {
      abrirModal(
        "advertencia",
        "El nombre de la materia prima no puede estar vacío."
      );
      return;
    }

    const cantidad = parseInt(nuevoItem.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      abrirModal("advertencia", "La cantidad debe ser mayor a 0.");
      return;
    }

    const repetido = formulario.items.some(
      (item) => item.nombre.toLowerCase() === nuevoItem.nombre.toLowerCase()
    );
    if (repetido) {
      abrirModal("advertencia", "Ya has agregado esa materia prima.");
      return;
    }

    const nuevo = {
      nombre: nuevoItem.nombre,
      cantidad: cantidad,
    };

    setFormulario((prev) => ({
      ...prev,
      items: [...prev.items, nuevo],
    }));

    setNuevoItem({ nombre: "", cantidad: "" });
  };

  const editarProducto = (item) => {
    const index = formulario.items.findIndex(
      (i) => i.nombre === item.nombre && i.cantidad === item.cantidad
    );
    if (index !== -1) {
      setProductoEditando({ ...item, index });
    }
    setModalEdicionProducto(true);
  };

  const guardarProductoEditado = () => {
    if (
      !productoEditando ||
      !productoEditando.nombre ||
      parseInt(productoEditando.cantidad) <= 0
    ) {
      abrirModal("advertencia", "La cantidad debe ser mayor a 0.");
      return;
    }

    const itemEditado = {
      nombre: productoEditando.nombre,
      cantidad: parseInt(productoEditando.cantidad),
    };

    const nuevosItems = [...formulario.items];
    nuevosItems[productoEditando.index] = itemEditado;
    setFormulario((prev) => ({ ...prev, items: nuevosItems }));
    setModalEdicionProducto(false);
    setProductoEditando(null);
  };

  const eliminarItem = (item) => {
    const index = formulario.items.findIndex(
      (i) => i.nombre === item.nombre && i.cantidad === item.cantidad
    );
    if (index !== -1) {
      setFormulario((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const guardar = async (e) => {
    e.preventDefault();

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

      const cantidad = formulario.items.reduce(
        (acc, item) => acc + (parseInt(item.cantidad) || 0),
        0
      );

      onGuardar({
        ...formulario,
        cantidadArticulos: cantidad,
        total: 0,
      });

      abrirModal("exito", "Orden registrada correctamente.");

      setFormulario({
        id: "",
        nombre: "",
        telefono: "",
        correo: "",
        direccion: "",
        notas: "",
        items: [],
      });

      if(modalAbierto == false){
        onClose();
      }
    }

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

    const existe = await verificarCorreoExistente(formulario.correo);
    if (existe) {
      abrirModal("advertencia", "Ya existe un usuario con ese correo.");
      return;
    }

    onGuardar({ ...formulario, idMateria: [] });

    abrirModal("exito", "Proveedor guardado correctamente.");

    setFormulario({
      id: "",
      nombre: "",
      telefono: "",
      correo: "",
      direccion: "",
      notas: "",
      items: [],
    });
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

          {datosIniciales && (
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
                <input
                  placeholder="Nombre"
                  name="nombre"
                  value={nuevoItem.nombre}
                  onChange={handleItemChange}
                  className="form-control"
                />
                <input
                  placeholder="Cantidad"
                  type="number"
                  name="cantidad"
                  value={nuevoItem.cantidad}
                  onChange={handleItemChange}
                  className="form-control"
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

      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)}>
        <ModalMensaje tipo={modalTipo} mensaje={modalMensaje} />
      </Modal>
    </>
  );
};

export default ModalProveedor;
