import React from 'react';
import "../styles/botones.css";

const BotonCartera = ({ onClick }) => {
  return (
    <button className="btn-cartera" onClick={onClick}>
      <i className="bi bi-cash-coin"></i> Cartera
    </button>
  );
};

export default BotonCartera;
