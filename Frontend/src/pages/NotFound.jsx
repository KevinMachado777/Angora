import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Lottie from "react-lottie";
import robotAnimation from "../assets/images/error.json";
import "../styles/notFound.css";

const NotFound = () => {
    const navigate = useNavigate();
    const lastBubbleAt = useRef(0);
    const containerRef = useRef(null);

    // Configuración de la animación Lottie
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: robotAnimation,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    // Efecto para burbujas que siguen el cursor
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const MIN_INTERVAL = 40;

        const createBubble = (x, y) => {
            const rect = container.getBoundingClientRect();
            const relX = x - rect.left;
            const relY = y - rect.top;

            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = `${relX}px`;
            bubble.style.top = `${relY}px`;
            const size = Math.round(Math.random() * 30 + 12);
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.animationDelay = '0s';
            container.appendChild(bubble);
            setTimeout(() => bubble.remove(), 900);
        };

        const handleMouseMove = (e) => {
            const now = Date.now();
            if (now - lastBubbleAt.current < MIN_INTERVAL) return;
            lastBubbleAt.current = now;
            createBubble(e.clientX, e.clientY);
        };

        container.addEventListener('mousemove', handleMouseMove);

        return () => container.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="not-found-container" ref={containerRef}>
            <div className="not-found-particles"></div>
            <div className="not-found-main">
                <div className="not-found-animation" aria-hidden="true">
                    <Lottie options={defaultOptions} height={420} width={420} />
                </div>
                <div className="not-found-copy">
                    <p className="not-found-message">
                        Ups! Parece que trataste de acceder a una ruta no definida en el sistema.
                    </p>
                    <p className="not-found-submessage">
                        No te preocupes — vuelve al inicio y seguimos.
                    </p>
                    <button
                        className="btn not-found-button"
                        onClick={() => navigate("/home", { replace: true })}
                    >
                        Volver al Sistema
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;