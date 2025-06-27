import "../styles/inventario.css";

export const TablaAbonos = ({ cabeceros= [], registros= []}) => {
    return (
        <table>
            <thead>
                <tr>
                    {cabeceros.map((header, index) => (
                        <th key={index}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {registros.map((registro, filaIndex) => {
                    const valores = Object.values(registro); // desempaquetado por índice
                    return (
                        <tr key={filaIndex}>
                            {valores.map((valor, colIndex) => (
                                <td key={colIndex}>{valor}</td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};