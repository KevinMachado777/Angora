import React from 'react';
import "../styles/botones.css";

const BotonEliminar = ({ onClick }) => {
  return (
    <button className="btn-eliminar" onClick={onClick}>
      <i className="bi bi-trash"></i> Eliminar
    </button>
  );
};

export default BotonEliminar;
