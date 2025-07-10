import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {  loginUser } from "../../api/auth/auth";
import "../../styles/components/auth/LoginPageModal.css";

interface LoginProps {
    isVisible: boolean;
    onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ isVisible, onClose }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    if (!isVisible) return null;

    // ฟังก์ชันจัดการล็อกอินด้วยอีเมลและรหัสผ่าน
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        try {
            const data = await loginUser(email, password);

            localStorage.setItem("token", data.token);
            localStorage.setItem("userEmail", email);

            // เช็ค role และทำการเปลี่ยนเส้นทางตาม role
            if (data.role === "employee") {
                navigate("/employee-dashboard"); // เปลี่ยนเส้นทางไปหน้าพนักงาน
            } else {
                navigate("/"); // ถ้าไม่ใช่พนักงานไปหน้าหลัก
            }

            setSuccessMessage("Login Success!");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err: any) {
            setError(err.message || "Error logging in. Please try again.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="close-button">
                    X
                </button>
                <form onSubmit={handleLogin} className="form">
                    <h1 className="logintitle">Login</h1>
                    <input
                        type="email"
                        name="email"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        required
                    />
                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                        />
                        <label className="label" htmlFor="rememberMe">
                            rememberMe
                        </label>
                    </div>
                    <button type="submit" className="button">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;