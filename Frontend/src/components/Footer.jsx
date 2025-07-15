import "../styles/footer.css"
import logotipo from "../assets/images/logotipo.png"

const Footer = () => {
    return (
        <footer>
            <div>
                <img src={logotipo} alt="Logo Kase" width="70" />
                <p>Santa Bárbara, Antioquia - Sector Alto de los Gómez</p>
                <a href="/info-kase">¿Quiénes somos?</a>
            </div>

            <div>
                <h5>Mapa del sitio</h5>
                <a href="/">Inicio</a>
                <a href="/perfil">Perfil</a>
                <a href="/inventario">Inventario</a>
                <a href="/clientes">Portafolio de clientes</a>
                <a href="/proveedores">Proveedores</a>
            </div>

            <div>
                <h5>Soporte</h5>
                <a href="/servicios">Estado de servicios</a>
            </div>

            <div>
                <h5>Contáctanos</h5>
                <a href="mailto:kasedevelopmentgroup@gmail.com">Correo electrónico</a>
                <a href="https://wa.me/3196382919" target="_blank" rel="noreferrer">WhatsApp</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook Messenger</a>
            </div>

            <div className="parte-final">
                © Todos los derechos reservados 2025 Kase
            </div>
        </footer>
    )
}

export default Footer