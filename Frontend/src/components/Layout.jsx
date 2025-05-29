import SideBar from './SideBar';
import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <SideBar />
            <div className="main">
                <Header />
                <div className="content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
