import './App.css'
import { AuthProvider } from './context/AuthContext.jsx';
import AppRoutes from './routes/AppRoutes'
import { useEffect } from 'react';

function App() {
  // Evita el scroll al usar el mouse wheel en inputs de tipo number
  // Esto es útil para evitar que el scroll afecte a los inputs numéricos
  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement.type === "number") {
        e.preventDefault();
      }
    };

    // Agrega el listener global
    document.addEventListener("wheel", handleWheel, { passive: false });

    // Limpia el listener al desmontar
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <AuthProvider>
      <div>
        <AppRoutes/>
      </div>
    </AuthProvider>
  )
}

export default App;