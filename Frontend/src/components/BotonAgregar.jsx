import React from 'react';
import "../styles/botones.css";

const BotonAgregar = ({ onClick }) => {
  return (
    <button className="btn-agregar" onClick={onClick}>
      <i class="bi bi-plus-circle"></i> Agregar
    </button>
  );
};

export default BotonAgregar;
