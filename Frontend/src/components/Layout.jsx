
import { useState } from 'react';
import SideBar from './SideBar';
import Header from './Header';
import Footer from './Footer';
import '../styles/layout.css';

const Layout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="layout">
            <Header onToggleSidebar={toggleSidebar} />
            <SideBar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`layout-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="page-content">
                    <div className="content-wrapper">
                        {children}
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default Layout;