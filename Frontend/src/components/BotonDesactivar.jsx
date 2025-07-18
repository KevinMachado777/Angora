import React from 'react';
import "../styles/botones.css";

const BotonDesactivar = ({ onClick }) => {
    return (
        <button className="btn-desactivar" onClick={onClick}>
            <i class="bi bi-slash-circle"></i> Desactivar
        </button>
    );
};

export default BotonDesactivar;
