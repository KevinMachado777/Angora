// src/components/Layout.jsx
import SideBar from './SideBar';
import Header from './Header';
import Footer from './Footer';


const Layout = ({ children }) => {
    return (
        <div className="d-flex flex-column min-vh-100 layout">
            <Header />

            <div className="d-flex flex-grow-1">
                <SideBar />
                <main className="main-content flex-grow-1">
                    {children}
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default Layout;

