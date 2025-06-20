import React from 'react';
import "../styles/botones.css";

const BotonExportar = ({ onClick }) => {
  return (
    <button className="btn-exportar" onClick={onClick}>
      <i class="bi bi-file-earmark-arrow-up"></i> Exportar
    </button>
  );
};

export default BotonExportar;
