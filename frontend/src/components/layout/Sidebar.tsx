import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHome,
    faMapMarkedAlt,
    faCar,
    faSignOutAlt,
    faCog,
    faCaretDown,
    faBars,
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../../styles/components/layout/Sidebar.css";

interface SidebarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const [user, setUser] = useState<{
        name: string;
        email: string;
        role: string;
        profileImg: string;
    } | null>(null);

    const [userDropdown, setUserDropdown] = useState(false);
    const userRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUser({
                    name: decoded.name,
                    email: decoded.email,
                    role: decoded.role,
                    profileImg: decoded.profile_img || "default-avatar.png"
                });
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");

        // ✅ รีเฟรชหน้าใหม่
        setTimeout(() => {
            window.location.reload();
        }, 1000); // รอให้ navigate ทำงานก่อนเล็กน้อย
    };


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (userRef.current && !userRef.current.contains(target)) {
                setUserDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <aside className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
            {/* Toggle Button */}
            <div className="sidebar-toggle" onClick={toggleSidebar}>
                <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} />
            </div>

            <div className="sidebar-title">
                🚗 {isSidebarOpen && "Car Tracking"}
            </div>

            <nav className="sidebar-menu">
                <button onClick={() => navigate("/")}>
                    <FontAwesomeIcon icon={faHome} /> {isSidebarOpen && <span>Home</span>}
                </button>
                <button onClick={() => navigate("/map")}>
                    <FontAwesomeIcon icon={faMapMarkedAlt} /> {isSidebarOpen && <span>Map</span>}
                </button>
                <button onClick={() => navigate("/vehicle/123/view")}>
                    <FontAwesomeIcon icon={faCar} /> {isSidebarOpen && <span>Vehicle</span>}
                </button>
            </nav>

            {/* ✅ User Info */}
            {user && (
                <div className="sidebar-user" ref={userRef}>
                    <div
                        className="user-summary"
                        onClick={() => setUserDropdown(!userDropdown)}
                    >
                        <img src={user.profileImg} alt="avatar" className="avatar" />
                        {isSidebarOpen && (
                            <>
                                <div className="user-details">
                                    <span className="username">{user.email}</span>
                                    <span className="role">🟢 {user.role}</span>
                                </div>
                                <FontAwesomeIcon icon={faCaretDown} className="caret-icon" />
                            </>
                        )}
                    </div>

                    {userDropdown && isSidebarOpen && (
                        <div className="user-dropdown-menu">
                            <button onClick={() => navigate("/settingProfile")}>
                                <FontAwesomeIcon icon={faCog} /> Settings
                            </button>
                            <button onClick={handleLogout}>
                                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
