import React from 'react';
import "../styles/botones.css";

const BotonAceptar = ({ onClick }) => {
  return (
    <button className="btn-ordenes" onClick={onClick}>
      <i class="bi bi-cart"></i> Ordenes de compra
    </button>
  );
};

export default BotonAceptar;