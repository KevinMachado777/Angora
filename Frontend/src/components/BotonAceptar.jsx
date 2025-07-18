import React from 'react';
import "../styles/botones.css";

const BotonAceptar = ({ onClick }) => {
  return (
    <button className="btn-aceptar" onClick={onClick}>
      <i className="bi bi-check-circle"></i> Aceptar
    </button>
  );
};

export default BotonAceptar;
