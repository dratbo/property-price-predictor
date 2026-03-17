import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PropertyCard from './PropertyCard';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        loadProperties();
        if (isAuthenticated) {
            loadFavorites();
        }
    }, [isAuthenticated]);

    const loadProperties = async () => {
        try {
            const response = await API.get('/properties');
            setProperties(response.data);
        } catch (error) {
            console.error('Failed to load properties', error);
        }
    };

    const loadFavorites = async () => {
        try {
            const response = await API.get('/favorites');
            setFavorites(response.data.map(p => p.id));
        } catch (error) {
            console.error('Failed to load favorites', error);
        }
    };

    const toggleFavorite = async (propertyId) => {
        if (favorites.includes(propertyId)) {
            // Удалить из избранного
            try {
                await API.delete(`/favorites/${propertyId}`);
                setFavorites(favorites.filter(id => id !== propertyId));
            } catch (error) {
                console.error('Failed to remove from favorites', error);
            }
        } else {
            // Добавить в избранное
            try {
                await API.post(`/favorites/${propertyId}`);
                setFavorites([...favorites, propertyId]);
            } catch (error) {
                console.error('Failed to add to favorites', error);
            }
        }
    };

    return (
        <div className="property-list">
            <h2>All Properties</h2>
            <div className="properties-grid">
                {properties.map(property => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={favorites.includes(property.id)}
                        onToggleFavorite={isAuthenticated ? toggleFavorite : null}
                    />
                ))}
            </div>
        </div>
    );
};

export default PropertyList;