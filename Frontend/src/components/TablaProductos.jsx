import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import "../styles/tablaProductos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import BotonEditar from "./BotonEditar";
import BotonEliminar from "./BotonEliminar";
import BotonAceptar from "./BotonAceptar";

// Define un arreglo estático global de materias primas con sus propiedades
const inventarioMateriaPrimaGlobal = [
  {
    id: 1,
    nombre: "Glicerina",
    costo: 100,
    precioUnitario: 150,
    cantidad: 120
  },
  {
    id: 2,
    nombre: "Hidróxido de sodio",
    costo: 200,
    precioUnitario: 300,
    cantidad: 80,
  },
  {
    id: 3,
    nombre: "Alcohol",
    costo: 150,
    precioUnitario: 225,
    cantidad: 200,
  },
  {
    id: 4,
    nombre: "Colorante Azul",
    costo: 50,
    precioUnitario: 75,
    cantidad: 60,
  },
  {
    id: 5,
    nombre: "Esencia de Lavanda",
    costo: 300,
    precioUnitario: 450,
    cantidad: 40,
  }
];

// Componente funcional envuelto con forwardRef para permitir que componentes padres llamen a sus métodos
const TablaProductos = forwardRef((props, ref) => {
  // Estado para gestionar la lista de productos en el inventario
  const [registros, setRegistros] = useState([
    {
      id: 1,
      nombre: "Jabón Lavanda",
      costo: 650, // Calculado como: 3*100 (Glicerina) + 1*50 (Colorante Azul) + 1*300 (Esencia Lavanda)
      precioUnitario: 1500,
      cantidad: 10,
      categoria: "Jabón",
      materias: [
        { id: 1, nombre: "Glicerina", cantidad: 3 },
        { id: 4, nombre: "Colorante Azul", cantidad: 1 },
        { id: 5, nombre: "Esencia de Lavanda", cantidad: 1 },
      ],
    },
    {
      id: 2,
      nombre: "Alcohol Antiséptico",
      costo: 1650, // Calculado como: 5*150 (Alcohol) + 3*300 (Esencia Lavanda)
      precioUnitario: 2300,
      cantidad: 15,
      categoria: "Desengrasante",
      materias: [
        { id: 3, nombre: "Alcohol", cantidad: 5 },
        { id: 5, nombre: "Esencia de Lavanda", cantidad: 3 },
      ],
    },
  ]);

  // Estado para gestionar el producto seleccionado actualmente (nulo si se está agregando un producto nuevo)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  // Estado para controlar la visibilidad del modal de agregar/editar producto
  const [modalAbierta, setModalAbierta] = useState(false);
  // Estado para almacenar las materias primas asociadas al producto actual
  const [materiasProducto, setMateriasProducto] = useState([]);
  // Estado para controlar la visibilidad del modal de agregar/editar materia prima
  const [modalMateriaAbierta, setModalMateriaAbierta] = useState(false);
  // Estado para almacenar los datos de una materia prima nueva o editada
  const [materiaNueva, setMateriaNueva] = useState({ id: 0, cantidad: 0 });
  // Estado para rastrear si se está editando una materia prima
  const [modoEdicionMateria, setModoEdicionMateria] = useState(false);
  // Estado para almacenar el índice de la materia prima que se está editando
  const [indiceEdicionMateria, setIndiceEdicionMateria] = useState(null);
  // Estado para controlar la visibilidad del modal de actualización de stock
  const [modalStock, setModalStock] = useState(false);
  // Estado para almacenar el producto cuyo stock se está actualizando
  const [productoStock, setProductoStock] = useState(null);
  // Estado para gestionar el inventario de materias primas (copia profunda del inventario global)
  const [inventarioMateriaPrima, setInventarioMateriaPrima] = useState(
    JSON.parse(JSON.stringify(inventarioMateriaPrimaGlobal))
  );
  // Estado para almacenar el costo total del producto basado en las materias primas
  const [costoTotal, setCostoTotal] = useState(0);
  // Estado para rastrear si el costo fue modificado manualmente
  const [costoModificadoManualmente, setCostoModificadoManualmente] = useState(false);
  // Estado para almacenar datos temporales del formulario de agregar/editar producto
  const [formularioTemp, setFormularioTemp] = useState({ cantidad: 0 });
  // Estado para almacenar el número máximo de unidades fabricables según el inventario
  const [maxFabricable, setMaxFabricable] = useState(null);
  // Estados para controlar los modales de advertencia por stock insuficiente, ID inválido y materia duplicada
  const [modalAdvertenciaPocoStock, setModalAdvertenciaPocoStock] = useState(false);
  const [modalAdvertenciaIdInvalido, setModalAdvertenciaIdInvalido] = useState(false);
  const [modalAdvertenciaMateriaAgregada, setModalAdvertenciaMateriaAgregada] = useState(false);

  // Expone un método a los componentes padres para abrir el modal de agregar producto
  useImperativeHandle(ref, () => ({
    abrirModalAgregar: () => {
      setProductoSeleccionado(null); // Limpia el producto seleccionado para agregar uno nuevo
      setMateriasProducto([]); // Reinicia la lista de materias primas
      setCostoTotal(0); // Reinicia el costo total
      setCostoModificadoManualmente(false); // Reinicia la bandera de costo modificado manualmente
      setFormularioTemp({ cantidad: 0 }); // Reinicia los datos del formulario
      setModalAbierta(true); // Abre el modal de producto
    },
  }));

  // Efecto para calcular automáticamente el costo total basado en las materias primas, salvo que se haya modificado manualmente
  useEffect(() => {
    if (!costoModificadoManualmente) {
      const nuevoCosto = materiasProducto.reduce((acc, mat) => {
        const inv = inventarioMateriaPrima.find((m) => m.id === mat.id);
        return acc + (inv?.costo || 0) * mat.cantidad;
      }, 0);
      setCostoTotal(nuevoCosto); // Actualiza el costo total
    }
  }, [materiasProducto, costoModificadoManualmente, inventarioMateriaPrima]);

  // Función para abrir el modal de edición de un producto con datos prellenados
  const abrirModalEditar = (producto) => {
    setProductoSeleccionado(producto); // Establece el producto seleccionado
    setMateriasProducto(producto.materias || []); // Carga las materias primas del producto
    setCostoTotal(producto.costo || 0); // Establece el costo actual
    setCostoModificadoManualmente(true); // Marca el costo como modificado manualmente
    setFormularioTemp({
      id: producto.id,
      nombre: producto.nombre,
      precioUnitario: producto.precioUnitario,
      cantidad: producto.cantidad,
      categoria: producto.categoria,
    }); // Prellena el formulario con los datos del producto
    setModalAbierta(true); // Abre el modal de producto
  };

  // Función para abrir el modal de actualización de stock y calcular el máximo de unidades fabricables
  const abrirModalStock = (producto) => {
    setProductoStock(producto); // Establece el producto para actualizar el stock
    if (producto?.materias?.length) {
      const cantidadesPosibles = producto.materias.map((mat) => {
        const inv = inventarioMateriaPrima.find((m) => m.id === mat.id);
        return inv ? Math.floor(inv.cantidad / mat.cantidad) : 0;
      });
      setMaxFabricable(Math.min(...cantidadesPosibles)); // Calcula el máximo de unidades fabricables
    } else {
      setMaxFabricable(0); // Sin materias primas, no se pueden fabricar unidades
    }
    setModalStock(true); // Abre el modal de stock
  };

  // Función para eliminar un producto del inventario
  const eliminarProducto = (producto) => {
    setRegistros(registros.filter((p) => p.id !== producto.id)); // Elimina el producto por ID
  };

  // Función para guardar un producto nuevo o editado
  const guardarProducto = (e) => {
    e.preventDefault();
    const nuevo = {
      id: Number(formularioTemp.id),
      nombre: formularioTemp.nombre,
      costo: Number(costoTotal),
      precioUnitario: Number(formularioTemp.precioUnitario),
      cantidad: Number(formularioTemp.cantidad),
      categoria: formularioTemp.categoria,
      materias: materiasProducto,
    }; // Crea un nuevo objeto de producto

    if (productoSeleccionado) {
      setRegistros(registros.map((p) => (p.id === nuevo.id ? nuevo : p))); // Actualiza el producto existente
    } else {
      setRegistros([...registros, nuevo]); // Agrega un nuevo producto
    }

    // Reinicia los estados del modal y formulario
    setModalAbierta(false);
    setProductoSeleccionado(null);
    setMateriasProducto([]);
    setCostoTotal(0);
    setCostoModificadoManualmente(false);
    setFormularioTemp({});
  };

  // Función para agregar o editar una materia prima en el producto actual
  const agregarMateriaAlProducto = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const id = Number(materiaNueva.id);
    const cantidad = Number(materiaNueva.cantidad);
    const materia = inventarioMateriaPrima.find((m) => m.id === id);

    if (!materia) {
      setModalAdvertenciaIdInvalido(true); // Muestra advertencia por ID de materia inválido
      return;
    }
    if (isNaN(cantidad)) {
      alert("Cantidad inválida."); // Alerta por cantidad inválida
      return;
    }

    const nuevaMateria = { id, nombre: materia.nombre, cantidad };
    const nuevasMaterias = [...materiasProducto];

    if (modoEdicionMateria && indiceEdicionMateria !== null) {
      nuevasMaterias[indiceEdicionMateria] = nuevaMateria; // Actualiza la materia existente
    } else {
      if (materiasProducto.find((m) => m.id === id)) {
        setModalAdvertenciaMateriaAgregada(true); // Muestra advertencia por materia duplicada
        return;
      }
      nuevasMaterias.push(nuevaMateria); // Agrega una nueva materia
    }

    setMateriasProducto(nuevasMaterias); // Actualiza la lista de materias primas
    setModoEdicionMateria(false); // Reinicia el modo de edición
    setIndiceEdicionMateria(null); // Limpia el índice de edición
    setMateriaNueva({ id: 0, cantidad: 0 }); // Reinicia el formulario de materia
    setModalMateriaAbierta(false); // Cierra el modal de materia
    setCostoModificadoManualmente(false); // Permite recalcular el costo automáticamente
  };

  // Función para actualizar el stock de un producto
  const actualizarStock = (e) => {
    e.preventDefault();
    const nuevaCantidad = parseInt(e.target.stockCantidad.value, 10);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 0) return; // Valida la entrada

    const diferencia = nuevaCantidad - productoStock.cantidad; // Calcula el cambio en el stock

    if (diferencia > 0) {
      // Verifica si hay suficientes materias primas para aumentar el stock
      for (const mat of productoStock.materias) {
        const inv = inventarioMateriaPrima.find((m) => m.id === mat.id);
        if (!inv || inv.cantidad < mat.cantidad * diferencia) {
          setModalAdvertenciaPocoStock(true); // Muestra advertencia por stock insuficiente
          return;
        }
      }

      // Descuenta las materias primas del inventario para el aumento de stock
      const nuevoInventario = inventarioMateriaPrima.map((inv) => {
        const usada = productoStock.materias.find((m) => m.id === inv.id);
        return usada
          ? { ...inv, cantidad: inv.cantidad - usada.cantidad * diferencia }
          : inv;
      });
      setInventarioMateriaPrima(nuevoInventario); // Actualiza el inventario
    }

    // Actualiza el stock del producto
    setRegistros(
      registros.map((p) =>
        p.id === productoStock.id ? { ...p, cantidad: nuevaCantidad } : p
      )
    );
    setModalStock(false); // Cierra el modal de stock
  };

  // Renderiza el componente
  return (
    <div className="container inventario">
      {/* Tabla principal de productos */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Costo</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Categoría</th>
            <th>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.costo}</td>
              <td>{p.precioUnitario}</td>
              <td>{p.cantidad}</td>
              <td>{p.categoria}</td>
              <td>
                <BotonEditar onClick={() => abrirModalEditar(p)}>Editar</BotonEditar>
                <BotonEliminar onClick={() => eliminarProducto(p)}>Eliminar</BotonEliminar>
                <button className="btn btn-sm btn-outline-dark" onClick={() => abrirModalStock(p)}>Stock</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para agregar/editar un producto */}
      {modalAbierta && (
        <Modal isOpen={modalAbierta} onClose={() => setModalAbierta(false)}>
          <form onSubmit={guardarProducto}>
            <div className="mb-2 text-center"><h4>Agregar / Editar Producto</h4></div>

            <div className="mb-2">
              <label className="form-label">ID</label>
              <input
                type="number"
                className="form-control mb-2"
                value={formularioTemp.id || ""}
                min={1}
                required
                onChange={(e) => setFormularioTemp({ ...formularioTemp, id: Number(e.target.value) })}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control mb-2"
                value={formularioTemp.nombre || ""}
                required
                onChange={(e) => setFormularioTemp({ ...formularioTemp, nombre: e.target.value })}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Costo</label>
              <input
                type="number"
                className="form-control mb-2"
                value={costoTotal}
                min={0}
                onChange={(e) => {
                  setCostoTotal(Number(e.target.value));
                  setCostoModificadoManualmente(true);
                }}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Precio Unitario</label>
              <input
                type="number"
                className="form-control mb-2"
                value={formularioTemp.precioUnitario || ""}
                min={0}
                required
                onChange={(e) => setFormularioTemp({ ...formularioTemp, precioUnitario: Number(e.target.value) })}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                className="form-control mb-2"
                value={formularioTemp.cantidad || 0}
                min={0}
                required
                disabled
                onChange={(e) =>
                  setFormularioTemp({
                    ...formularioTemp,
                    cantidad: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>

            <label className="form-label">Categoría</label>
            <select
              className="form-select mb-3"
              required
              value={formularioTemp.categoria || ""}
              onChange={(e) => setFormularioTemp({ ...formularioTemp, categoria: e.target.value })}
            >
              <option value="">Selecciona categoría</option>
              <option value="Jabón">Jabón</option>
              <option value="Desengrasante">Desengrasante</option>
              <option value="Insumo">Insumo</option>
              <option value="Embalaje">Embalaje</option>
            </select>

            <h6 className="text-center">Materias Primas</h6>
            <table className="table table-sm table-bordered">
              <thead>
                <tr><th>ID</th><th>Nombre</th><th>Cantidad</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {materiasProducto.map((m, i) => (
                  <tr key={i}>
                    <td>{m.id}</td>
                    <td>{m.nombre}</td>
                    <td>{m.cantidad}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setModoEdicionMateria(true);
                          setIndiceEdicionMateria(i);
                          setMateriaNueva({ id: m.id, cantidad: m.cantidad });
                          setModalMateriaAbierta(true);
                        }}
                      >Editar</button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const copia = [...materiasProducto];
                          copia.splice(i, 1);
                          setMateriasProducto(copia);
                          setCostoModificadoManualmente(false);
                        }}
                      >Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              type="button"
              className="btn btn-success mt-2"
              onClick={() => {
                setModoEdicionMateria(false);
                setMateriaNueva({ id: 0, cantidad: 0 });
                setModalMateriaAbierta(true);
              }}
            >Agregar Materia Prima</button>

            <div className="d-flex justify-content-end mt-3">
              <BotonCancelar onClick={() => setModalAbierta(false)} />
              <BotonGuardar type="submit" />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal para agregar/editar una materia prima */}
      {modalMateriaAbierta && (
        <Modal isOpen={modalMateriaAbierta} onClose={() => setModalMateriaAbierta(false)}>
          <form onSubmit={agregarMateriaAlProducto}>
            <h5 className="text-center">Materia Prima</h5>
            <label className="form-label">ID</label>
            <input
              type="number"
              className="form-control mb-2"
              required
              disabled={modoEdicionMateria}
              value={materiaNueva.id}
              onChange={(e) => setMateriaNueva({ ...materiaNueva, id: parseInt(e.target.value, 10) || 0 })}
            />

            <label className="form-label">Cantidad Requerida</label>
            <input
              type="number"
              className="form-control mb-2"
              required
              value={materiaNueva.cantidad}
              min={1}
              onChange={(e) => setMateriaNueva({
                ...materiaNueva,
                cantidad: e.target.value === "" ? 0 : parseInt(e.target.value, 10)
              })}
            />

            <div className="d-flex justify-content-end">
              <BotonCancelar onClick={() => setModalMateriaAbierta(false)} />
              <BotonGuardar type="submit" />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal para actualizar el stock de un producto */}
      {modalStock && (
        <Modal isOpen={modalStock} onClose={() => setModalStock(false)}>
          <form onSubmit={actualizarStock}>
            <h5 className="text-center">Cambiar cantidad de stock de {productoStock?.nombre}</h5>
            {maxFabricable !== null && (
              <div className="alert alert-info">
                Puedes fabricar hasta <strong>{maxFabricable}</strong> unidades con el inventario actual.
              </div>
            )}
            <div className="alert alert-primary">
              Cantidad actual es <strong>{productoStock?.cantidad}</strong> unidades.
            </div>
            <label className="form-label">Nueva cantidad deseada</label>
            <input
              name="stockCantidad"
              type="number"
              required
              className="form-control mb-3"
              min={0}
            />
            <div className="d-flex justify-content-end">
              <BotonCancelar onClick={() => setModalStock(false)} />
              <BotonGuardar type="submit" />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de advertencia para stock insuficiente de materias primas */}
      {modalAdvertenciaPocoStock && (
        <Modal isOpen={modalAdvertenciaPocoStock} onClose={() => setModalAdvertenciaPocoStock(false)}>
          <div className="encabezado-modal">
            <h2>Advertencia</h2>
          </div>
          <p className="text-center">¡Materia prima <strong>Insuficiente</strong> para aumentar el stock!</p>
          <div className="pie-modal">
            <BotonAceptar type="button" onClick={() => setModalAdvertenciaPocoStock(false)} />
          </div>
        </Modal>
      )}

      {/* Modal de advertencia para ID de materia prima inválido */}
      {modalAdvertenciaIdInvalido && (
        <Modal isOpen={modalAdvertenciaIdInvalido} onClose={() => setModalAdvertenciaIdInvalido(false)}>
          <div className="encabezado-modal">
            <h2>Advertencia</h2>
          </div>
          <p className="text-center">¡No existe ninguna Materia prima con el ID <strong>{Number(materiaNueva.id)}</strong>!</p>
          <div className="pie-modal">
            <BotonAceptar type="button" onClick={() => setModalAdvertenciaIdInvalido(false)} />
          </div>
        </Modal>
      )}

      {/* Modal de advertencia para materia prima duplicada */}
      {modalAdvertenciaMateriaAgregada && (
        <Modal isOpen={modalAdvertenciaMateriaAgregada} onClose={() => setModalAdvertenciaMateriaAgregada(false)}>
          <div className="encabezado-modal">
            <h2>Advertencia</h2>
          </div>
          <p className="text-center">¡La Materia prima con el ID <strong>{Number(materiaNueva.id)}</strong> ya fue agregada!</p>
          <div className="pie-modal">
            <BotonAceptar type="button" onClick={() => setModalAdvertenciaMateriaAgregada(false)} />
          </div>
        </Modal>
      )}
    </div>
  );
});

export default TablaProductos;
