import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PropertyList from './components/Properties/PropertyList';
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
          <nav>
            <Link to="/properties">Properties</Link>
            <Link to="/predict">Predict</Link>
            {isAuthenticated && <Link to="/favorites">Favorites</Link>}
            {isAuthenticated && <Link to="/add-property">Add Property</Link>}
            {!isAuthenticated && <Link to="/login">Login</Link>}
            {!isAuthenticated && <Link to="/register">Register</Link>}
            {isAuthenticated && <button onClick={logout}>Logout</button>}
          </nav>

          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/properties" element={<PropertyList />} />
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
        </div>
      </BrowserRouter>
  );
}

export default App;