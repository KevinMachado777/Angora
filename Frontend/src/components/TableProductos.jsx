import "../styles/inventario.css";

export const TableProductos = () => {
  return (
    <table>
        {/* Cabeceros */}
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Costo</th>
          <th>Precio Unitario</th>
          <th>Cantidad</th>
          <th>Categoria</th>
          <th>Opciones</th>
        </tr>
      </thead>
      <tbody>

        {/* Registros */}
        <tr>
          <td>1</td>
          <td>Lavamanos</td>
          <td>$3000</td>
          <td>$4500</td>
          <td>5</td>
          <td>Jabon</td>

          {/* Botones de opciones */}
          <td>
            <button className="btn btn-warning btn-sm">Editar</button>
            <button className="btn btn-danger btn-sm">Eliminar</button>
          </td>
        </tr>
        <tr>
          <td>2</td>
          <td>Glicerina</td>
          <td>$5000</td>
          <td>$13200</td>
          <td>9</td>
          <td>Sustancia</td>
          <td>
            <button className="btn btn-warning btn-sm">Editar</button>
            <button className="btn btn-danger btn-sm">Eliminar</button>
          </td>
        </tr>
        <tr>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>
            <button className="btn btn-warning btn-sm">Editar</button>
            <button className="btn btn-danger btn-sm">Eliminar</button>
          </td>
        </tr>
        <tr>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>
            <button className="btn btn-warning btn-sm">Editar</button>
            <button className="btn btn-danger btn-sm">Eliminar</button>
          </td>
        </tr>
        <tr>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>
            <button className="btn btn-warning btn-sm">Editar</button>
            <button className="btn btn-danger btn-sm">Eliminar</button>
          </td>
        </tr>
        <tr>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>
            <button className="btn btn-warning btn-sm">Editar</button>
            <button className="btn btn-danger btn-sm">Eliminar</button>
          </td>
        </tr>
        <tr>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>
            <button className="btn btn-warning btn-sm">Editar</button>
            <button className="btn btn-danger btn-sm">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
