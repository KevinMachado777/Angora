import React from 'react';
import "../styles/botones.css";

const BotonCancelar = ({ onClick }) => {
  return (
    <button className="btn-cancelar" onClick={onClick}>
      <i className="bi bi-x-circle"></i> Cancelar
    </button>
  );
};

export default BotonCancelar;
