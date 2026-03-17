import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PropertyCard from '../Properties/PropertyCard';

const FavoritesList = () => {
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const response = await API.get('/favorites');
            setFavorites(response.data);
        } catch (error) {
            console.error('Failed to load favorites', error);
        }
    };

    const removeFavorite = async (propertyId) => {
        try {
            await API.delete(`/favorites/${propertyId}`);
            setFavorites(favorites.filter(p => p.id !== propertyId));
        } catch (error) {
            console.error('Failed to remove favorite', error);
        }
    };

    return (
        <div className="favorites-list">
            <h2>My Favorites</h2>
            <div className="properties-grid">
                {favorites.map(property => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={true}
                        onToggleFavorite={removeFavorite}
                    />
                ))}
            </div>
        </div>
    );
};

export default FavoritesList;