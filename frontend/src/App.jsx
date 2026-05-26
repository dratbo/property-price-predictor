import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PropertyList from './components/Properties/PropertyList';
import PropertyDetail from './components/Properties/PropertyDetail';
import AddPropertyForm from './components/Properties/AddPropertyForm';
import FavoritesList from './components/Favorites/FavoritesList';
import PredictForm from './components/Predict/PredictForm';
import PrivateRoute from './components/Auth/PrivateRoute';
import './App.css';

function App() {
    const { isAuthenticated, logout } = useAuth();

    return (
        <BrowserRouter>
            <div className="App">
                <header className="app-header">
                    <h1 className="logo">Мониторинг недвижимости</h1>
                    <nav>
                        <Link to="/properties">Объекты</Link>
                        <Link to="/predict">Прогноз и аналитика</Link>
                        {isAuthenticated && <Link to="/favorites">Избранное</Link>}
                        {isAuthenticated && <Link to="/add-property">Добавить</Link>}
                        {!isAuthenticated && <Link to="/login">Вход</Link>}
                        {!isAuthenticated && <Link to="/register">Регистрация</Link>}
                        {isAuthenticated && (
                            <button type="button" className="btn-nav" onClick={logout}>
                                Выйти
                            </button>
                        )}
                    </nav>
                </header>

                <main className="app-main">
                    <Routes>
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="/properties" element={<PropertyList />} />
                        <Route path="/properties/:id" element={<PropertyDetail />} />
                        <Route path="/predict" element={<PredictForm />} />
                        <Route
                            path="/favorites"
                            element={
                                <PrivateRoute>
                                    <FavoritesList />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/add-property"
                            element={
                                <PrivateRoute>
                                    <AddPropertyForm />
                                </PrivateRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/properties" />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
