import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth/auth';
import '../../styles/components/auth/RegisterModal.css';

interface RegisterProps {
    isVisible: boolean;
    onClose: () => void;
}

const RegisterModal: React.FC<RegisterProps> = ({ isVisible, onClose }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    
    const navigate = useNavigate();

    if (!isVisible) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAcceptedTerms(e.target.checked);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptedTerms) {
            setError('You must accept the terms and conditions to register.');
            setSuccessMessage('');
            return;
        }

        setLoading(true);
        try {
            await registerUser(
                formData.email,
                formData.password,
                formData.firstName,
                formData.lastName
            );
            setSuccessMessage('Registration successful! Redirecting to login...');
            setError('');

            setTimeout(() => {
                onClose();
                navigate('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Error registering user. Please try again.');
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };
    const handleClose = () => {
        setIsClosing(true); // เริ่ม animation ออก

        // รอให้ animation จบก่อนค่อยปิด
        setTimeout(() => {
            setIsClosing(false); // reset สำหรับรอบหน้า
            onClose();           // ปิด modal จริง
        }, 300); // ตรงกับเวลาใน animation CSS
    };
    return (
        <div className="register-modal-overlay">
            <div className="register-modal-content">
            <div className={`register-modal ${isClosing ? 'slide-out' : 'slide-in'}`}>
                <button onClick={handleClose} className="register-close-button">×</button>
                <form onSubmit={handleRegister} className="register-form">
                    <h2 className="register-title">Register</h2>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="register-input"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="register-input"
                        required
                    />
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="register-input"
                        required
                    />
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="register-input"
                        required
                    />
                    <div className="register-checkbox-container">
                        <input
                            type="checkbox"
                            id="acceptTerms"
                            checked={acceptedTerms}
                            onChange={handleCheckboxChange}
                        />
                        <label htmlFor="acceptTerms" className="register-label">
                            I accept the terms and conditions
                        </label>
                    </div>
                    <button type="submit" className="register-button" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    {error && <p className="register-error">{error}</p>}
                    {successMessage && <p className="register-success">{successMessage}</p>}
                </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterModal;
