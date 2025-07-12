// Importa el hook useState de React para manejar el estado del componente
import { useState } from "react";
// Importa componentes personalizados para modales y botones reutilizables
import Modal from "../components/Modal";
import BotonGuardar from "../components/BotonGuardar";
import BotonCancelar from "../components/BotonCancelar";
import BotonEditar from "../components/BotonEditar";
import BotonEliminar from "../components/BotonEliminar";
import BotonAceptar from "../components/BotonAceptar";
// Importa la librería jsPDF para generar archivos PDF (facturas)
import { jsPDF } from "jspdf";
// Importa los estilos CSS específicos para el componente Pedidos
import "../styles/pedidos.css";
// Importa un componente personalizado para mostrar tablas con detalles
import TablaDetalles from "../components/TablaDetalles";

// Define el componente funcional Pedidos
const Pedidos = () => {
  // Estado para gestionar el inventario de productos
  const [inventario, setInventario] = useState([
    {
      id: 1,
      nombre: "Jabón Lavanda",
      costo: 650,
      precioUnitario: 1500,
      cantidad: 2,
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
      costo: 1650,
      precioUnitario: 2300,
      cantidad: 15,
      categoria: "Desengrasante",
      materias: [
        { id: 3, nombre: "Alcohol", cantidad: 5 },
        { id: 5, nombre: "Esencia de Lavanda", cantidad: 3 },
      ],
    },
  ]);

  // Estado para gestionar los pedidos pendientes
  const [pedidosPendiente, setPedidosPendiente] = useState([
    {
      id: 1,
      cliente: "Johan",
      productos: [
        { id: 2, nombre: "Alcohol Antiséptico", cantidad: 2, precio: 2500 },
      ],
    },
    {
      id: 2,
      cliente: "Kevin",
      productos: [
        { id: 2, nombre: "Alcohol Antiséptico", cantidad: 10, precio: 2500 },
      ],
    },
    {
      id: 3,
      cliente: "Samuel",
      productos: [
        { id: 1, nombre: "Jabón Lavanda", cantidad: 6, precio: 2500 },
      ],
    },
    {
      id: 4,
      cliente: "Andrés",
      productos: [
        { id: 2, nombre: "Alcohol Antiséptico", cantidad: 3, precio: 2500 },
      ],
    },
    {
      id: 5,
      cliente: "Camila",
      productos: [
        { id: 1, nombre: "Jabón Lavanda", cantidad: 2, precio: 2500 },
      ],
    },
    {
      id: 6,
      cliente: "Lucía",
      productos: [
        { id: 1, nombre: "Jabón Lavanda", cantidad: 1, precio: 2500 },
      ],
    },
    {
      id: 7,
      cliente: "Miguel",
      productos: [
        { id: 2, nombre: "Alcohol Antiséptico", cantidad: 5, precio: 2500 },
      ],
    },
    {
      id: 8,
      cliente: "Valentina",
      productos: [
        { id: 2, nombre: "Alcohol Antiséptico", cantidad: 1, precio: 2500 },
      ],
    },
    {
      id: 9,
      cliente: "Laura",
      productos: [
        { id: 1, nombre: "Jabón Lavanda", cantidad: 3, precio: 2500 },
      ],
    },
    {
      id: 10,
      cliente: "Santiago",
      productos: [
        { id: 1, nombre: "Jabón Lavanda", cantidad: 4, precio: 2500 },
      ],
    },
  ]);

  // Estado para controlar la visibilidad del modal de confirmación de venta
  const [mostrarConfirmarVenta, setMostrarConfirmarVenta] = useState(false);

  // Estado para almacenar el pedido que se está confirmando
  const [pedidoAConfirmar, setPedidoAConfirmar] = useState(null);
  // Estado para almacenar los productos confirmados del pedido
  const [productosAConfirmar, setProductosAConfirmar] = useState([]);

  // Estado para controlar la visibilidad del modal de clientes con producto pendiente
  const [mostrarClientesProducto, setMostrarClientesProducto] = useState(false);
  // Estado para almacenar la lista de clientes con productos pendientes
  const [clientesProducto, setClientesProducto] = useState([]);
  // Estado para almacenar el producto seleccionado para ver sus clientes
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  // Estado para controlar la visibilidad del modal de confirmación de eliminación
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  // Estado para almacenar el pedido que se desea eliminar
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);

  // Estado para manejar la advertencia de confirmar un pedido sin productos
  const [modalAdvertenciaConfirmarPedido, setModalAdvertenciaConfirmarPedido] =
    useState(false);

  // Función para confirmar una venta y, opcionalmente, generar un PDF
  const confirmarVenta = (imprimir) => {
    // Filtra el pedido confirmado de la lista de pedidos pendientes
    const actualizados = pedidosPendiente.filter(
      (p) => p.id !== pedidoAConfirmar.id
    );
    setPedidosPendiente(actualizados);

    // Actualiza el inventario restando las cantidades de los productos confirmados
    const nuevoInventario = inventario.map((prod) => {
      const encontrado = productosAConfirmar.find((p) => p.id === prod.id);
      if (encontrado) {
        return { ...prod, cantidad: prod.cantidad - encontrado.cantidad };
      }
      return prod;
    });
    setInventario(nuevoInventario);

    // Si se solicita imprimir, genera un PDF con los productos confirmados
    if (imprimir) {
      generarPDF({
        ...pedidoAConfirmar,
        productos: productosAConfirmar, // Usa los productos confirmados
      });
    }

    // Cierra el modal de confirmación y reinicia estados relacionados
    setMostrarConfirmarVenta(false);
    setMostrarEditarPedido(false);
    setPedidoSeleccionado(null);
    setProductosEditados([]);
    setBusqueda("");
    setSugerencias([]);
  };

  // Función para generar un PDF con la factura del pedido
  const generarPDF = (pedido) => {
    const doc = new jsPDF(); // Crea una nueva instancia de jsPDF
    doc.setFontSize(12); // Establece el tamaño de fuente
    doc.text(`Factura - Ticket #${pedido.id}`, 10, 10); // Agrega el título
    doc.text(`Cliente: ${pedido.cliente}`, 10, 20); // Agrega el nombre del cliente
    let y = 35; // Posición inicial para los productos
    // Itera sobre los productos para listarlos en el PDF
    pedido.productos.forEach((p, i) => {
      doc.text(`- ${p.nombre} x${p.cantidad} ($${p.precio})`, 10, y);
      y += 10; // Incrementa la posición vertical
    });
    // Calcula el total del pedido
    const total = pedido.productos.reduce(
      (sum, p) => sum + p.cantidad * p.precio,
      0
    );
    doc.text(`Total: $${total}`, 10, y + 10); // Agrega el total
    doc.save(`Factura_Ticket_${pedido.id}.pdf`); // Guarda el PDF
  };

  // Función para abrir el modal de confirmación de venta
  const abrirModalConfirmar = () => {
    // Verifica si hay un pedido seleccionado y productos editados
    if (!pedidoSeleccionado || productosEditados.length === 0) {
      setModalAdvertenciaConfirmarPedido(true); // Muestra advertencia si no hay productos
      return;
    }

    // Actualiza los productos del pedido seleccionado con los editados
    const actualizados = pedidosPendiente.map((p) =>
      p.id === pedidoSeleccionado.id
        ? { ...p, productos: productosEditados }
        : p
    );
    setPedidosPendiente(actualizados);

    // Configura el pedido y productos a confirmar
    setPedidoAConfirmar(pedidoSeleccionado);
    setProductosAConfirmar([...productosEditados]);
    setMostrarConfirmarVenta(true); // Muestra el modal de confirmación
  };

  // Calcula la producción pendiente agrupando cantidades por producto
  const produccionPendiente = inventario
    .map((producto) => {
      // Suma la cantidad total de cada producto en todos los pedidos pendientes
      const cantidadTotal = pedidosPendiente.reduce((total, pedido) => {
        const encontrado = pedido.productos.find((p) => p.id === producto.id);
        return encontrado ? total + encontrado.cantidad : total;
      }, 0);
      return {
        id: producto.id,
        nombre: producto.nombre,
        cantidad: cantidadTotal,
      };
    })
    .filter((p) => p.cantidad > 0) // Filtra productos con cantidad mayor a 0
    .sort((a, b) => b.cantidad - a.cantidad); // Ordena de mayor a menor cantidad

  // Función para abrir el modal que muestra los clientes con un producto pendiente
  const abrirModalClientesProducto = (producto) => {
    // Filtra los pedidos que contienen el producto seleccionado
    const resultado = pedidosPendiente
      .map((ticket) => {
        const productoEnFactura = ticket.productos.find(
          (p) => p.id === producto.id
        );
        if (productoEnFactura) {
          return {
            cliente: ticket.cliente,
            cantidad: productoEnFactura.cantidad,
            ticketId: ticket.id,
          };
        }
        return null;
      })
      .filter(Boolean); // Elimina resultados nulos

    // Configura los estados para el modal
    setClientesProducto(resultado);
    setProductoSeleccionado(producto);
    setMostrarClientesProducto(true); // Muestra el modal
  };

  // Estados para gestionar el modal de edición de pedidos
  const [mostrarEditarPedido, setMostrarEditarPedido] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [productosEditados, setProductosEditados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  // Función para abrir el modal de edición de un pedido
  const abrirModalEditarPedido = (pedido) => {
    setPedidoSeleccionado(pedido); // Establece el pedido seleccionado para edición
    setProductosEditados([...pedido.productos]); // Copia los productos del pedido para edición
    setMostrarEditarPedido(true); // Muestra el modal de edición
    setBusqueda(""); // Reinicia el campo de búsqueda
    setSugerencias([]); // Reinicia las sugerencias de búsqueda
  };

  // Función para actualizar la cantidad de un producto en el modal de edición
  const actualizarCantidad = (index, nuevaCantidad) => {
    const actualizados = [...productosEditados]; // Crea una copia de los productos editados
    actualizados[index].cantidad = Number(nuevaCantidad); // Actualiza la cantidad del producto en el índice dado
    setProductosEditados(actualizados); // Actualiza el estado con los productos modificados
  };

  // Función para eliminar un producto de la lista de productos editados
  const eliminarProducto = (index) => {
    const actualizados = [...productosEditados]; // Crea una copia de los productos editados
    actualizados.splice(index, 1); // Elimina el producto en el índice dado
    setProductosEditados(actualizados); // Actualiza el estado
  };

  // Función para manejar la búsqueda de productos en el modal de edición
  const manejarBusqueda = (texto) => {
    setBusqueda(texto); // Actualiza el texto de búsqueda
    // Filtra los productos del inventario que coincidan con el texto de búsqueda
    const filtrados = inventario.filter((p) =>
      p.nombre.toLowerCase().includes(texto.toLowerCase())
    );
    setSugerencias(filtrados); // Actualiza las sugerencias con los productos filtrados
  };

  // Función para agregar un producto al pedido en el modal de edición
  const agregarProducto = (producto) => {
    // Crea un nuevo objeto producto con valores iniciales
    const nuevo = {
      id: producto.id,
      nombre: producto.nombre,
      cantidad: 1,
      precio: producto.precioUnitario,
    };
    setProductosEditados([...productosEditados, nuevo]); // Agrega el nuevo producto a la lista
    setBusqueda(""); // Reinicia el campo de búsqueda
    setSugerencias([]); // Reinicia las sugerencias
  };

  // Función para guardar los cambios realizados en el modal de edición
  const guardarCambiosPedido = () => {
    // Actualiza el pedido seleccionado con los productos editados
    const actualizados = pedidosPendiente.map((p) =>
      p.id === pedidoSeleccionado.id
        ? { ...p, productos: productosEditados }
        : p
    );
    setPedidosPendiente(actualizados); // Actualiza la lista de pedidos pendientes
    setMostrarEditarPedido(false); // Cierra el modal de edición
  };

  // Función para abrir el modal de confirmación de eliminación de un pedido
  const abrirModalEliminarPedido = (pedido) => {
    setPedidoAEliminar(pedido); // Establece el pedido a eliminar
    setConfirmarEliminacion(true); // Muestra el modal de confirmación de eliminación
  };

  // Función para eliminar un pedido de la lista de pedidos pendientes
  const eliminarPedido = () => {
    // Filtra el pedido a eliminar de la lista
    const actualizados = pedidosPendiente.filter(
      (p) => p.id !== pedidoAEliminar.id
    );
    setPedidosPendiente(actualizados); // Actualiza la lista de pedidos
    setConfirmarEliminacion(false); // Cierra el modal de eliminación
  };

  // JSX que define la estructura de la interfaz del componente
  return (
    // Contenedor principal con clases CSS para estilos
    <main className="main-home inventario pedidos">
      <div className="container">
        <h2 className="text-center">Pedidos</h2> {/* Título centrado */}
      </div>

      <div className="container-tablas">
        {/* Sección para la tabla de producción pendiente */}
        <div>
          <h4 className="text-center">Producción Pendiente</h4> {/* Subtítulo */}
          {/* Componente TablaDetalles para mostrar productos con cantidades pendientes */}
          <TablaDetalles
            encabezados={["ID", "Nombre", "Cantidad", "Detalles"]} // Encabezados de la tabla
            registros={produccionPendiente.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              cantidad: p.cantidad,
            }))} // Mapea los datos de producción pendiente
            onIconClick={abrirModalClientesProducto} // Función para abrir modal al hacer clic en un ícono
          />
        </div>

        {/* Sección para la tabla de pedidos pendientes */}
        <div>
          <h4 className="text-center">Pedidos Pendientes</h4> {/* Subtítulo */}
          <table className="table table-sm table-bordered"> {/* Tabla con bordes */}
            <thead>
              <tr>
                <th># Ticket</th>
                <th>Cliente</th>
                <th>Precio Total</th>
                <th>Opciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapea los pedidos pendientes para mostrarlos en la tabla */}
              {pedidosPendiente.map((pedido, i) => (
                <tr key={i}>
                  <td>{pedido.id}</td> {/* ID del pedido */}
                  <td>{pedido.cliente}</td> {/* Nombre del cliente */}
                  <td>
                    $
                    {/* Calcula el precio total del pedido */}
                    {pedido.productos.reduce(
                      (total, p) => total + p.precio * p.cantidad,
                      0
                    )}
                  </td>
                  <td>
                    {/* Botones para editar y eliminar el pedido */}
                    <BotonEditar
                      onClick={() => abrirModalEditarPedido(pedido)}
                    />
                    <BotonEliminar
                      onClick={() => abrirModalEliminarPedido(pedido)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para mostrar los clientes con productos pendientes */}
      <Modal
        isOpen={mostrarClientesProducto} // Controla la visibilidad del modal
        onClose={() => setMostrarClientesProducto(false)} // Cierra el modal
      >
        <div className="encabezado-modal">
          <h2 className="text-center">Clientes con Producto Pendiente</h2> {/* Título */}
        </div>

        <div className="mb-2 text-center">
          {/* Muestra el nombre del producto seleccionado */}
          <h6 className="fw-bold text-success">
            <i className="bi bi-box-seam me-2"></i>
            {productoSeleccionado?.nombre}
          </h6>
        </div>

        <div className="row tarjetas-ajuste">
          {/* Mapea los clientes con productos pendientes para mostrarlos como tarjetas */}
          {clientesProducto.map((c, i) => (
            <div key={i}>
              <div className="card card-cliente shadow-sm">
                <div className="card-body">
                  <p>
                    <i className="bi bi-person-circle text-primary"></i>
                    <strong>{c.cliente}</strong> {/* Nombre del cliente */}
                  </p>
                  <p>
                    <i className="bi bi-receipt-cutoff text-dark"></i>
                    Ticket #{c.ticketId} {/* ID del ticket */}
                  </p>
                  <p>
                    <i className="bi bi-box2-heart-fill text-success"></i>
                    Cantidad: {c.cantidad} {/* Cantidad pendiente */}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pie-modal mt-2">
          {/* Botón para cerrar el modal */}
          <BotonAceptar onClick={() => setMostrarClientesProducto(false)} />
        </div>
      </Modal>

      {/* Modal para editar los productos de un pedido */}
      <Modal
        isOpen={mostrarEditarPedido} // Controla la visibilidad del modal
        onClose={() => setMostrarEditarPedido(false)} // Cierra el modal
      >
        <div className="encabezado-modal">
          <h2>Editar Productos del Pedido de <strong>{pedidoSeleccionado?.cliente}</strong></h2> {/* Título */}
        </div>

        <div className="mb-3">
          <label className="form-label">Buscar producto para agregar:</label>
          {/* Campo de búsqueda para agregar productos */}
          <input
            type="text"
            className="form-control"
            value={busqueda}
            onChange={(e) => manejarBusqueda(e.target.value)} // Maneja cambios en la búsqueda
            placeholder="Escribe el nombre del producto"
          />
          {/* Muestra sugerencias de productos basadas en la búsqueda */}
          {sugerencias.length > 0 && (
            <ul className="list-group mt-2">
              {sugerencias.map((prod, i) => {
                // Verifica si el producto ya está agregado o no tiene stock
                const yaAgregado = productosEditados.some(
                  (p) => p.id === prod.id
                );
                const sinStock = prod.cantidad === 0;
                const deshabilitado = yaAgregado || sinStock;

                // Selecciona el ícono según el estado del producto
                let icono;
                if (sinStock) {
                  icono = (
                    <i
                      className="bi bi-x-circle-fill text-danger me-2"
                      title="Sin stock"
                    ></i>
                  );
                } else if (yaAgregado) {
                  icono = (
                    <i
                      className="bi bi-exclamation-circle-fill text-warning me-2"
                      title="Ya agregado"
                    ></i>
                  );
                } else {
                  icono = (
                    <i
                      className="bi bi-check-circle-fill text-success me-2"
                      title="Disponible"
                    ></i>
                  );
                }

                return (
                  <li
                    key={i}
                    className={`list-group-item d-flex justify-content-between align-items-center ${
                      deshabilitado
                        ? "disabled text-muted"
                        : "list-group-item-action text-success fw-bold"
                    }`} // Aplica clases según el estado
                    style={{
                      cursor: deshabilitado ? "not-allowed" : "pointer", // Cambia el cursor
                    }}
                    onClick={() => {
                      if (!deshabilitado) agregarProducto(prod); // Agrega el producto si no está deshabilitado
                    }}
                  >
                    <span>
                      {icono}
                      {prod.nombre} {/* Nombre del producto */}
                    </span>
                    <span>
                      {sinStock ? (
                        <em>Sin stock</em>
                      ) : yaAgregado ? (
                        <em>Ya agregado</em>
                      ) : (
                        `$${prod.precioUnitario}` // Precio del producto
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Tabla para mostrar los productos editados */}
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {productosEditados.map((p, index) => (
              <tr key={index}>
                <td>{p.nombre}</td> {/* Nombre del producto */}
                <td>
                  {/* Campo para editar la cantidad */}
                  <input
                    type="number"
                    className="form-control"
                    value={p.cantidad}
                    min={1}
                    onChange={(e) => actualizarCantidad(index, e.target.value)} // Actualiza la cantidad
                  />
                </td>
                <td>${p.precio}</td> {/* Precio del producto */}
                <td>
                  {/* Botón para eliminar el producto */}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => eliminarProducto(index)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Botones en el pie del modal */}
        <div className="pie-modal">
          <BotonCancelar onClick={() => setMostrarEditarPedido(false)} /> {/* Cierra el modal */}
          <BotonGuardar onClick={guardarCambiosPedido} /> {/* Guarda los cambios */}
          {/* Botón para confirmar el pedido */}
          <button
            className="btn btn-success ms-2"
            onClick={abrirModalConfirmar}
          >
            Confirmar Pedido
          </button>
        </div>
      </Modal>

      {/* Modal para confirmar la eliminación de un pedido */}
      {confirmarEliminacion && (
        <Modal
          isOpen={confirmarEliminacion} // Controla la visibilidad
          onClose={() => setConfirmarEliminacion(false)} // Cierra el modal
        >
          <div className="encabezado-modal">
            <h2>Confirmar Eliminación</h2> {/* Título */}
          </div>
          <p>
            ¿Desea eliminar el pedido del cliente{" "}
            <strong>{pedidoAEliminar?.cliente}</strong>? {/* Mensaje de confirmación */}
          </p>
          <div className="pie-modal">
            <BotonCancelar onClick={() => setConfirmarEliminacion(false)} /> {/* Cierra el modal */}
            <BotonAceptar onClick={eliminarPedido} /> {/* Confirma la eliminación */}
          </div>
        </Modal>
      )}

      {/* Modal para confirmar la venta (con o sin impresión) */}
      <Modal
        isOpen={mostrarConfirmarVenta} // Controla la visibilidad
        onClose={() => setMostrarConfirmarVenta(false)} // Cierra el modal
      >
        <div className="encabezado-modal">
          <h2 className="text-center">
            <i className="bi bi-check-circle-fill text-success me-2"></i>
            Confirmar Pedido {/* Título con ícono */}
          </h2>
        </div>

        <hr className="my-3" /> {/* Separador horizontal */}

        <p className="text-center">
          ¿Desea confirmar el pedido del cliente{" "}
          <span className="fw-bold">{pedidoAConfirmar?.cliente}</span> ? {/* Mensaje de confirmación */}
        </p>

        <p className="text-center text-muted">
          Seleccione una opción para finalizar la venta del pedido{" "}
          <strong>(Ticket #{pedidoAConfirmar?.id})</strong>. {/* Instrucción */}
        </p>

        {/* Muestra el total a pagar */}
        <div className="text-center mt-4 mb-3">
          <h4 className="text-dark">
            Total a pagar:{" "}
            <span className="text-success fw-bold">
              $
              {/* Calcula el total del pedido */}
              {productosAConfirmar.reduce(
                (total, p) => total + p.precio * p.cantidad,
                0
              )}
            </span>
          </h4>
        </div>

        <div className="pie-modal">
          <BotonCancelar onClick={() => setMostrarConfirmarVenta(false)} /> {/* Cierra el modal */}
          {/* Botón para confirmar sin imprimir */}
          <button
            className="btn btn-outline-success"
            onClick={() => confirmarVenta(false)}
          >
            Confirmar sin Imprimir
          </button>
          {/* Botón para confirmar e imprimir */}
          <button
            className="btn btn-success ms-2"
            onClick={() => confirmarVenta(true)}
          >
            Confirmar e Imprimir
          </button>
        </div>
      </Modal>

      {/* Modal de advertencia para pedidos sin productos */}
      {modalAdvertenciaConfirmarPedido && (
        <Modal
          isOpen={modalAdvertenciaConfirmarPedido} // Controla la visibilidad
          onClose={() => setModalAdvertenciaConfirmarPedido(false)} // Cierra el modal
        >
          <div className="encabezado-modal">
            <h2>Advertencia</h2> {/* Título */}
          </div>
          <p className="text-center">
            ¡No hay productos para confirmar el pedido! {/* Mensaje de advertencia */}
          </p>
          <div className="pie-modal">
            <BotonAceptar
              type="button"
              onClick={() => setModalAdvertenciaConfirmarPedido(false)} // Cierra el modal
            />
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Pedidos;