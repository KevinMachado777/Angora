import React from 'react';
import "../styles/botones.css";

const BotonGuardar = ({ onClick }) => {
  return (
    <button className="btn-guardar" onClick={onClick}>
      <i className="bi bi-floppy"></i> Guardar
    </button>
  );
};

export default BotonGuardar;
