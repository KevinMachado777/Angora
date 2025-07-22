import React from 'react';
import "../styles/botones.css";

const BotonProveedores = ({ onClick }) => {
  return (
    <button className="btn-ordenes" onClick={onClick}>
      <i className="bi bi-person-plus"></i> Proveedores
    </button>
  );
};

export default BotonProveedores;