// src/components/Layout.jsx
import SideBar from './SideBar';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
    return (
        <>
            {/* El Header siempre primero */}
            <Header />

            {/*  Contenedor que agrupe Sidebar + contenido */}
            <div className="content-row">
                <SideBar />
                {children}
            </div>

            {/*Finalmente, el Footer */}
            <Footer />
        </>
    );
};

export default Layout;
