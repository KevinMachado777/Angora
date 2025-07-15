import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import BotonAceptar from "../components/BotonAceptar";
import BotonCancelar from "../components/BotonCancelar";
import { CreadorTabla } from "./CreadorTabla";
import "../styles/proveedores.css"

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

  const [nuevoItem, setNuevoItem] = useState({
    nombre: "",
    cantidad: "",
    precio: "",
  });
  const [modalEdicionProducto, setModalEdicionProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const conItems = {
      ...datosIniciales,
      items: Array.isArray(datosIniciales?.items) ? datosIniciales.items : [],
    };

    setFormulario(
      datosIniciales
        ? conItems
        : {
            id: "", // id inicia vacío siempre
            nombre: "",
            telefono: "",
            correo: "",
            direccion: "",
            notas: "",
            items: [],
          }
    );

    setNuevoItem({ nombre: "", cantidad: "", precio: "" });
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNuevoItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductoEditChange = (e) => {
    const { name, value } = e.target;
    setProductoEditando((prev) => ({ ...prev, [name]: value }));
  };

  const agregarItem = () => {
    if (!nuevoItem.nombre || !nuevoItem.cantidad || !nuevoItem.precio) return;

    const itemConSubtotal = {
      ...nuevoItem,
      subtotal: (
        (parseFloat(nuevoItem.precio) || 0) *
        (parseInt(nuevoItem.cantidad) || 0)
      ).toFixed(2),
    };

    setFormulario((prev) => ({
      ...prev,
      items: [...prev.items, itemConSubtotal],
    }));
    setNuevoItem({ nombre: "", cantidad: "", precio: "" });
  };

  const editarProducto = (item) => {
    const index = formulario.items.findIndex(
      (i) =>
        i.nombre === item.nombre &&
        i.cantidad === item.cantidad &&
        i.precio === item.precio &&
        i.subtotal === item.subtotal
    );
    if (index !== -1) {
      setProductoEditando({
        ...item,
        index: index,
      });
    }
    setModalEdicionProducto(true);
    console.log("Editanto");
  };

  const guardarProductoEditado = () => {
    if (
      !productoEditando ||
      !productoEditando.nombre ||
      !productoEditando.cantidad ||
      !productoEditando.precio
    )
      return;

    const itemEditado = {
      ...productoEditando,
      subtotal: (
        (parseFloat(productoEditando.precio) || 0) *
        (parseInt(productoEditando.cantidad) || 0)
      ).toFixed(2),
    };

    const nuevosItems = [...formulario.items];
    nuevosItems[productoEditando.index] = itemEditado;
    setFormulario((prev) => ({ ...prev, items: nuevosItems }));
    setModalEdicionProducto(false);
    setProductoEditando(null);
  };

  const eliminarItem = (item) => {
    const index = formulario.items.findIndex(
      (i) =>
        i.nombre === item.nombre &&
        i.cantidad === item.cantidad &&
        i.precio === item.precio &&
        i.subtotal === item.subtotal
    );
    if (index !== -1) {
      setFormulario((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const guardar = (e) => {
    e.preventDefault();
    if (esOrden) {
      const cantidad = formulario.items.reduce(
        (acc, item) => acc + (parseInt(item.cantidad) || 0),
        0
      );
      const total = formulario.items.reduce(
        (acc, item) => acc + (parseFloat(item.subtotal) || 0),
        0
      );

      if (formulario.items.length === 0) {
        alert("La orden debe tener al menos un ítem.");
        return;
      }

      onGuardar({
        ...formulario,
        cantidadArticulos: cantidad,
        total: total.toFixed(2),
      });
    } else {
      onGuardar(formulario);
    }
    if (!modalEdicionProducto) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal */}
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

          <div className="grupo-formulario">
            <label>ID del proveedor:</label>
            <input
              type="text"
              name="id"
              value={formulario.id}
              onChange={handleChange}
              disabled={!!datosIniciales}
              className="form-control"
            />
          </div>

          <div className="grupo-formulario">
            <label>Nombre :</label>
            <input
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              className="form-control"
            />
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
                <h3 className="proveedores subtitulo">Registro de materia prima </h3>
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
                <input
                  placeholder="Precio"
                  type="number"
                  name="precio"
                  value={nuevoItem.precio}
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
                cabeceros={["Nombre", "Cantidad", "Precio", "Subtotal"]}
                registros={(formulario.items ?? []).map((item) => ({
                  nombre: item.nombre || "",
                  cantidad: item.cantidad || "",
                  precio: item.precio || "",
                  subtotal: item.subtotal || "",
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

      {/* Modal secundaria para editar producto (desacoplada) */}
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
              onChange={handleProductoEditChange}
              className="form-control"
            />
          </div>
          <div className="grupo-formulario">
            <label>Cantidad:</label>
            <input
              type="number"
              name="cantidad"
              value={productoEditando.cantidad}
              onChange={handleProductoEditChange}
              className="form-control"
            />
          </div>
          <div className="grupo-formulario">
            <label>Precio:</label>
            <input
              type="number"
              name="precio"
              value={productoEditando.precio}
              onChange={handleProductoEditChange}
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
    </>
  );
};

export default ModalProveedor;
