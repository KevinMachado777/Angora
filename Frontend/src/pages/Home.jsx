import React, { useEffect, useState, useRef, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "animate.css";
import "../styles/home.css";

import { AuthContext } from "../context/AuthContext";
import ModalCambiarContrasena from '../components/ModalContrasena'; // Importa el nuevo componente modal

import producto1 from "../assets/images/gallery/producto1.jpg";
import producto2 from "../assets/images/gallery/producto2.jpg";
import producto3 from "../assets/images/gallery/producto3.jpg";
import producto4 from "../assets/images/gallery/producto4.jpg";


const productos = [
  { id: 1, nombre: "Detergente Lavanda", imagen: producto1 },
  { id: 2, nombre: "Detergente Floral", imagen: producto2 },
  { id: 3, nombre: "Detergente Lavaloza", imagen: producto3 },
  { id: 4, nombre: "Detergente Multiusos", imagen: producto4 }
];

const sloganTexto =
  "El aroma que perdura, la limpieza que transforma tu hogar.";

// Hook personalizado para animaciones de scroll
const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("mostrar-scroll");
          observer.unobserve(node);
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
};

const Home = () => {
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  // Extraemos 'user', 'setUser' y 'loading' del AuthContext
  const { user, setUser, loading } = useContext(AuthContext); 
  const [mostrarModalContrasena, setMostrarModalContrasena] = useState(false); // Estado para controlar la visibilidad del modal de contraseña

  const [slogan, setSlogan] = useState("");
  const [hoverTitle, setHoverTitle] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);

  const quienesRef = useScrollAnimation();

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setSlogan(sloganTexto.slice(0, i + 1));
      i++;
      if (i >= sloganTexto.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Nuevo useEffect para manejar la lógica del modal de contraseña y el toast de bienvenida
  useEffect(() => {
    // Si la carga de autenticación ha terminado y el usuario existe
    if (!loading && user) {
      // Si el usuario tiene 'firstLogin' en true, muestra el modal de contraseña
      if (user.primerLogin) {
        setMostrarModalContrasena(true);
      } else {
        setMostrarModalContrasena(false); // Asegúrate de que el modal esté oculto si firstLogin es false
      }

      // Lógica para el toast de bienvenida
      const toastShown = sessionStorage.getItem("bienvenidaMostrada");
      if (!toastShown && user.nombre) {
        setMostrarToast(true);
        sessionStorage.setItem("bienvenidaMostrada", "true");
      }
    }
  }, [user, loading]); // Dependencias: user y loading, para reaccionar cuando cambien

  useEffect(() => {
    if (mostrarToast) {
      const timer = setTimeout(() => setMostrarToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [mostrarToast]);

  const gallery = [...productos, ...productos];

  return (
    <div className="home-wrapper">
      <div className="burbuja"></div>
      <div className="burbuja burbuja2"></div>

      {/* Mensaje flotante de bienvenida */}
      {mostrarToast && (
        <div className="toast-bienvenida">
          <i className="bi bi-person-check-fill me-2"></i>
          <span>
            ¡Hola, <strong>{user.nombre}</strong>! Bienvenido de nuevo.
          </span>
        </div>
      )}

      {/* Modal para cambiar la contraseña, se muestra si mostrarModalContrasena es true y el usuario existe */}
      {user && (
        <ModalCambiarContrasena
          isOpen={mostrarModalContrasena}
          onClose={() => setMostrarModalContrasena(false)} // Función para cerrar el modal
          user={user} // Pasa el objeto usuario a la modal
          setUser={setUser} // Pasa la función setUser para que la modal pueda actualizar el contexto
        />
      )}

      <section className="hero text-center py-5">
        <h1
          className={`titulo-hero ${hoverTitle ? "anim-hover" : ""}`}
          onMouseEnter={() => setHoverTitle(true)}
          onMouseLeave={() => setHoverTitle(false)}
        >
          ¡Bienvenido a Fraganceys!
        </h1>

        <p className="slogan-animado mt-3">
          {slogan}
          <span className="cursor">|</span>
        </p>

        <div className="iconos-ambientales mt-4">
          <i className="bi bi-droplet-half"></i>
          <i className="bi bi-wind"></i>
          <i className="bi bi-stars"></i>
          <i className="bi bi-magic"></i>
        </div>
      </section>

      <section
        className="quienes-glass container text-center my-5 p-4 oculto-scroll"
        ref={quienesRef}
      >
        <h3 className="fw-semibold mb-3">
          <i className="bi bi-info-circle-fill me-2"></i>¿Quiénes somos?
        </h3>
        <p className="fs-5">
          Somos una empresa productora y comercializadora de productos de aseo
          para el hogar, originaria del municipio de Santa Bárbara, Antioquia.
        </p>
      </section>

      <section className="gallery-container my-5">
        <div className="gallery-track">
          {gallery.map((item, i) => (
            <div className="gallery-item position-relative" key={i}>
              <img
                src={item.imagen}
                alt={item.nombre}
                className="img-fluid rounded shadow"
                loading="lazy"
              />
              <div className="overlay-caption">{item.nombre}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
