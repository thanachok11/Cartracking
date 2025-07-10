// RegisterModal.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth/auth'; // Import ฟังก์ชัน API
import '../../styles/components/auth/RegisterModal.css';

interface RegisterProps {
    isVisible: boolean;
    onClose: () => void;
}

const RegisterModal: React.FC<RegisterProps> = ({ isVisible, onClose }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        firstName: '',
        lastName: '',
        nameStore: '',
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
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

        try {
            const data = await registerUser(formData.email, formData.password, formData.username, formData.firstName, formData.lastName, formData.nameStore);
            setSuccessMessage('Registration successful! Redirecting to login...');
            setError('');

            setTimeout(() => {
                onClose();
                navigate('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Error registering user. Please try again.');
            setSuccessMessage('');
        }
    };

    return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button onClick={onClose} className="close-button">X</button>
                    <form onSubmit={handleRegister} className="form">
                        <h1 className="title-register">Register</h1>
                        <input
                            type="email"
                            name="email"
                            placeholder="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                        <input
                            type="text"
                            name="firstName"
                            placeholder="first name"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="last name"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                checked={acceptedTerms}
                                onChange={handleCheckboxChange}
                            />
                            <label className="label" htmlFor="acceptTerms">
                                I accept the terms and conditions
                            </label>
                        </div>
                        <button type="submit" className="button">Register</button>
                    </form>
                </div>
            </div>
    );
};

export default RegisterModal;