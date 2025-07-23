import React from 'react';
import "../styles/botones.css";

const BotonEditar = ({ onClick }) => {
  return (
    <button type='button' className="btn-modificar" onClick={onClick}>
      <i className="bi bi-pen"></i> Modificar
    </button>
  );
};

export default BotonEditar;
