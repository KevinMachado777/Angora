import React from 'react';
import "../styles/botones.css";

const BotonCancelar = ({ onClick }) => {
  return (
    <button className="btn-cancelar" onClick={onClick}>
      <i class="bi bi-x-circle"></i> Cancelar
    </button>
  );
};

export default BotonCancelar;
