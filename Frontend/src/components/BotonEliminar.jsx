import React from 'react';
import "../styles/botones.css";

const BotonEliminar = ({ onClick }) => {
  return (
    <button className="btn-eliminar" onClick={onClick}>
      <i class="bi bi-trash"></i> Eliminar
    </button>
  );
};

export default BotonEliminar;
