import "../styles/inventario.css";

// Componente de la tabla de materia prima
export const TableMateria = () => {


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
        

        {/* 

        {
            // Codigo para desempaquetar
        }
        
        */}

        {/* Registros */}
        <tr>
          <td>1</td>
          <td>Agua</td>
          <td>$323</td>
          <td>$5000</td>
          <td>7</td>
          <td>Recurso Natural</td>

          {/* Botones para cada fila */}
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
