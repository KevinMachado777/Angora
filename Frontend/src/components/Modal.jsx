import '../styles/modal.css';

// Componente reutilizable para modales
const Modal = ({ isOpen, onClose, children }) => {
    // Si isOpen es falso, no renderiza nada
    if (!isOpen) return null;

    return (
        // Fondo oscuro al fondo del modal, cierra el modal al hacer clic fuera
        <div className="modal-fondo">

            {/* Contenedor del contenido del modal, el onClick 
            evita que se cierre la ventana al dar click en ella */}
            <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>

                {/* Contenido hijo para mostrar diferente contenido en la modal*/}
                {children}
            </div>
        </div>
    );
};

export default Modal;