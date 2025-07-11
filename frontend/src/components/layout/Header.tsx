import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {

    faSignOutAlt,
    faSignInAlt,
    faUserPlus,
    faCaretDown,
    faCog,


} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import LoginPageModal from "../auth/LoginPageModal";
import RegisterPageModal from "../auth/RegisterPageModal";
import "../../styles/components/layout/Header.css";
interface NavbarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Header: React.FC<NavbarProps> = ({
    isSidebarOpen = false,
    toggleSidebar = () => { },
}) => {
    const [user, setUser] = useState<{
        name: string;
        email: string;
        role: string;
        profileImg: string;
    } | null>(null);

    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
    const [userdropdown, setUserDropdown] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);
    const [showLoginAlert, setShowLoginAlert] = useState(false);

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
                    profileImg: decoded.profile_img || "default-avatar.png",
                });
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
    }, []);


    const handleMenuClick = (path: string, menuName: string) => {
        if (!user) {
            setShowLoginAlert(true);
            return;
        }

        navigate(path);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // ตรวจว่าคลิกอยู่นอก notification dropdown จริงหรือไม่
            if (
                notificationRef.current &&
                !notificationRef.current.contains(target)
            ) 

            if (!target.closest(".user-dropdown")) {
                setUserDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const handleUserSettings = () => {
        navigate("/settingProfile");
    };
    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    return (
        <>
            {showLoginAlert && (
                <div className="Alert-modal-overlay">
                    <div className="Alert-modal">
                        <p className="Alert-title-login">Please Login before use this feature</p>
                        <button className="Alert-modal-close" onClick={() => setShowLoginAlert(false)}>close</button>
                    </div>
                </div>
            )}
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-content">
                    <div className={`iconName ${isSidebarOpen ? "shifted" : "closed"}`}>
                        PORCHOEN 2014 COMPANY LIMITED
                    </div>
                    <div className="nav-right">
                        {user ? (
                            <>
                                <div
                                    className="user-dropdown"
                                    ref={userRef}
                                    onClick={() => {
                                        setUserDropdown(!userdropdown);
                                    }}
                                >
                                    <div className="user-info">
                                        <img src={user.profileImg} alt="User" className="avatar" />
                                        <div className="user-details">
                                            <span className="username">{user?.email || user?.name}</span>
                                            <span className="status-online">🟢 Online</span>
                                        </div>
                                        <FontAwesomeIcon icon={faCaretDown} className="icon caret-icon" />
                                    </div>

                                    {userdropdown && (
                                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                            <p className="user-role">👤 Role: {user.role}</p>
                                            {/* เมนูตั้งค่าผู้ใช้ */}
                                            <button
                                                onClick={() => {
                                                    handleUserSettings();
                                                    handleMenuClick("/settingProfile", "Setting User");
                                                }}
                                                className="settings-button"
                                            >
                                                <FontAwesomeIcon icon={faCog} className="icon settings-icon" /> User Setting
                                            </button>
                                            {/* ปุ่มออกจากระบบ */}
                                            <button onClick={handleLogout} className="logout-button">
                                                <FontAwesomeIcon icon={faSignOutAlt} className="icon logout-icon" /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsLoginModalVisible(true)} className="login-button-header" name="login">
                                    <FontAwesomeIcon icon={faSignInAlt} className="icon" /> <span>Login</span>
                                </button>
                                <button onClick={() => setIsRegisterModalVisible(true)} className="register-button-header" name="register">
                                    <FontAwesomeIcon icon={faUserPlus} className="icon" /> <span>Register</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>


            {/* Login และ Register Modal */}
            <LoginPageModal isVisible={isLoginModalVisible} onClose={() => setIsLoginModalVisible(false)} />
            <RegisterPageModal isVisible={isRegisterModalVisible} onClose={() => setIsRegisterModalVisible(false)} />
        </>
    );
};

export default Header;
