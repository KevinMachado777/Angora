import React, { useState } from "react";
import "../styles/perfil.css";
import logoUser from "../assets/images/Logo_perfil.png";
import { Form } from "react-router-dom";
import productos from "../assets/images/Productos_Perfil.png";

const Perfil = () => {
  const [Editar, setEditar] = useState(false);
  const [Girar, setGirar] = useState(false);

  return (
    <main className="main perfil">
      <div className="renderizado">
        {Editar ? (
          <div className="formulario">
            <h2>Datos básicos</h2>
            <form action="">
              <label htmlFor="correo">Correo</label>
              <input type="email" name="correo" id="correo" />
              <label htmlFor="telefono">Teléfono</label>
              <input type="number" name="telefono" id="telefono" />
              <label htmlFor="direccion">Dirección</label>
              <input type="text" name="direccion" id="direccion" />
            </form>
            <div>
              <button>Guardar</button>
              <button>Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="informacion">
            <h3>¿Quiénes somos?</h3>
            <img src={productos} width={"350px"} alt="" />
            <p>
              Una empresa productora y comercializadora de producto de aseo para
              el hogar, originaría del municipio de Santa Bárbara, Antioquia
            </p>
          </div>
        )}
      </div>

      <div className="tarjeta-perfil" onClick={() => setGirar(!Girar)}>
        <div className={`carta-general ${Girar ? 'girado' : ''}`} >
          <div className="carta-frontal">
            <img src={logoUser} width={"150px"} alt="" />
            <h3>Rol</h3>
            <h5>Johan Rios</h5>
           
          </div>
          <div className="carta-trasera">
            <h3>Nombre</h3>
            <h3>Apellidos</h3>
            <h3>Correo</h3>
            <h3>Telefono</h3>
            <h3>Direccion</h3>
          </div>
        </div>
         <button onClick={(e) => {e.stopPropagation(); setEditar(!Editar)}}>Editar perfil</button>
      </div>
    </main>
  );
};

export default Perfil;