import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {

    faSignOutAlt,
    faSignInAlt,
    faUserPlus,
    faCaretDown,
    faBars,
    faTimes,
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
        username: string;
        email: string;
        role: string;
        profileImg: string;
        nameStore: string;
    } | null>(null);

    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
    const [userdropdown, setUserDropdown] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
                    username: decoded.username,
                    email: decoded.email,
                    role: decoded.role,
                    nameStore: decoded.nameStore,
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

    const toggleDropdown = (menu: string) => {
        setOpenDropdown(openDropdown === menu ? null : menu);
    };
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
                        <p className="Alert-title-login">กรุณาเข้าสู่ระบบก่อนใช้งานเมนูนี้</p>
                        <button className="Alert-modal-close" onClick={() => setShowLoginAlert(false)}>ปิด</button>
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
                                            <span className="username">{user?.username || user?.name}</span>
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
                                                <FontAwesomeIcon icon={faCog} className="icon settings-icon" /> ตั้งค่าผู้ใช้
                                            </button>
                                            {/* ปุ่มออกจากระบบ */}
                                            <button onClick={handleLogout} className="logout-button">
                                                <FontAwesomeIcon icon={faSignOutAlt} className="icon logout-icon" /> ออกจากระบบ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsLoginModalVisible(true)} className="login-button" name="login">
                                    <FontAwesomeIcon icon={faSignInAlt} className="icon" /> <span>Login</span>
                                </button>
                                <button onClick={() => setIsRegisterModalVisible(true)} className="register-button" name="register">
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
