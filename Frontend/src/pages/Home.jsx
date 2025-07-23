import React, { useEffect, useState, useRef, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "animate.css";
import "../styles/Home.css";

import { AuthContext } from "../context/AuthContext";

import producto1 from "../assets/images/galeria/producto1.jpg";
import producto2 from "../assets/images/galeria/producto2.jpg";
import producto3 from "../assets/images/galeria/producto3.jpg";
import producto4 from "../assets/images/galeria/producto4.jpg";
import producto5 from "../assets/images/galeria/producto5.jpg";


const productos = [
  { id: 1, nombre: "Detergente Floral", imagen: producto1 },
  { id: 2, nombre: "Desinfectante Limón", imagen: producto2 },
  { id: 3, nombre: "Suavizante Bebé", imagen: producto3 },
  { id: 4, nombre: "Multiusos Lavanda", imagen: producto4 },
  { id: 5, nombre: "Limpiador Pino", imagen: producto5 },
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

  const { user } = useContext(AuthContext);

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

  useEffect(() => {
  const toastShown = sessionStorage.getItem("bienvenidaMostrada");
  if (!toastShown && user?.nombre) {
    setMostrarToast(true); // ✅ Este es el estado correcto
    sessionStorage.setItem("bienvenidaMostrada", "true");
  }
}, [user]);
useEffect(() => {
  if (mostrarToast) {
    const timer = setTimeout(() => setMostrarToast(false), 5000);
    return () => clearTimeout(timer);
  }
}, [mostrarToast]);



  const galeria = [...productos, ...productos];

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
          {galeria.map((item, i) => (
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
