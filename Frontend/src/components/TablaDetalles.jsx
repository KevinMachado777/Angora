import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Componente de tabla reutilizable con ícono de acción en la última columna.
 *
 * @param {Array} encabezados - Arreglo con los encabezados de la tabla.
 * @param {Array} registros - Arreglo de objetos (filas) que se mostrarán.
 * @param {Function} onIconClick - Función que se ejecuta al hacer clic en el ícono.
 * @param {String} iconoClase - Clase de ícono Bootstrap Icons (por defecto: "bi bi-eye").
 * @param {String} textoIcono - Texto alternativo para tooltip o accesibilidad.
 */
const TablaDetalles = ({
  encabezados = [],
  registros = [],
  onIconClick = () => {},
  iconoClase = "bi bi-eye",
  textoIcono = "Detalles",
}) => {
  return (
    <table className="table table-sm table-bordered">
      <thead>
        <tr>
          {encabezados.map((encabezado, i) => (
            <th key={i}>{encabezado}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {registros.map((registro, i) => (
          <tr key={i}>
            {Object.values(registro).map((valor, j) => (
              <td key={j}>{valor}</td>
            ))}
            <td>
              <i
                className={iconoClase}
                title={textoIcono}
                style={{ cursor: "pointer" }}
                onClick={() => onIconClick(registro)}
              ></i>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TablaDetalles;
