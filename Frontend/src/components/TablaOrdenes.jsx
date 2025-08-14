import React from 'react';
import "../styles/inventario.css"; // Asegúrate de que los estilos sean aplicables o crea un CSS específico si es necesario

// Este nuevo componente de tabla es para las órdenes de compra.
// No tiene la columna "Opciones" hardcodeada.
// Espera que los botones de acción se incluyan directamente en la propiedad 'acciones' de cada registro,
// y que 'cabeceros' incluya una entrada para "Acciones".
export const TablaOrdenes = ({ cabeceros = [], registros = [] }) => {
  return (
    <table>
      <thead>
        <tr>
          {cabeceros.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {registros.map((registro, filaIndex) => {
          return (
            <tr key={filaIndex}>
              {/* Iteramos sobre los cabeceros para asegurar el orden de las columnas */}
              {cabeceros.map((header, colIndex) => {
                // Obtenemos la clave del registro que corresponde al cabecero actual
                // Esto asume que el orden de las propiedades en 'registro' coincide con 'cabeceros'
                // o que la propiedad 'acciones' se maneja de forma especial.
                // Para mayor robustez, se recomienda que 'registros' sea un array de objetos
                // donde las claves coincidan exactamente con los nombres de los cabeceros (o un mapeo claro).
                const key = Object.keys(registro)[colIndex];
                const value = registro[key];

                // Si la columna es 'Acciones', renderiza el valor directamente (debería ser JSX)
                if (header === "Acciones") {
                  return <td key={colIndex}>{value}</td>;
                }
                // Para otras columnas, muestra el valor normal
                return <td key={colIndex}>{value}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
