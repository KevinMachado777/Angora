import React, { useState } from "react";
import "../styles/perfil.css";
import logoUser from "../assets/images/Logo_perfil.png";
import { Form } from "react-router-dom";
import productos from "../assets/images/Productos_Perfil.png";

const Perfil = () => {
  const [Editar, setEditar] = useState(true);

  return (
    <main className="main perfil">
      <div>
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

      <div className="tarjeta-perfil">
        <img src={logoUser} width={"250px"} alt="" />
        <h3>Rol</h3>
        <h5>Johan Rios</h5>
        <button onClick={() => setEditar(!Editar)}>Editar pefil</button>
      </div>
    </main>
  );
};

export default Perfil;
