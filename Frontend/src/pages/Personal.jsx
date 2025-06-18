import "../styles/personal.css"
import kevin from "../assets/images/Kevin perfil.jpg"
import samuel from "../assets/images/Samuel perfil.jpg"
import johan from "../assets/images/Johan perfil.jpg"

const Personal = () => {
    // Clic de la tarjeta
    const clicTarjeta = (evento) =>{
        // Obtener el evento dentro de la tarjeta cliqueada
        const tarjeta = evento.currentTarget;
        // Alternar la clase 'girar' para girar o volver a la posicion orginal
        tarjeta.classList.toggle('girar')
    }

    return (
        <main className="main-home">
            <div className="titulo">
                <h1>Personal</h1>
            </div>

            <div className="personal" onClick={clicTarjeta}>
                <div className="card-front">
                    <img src={kevin} alt="imagen_perfil"/>
                    <p>Nombre: Kevin Andrés Machado Rueda</p>
                </div>
                <div className="card-back">
                    <p>Correo: kevinandrésmachadorueda@gmail.com</p>
                    <p>Teléfono: 3196392919</p>
                    <p>Dirección: Urrao - Antioquia</p>
                </div>
            </div>

            <div className="personal" onClick={clicTarjeta}>
                <div className="card-front">
                    <img src={samuel} alt="imagen_perfil"/>
                    <p>Nombre: Samuel Arcangel Rios Rendon</p>
                </div>
                <div className="card-back">
                    <p>Correo: samugamer2394@gmail.com</p>
                    <p>Teléfono: 3004568745</p>
                    <p>Dirección: Tamesis - Antioquia</p>
                </div>
            </div>

            <div className="personal" onClick={clicTarjeta}>
                <div className="card-front">
                    <img src={johan} alt="imagen_perfil"/>
                    <p>Nombre: Johan Esteban Rios Ramirez</p>
                </div>
                <div className="card-back">
                    <p>Correo: johanestebanrios11@gmail.com</p>
                    <p>Teléfono: 3117143533</p>
                    <p>Dirección: Santa Barbara - Antioquia</p>
                </div>
            </div>
        </main>
    )
}

export default Personal