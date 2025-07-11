import React, { useState } from "react"; 
import "../styles/perfil.css";
import logoUser from "../assets/images/Logo_perfil.png"; 
import productos from "../assets/images/Productos_Perfil.png"; 
import BotonGuardar from "../components/BotonGuardar"; 
import BotonCancelar from "../components/BotonCancelar";

const Perfil = () => {
  // Estado que controla si se está editando el perfil o no
  const [Editar, setEditar] = useState(false);
  // Estado que controla si la tarjeta debe girarse o no
  const [Girar, setGirar] = useState(false);

  // Estado que contiene los datos del perfil del usuario
  const [Datos, setDatos] = useState({
    nombre: "Johan",
    apellido: "rios",
    correo: "johan@gmail.com",
    telefono: 3195273030,
    direccion: "santa barbara",
  });

  // Función que se encarga de actualizar el estado Datos cuando cambian los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos((prevDatos) => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  // Función para guardar los cambios y salir del modo edición
  const handleGuardar = () => {
    setEditar(false);
  };

  // Función para cancelar la edición y salir del modo edición (sin guardar)
  const handleCancelar = () => {
    setEditar(false);
  };

  return (
    <main className="main-perfil perfil">
      {/* Contenedor de contenido principal del perfil */}
      <div className="renderizado">
        {Editar ? (
          // Si está en modo edición, muestra el formulario para editar datos
          <div className="formulario">
            <h2>Datos básicos</h2>
            <form>
              <label htmlFor="correo">Correo</label>
              <input
                type="email"
                name="correo"
                id="correo"
                value={Datos.correo}
                onChange={handleChange}
              />

              <label htmlFor="telefono">Teléfono</label>
              <input
                type="number"
                name="telefono"
                id="telefono"
                value={Datos.telefono}
                onChange={handleChange}
              />

              <label htmlFor="direccion">Dirección</label>
              <input
                type="text"
                name="direccion"
                id="direccion"
                value={Datos.direccion}
                onChange={handleChange}
              />
            </form>

            {/* Botones de acción para guardar o cancelar */}
            <div style={{ display: "flex", gap: "20px" }}>
              <BotonGuardar onClick={handleGuardar} />
              <BotonCancelar onClick={handleCancelar} />
            </div>
          </div>
        ) : (
          // Si no está en modo edición, muestra información estática de la empresa
          <div className="informacion">
            <h3>¿Quiénes somos?</h3>
            <img src={productos} width={"350px"} alt="" />
            <p>
              Una empresa productora y comercializadora de productos de aseo
              para el hogar, originaria del municipio de Santa Bárbara, Antioquia.
            </p>
          </div>
        )}
      </div>

      {/* Tarjeta de perfil interactiva */}
      <div className="tarjeta-perfil" onClick={() => setGirar(!Girar)}>
        {/* Se aplica la clase "girado" cuando el estado Girar es true */}
        <div className={`carta-general ${Girar ? "girado" : ""}`}>
          {/* Cara frontal de la tarjeta */}
          <div className="carta-frontal">
            <img src={logoUser} width={"150px"} alt="Perfil" />
            <h3>{Datos.direccion}</h3>
            <h5>
              {Datos.nombre} {Datos.apellido}
            </h5>
          </div>
          {/* Cara trasera de la tarjeta con todos los datos */}
          <div className="carta-trasera">
            <h3>{Datos.nombre}</h3>
            <h3>{Datos.apellido}</h3>
            <h3>{Datos.correo}</h3>
            <h3>{Datos.telefono}</h3>
            <h3>{Datos.direccion}</h3>
          </div>
        </div>

        {/* Botón para activar el modo edición. Se detiene la propagación para que no gire la tarjeta */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evita que el clic afecte la tarjeta
            setEditar(!Editar);  // Alterna entre modo edición y vista normal
          }}
        >
          Editar perfil
        </button>
      </div>
    </main>
  );
};

export default Perfil;
