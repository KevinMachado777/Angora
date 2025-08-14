import React from 'react';
import "../styles/botones.css";

const BotonAceptar = ({ onClick, className = "" }) => {
  return (
    <button
      className={`btn-aceptar ${className}`}
      onClick={onClick}
    >
      <i className="bi bi-check-circle"></i> Aceptar
    </button>
  );
};

export default BotonAceptar;
