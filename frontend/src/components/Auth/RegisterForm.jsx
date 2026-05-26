import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(email, password);
        if (result.success) {
            navigate('/login');
        } else {
            setError(typeof result.error === 'string' ? result.error : 'Ошибка регистрации');
        }
    };

    return (
        <div className="auth-form page-container">
            <h2>Регистрация</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>
                    Пароль
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                <button type="submit" className="btn-primary">Зарегистрироваться</button>
            </form>
        </div>
    );
};

export default RegisterForm;
