import React from 'react';
import "../styles/botones.css";

const BotonDetalles = ({ onClick }) => {
  return (
    <button className="btn-detalles" onClick={onClick}>
      <i className="bi bi-info-circle"></i> Cartera
    </button>
  );
};

export default BotonDetalles;
