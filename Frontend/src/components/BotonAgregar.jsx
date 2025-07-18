import React from 'react';
import "../styles/botones.css";

const BotonAgregar = ({ onClick }) => {
  return (
    <button className="btn-agregar" onClick={onClick}>
      <i className="bi bi-plus-circle"></i> Agregar
    </button>
  );
};

export default BotonAgregar;
