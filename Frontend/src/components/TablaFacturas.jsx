import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";

const TablaFacturas = ({
    encabezados = [],
    registros = [],
    onIconClick = () => { },
    iconoClase = "bi bi-eye",
    textoIcono = "Detalles",
}) => {
    return (
        <table className="table table-sm table-bordered">
            <thead>
                <tr>
                    {encabezados.map((encabezado, i) => (
                        <th key={i}>{encabezado}</th>
                    ))}
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {registros.map((registro, i) => (
                    <tr key={i}>
                        {registro.slice(0, -1).map((valor, j) => (
                            <td key={j}>{valor}</td>
                        ))}
                        <td>
                            <i
                                className={iconoClase}
                                title={textoIcono}
                                style={{ cursor: "pointer" }}
                                onClick={() => onIconClick(registro[registro.length - 1]._factura)}
                            ></i>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TablaFacturas;