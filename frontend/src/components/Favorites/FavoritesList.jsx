import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import PropertyCard from '../Properties/PropertyCard';

const FavoritesList = () => {
    const [favorites, setFavorites] = useState([]);
    const navigate = useNavigate();

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
            setFavorites(favorites.filter((p) => p.id !== propertyId));
        } catch (error) {
            console.error('Failed to remove favorite', error);
        }
    };

    const predictForProperty = (property) => {
        const params = new URLSearchParams();

        if (property?.city) params.set('city', property.city);
        if (property?.area != null) params.set('area', String(property.area));
        if (property?.rooms != null) params.set('rooms', String(property.rooms));

        if (property?.district) params.set('district', property.district);
        if (property?.floor != null) params.set('floor', String(property.floor));
        if (property?.total_floors != null) params.set('total_floors', String(property.total_floors));
        if (property?.building_type) params.set('building_type', property.building_type);
        if (property?.year_built != null) params.set('year_built', String(property.year_built));
        if (property?.developer) params.set('developer', property.developer);
        if (property?.repair_type) params.set('repair_type', property.repair_type);
        if (property?.building_repair_type) params.set('building_repair_type', property.building_repair_type);

        navigate(`/predict?${params.toString()}`);
    };

    return (
        <div className="favorites-list page-container">
            <h2>Избранное</h2>
            <div className="properties-grid">
                {favorites.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={true}
                        onToggleFavorite={removeFavorite}
                        onPredict={predictForProperty}
                    />
                ))}
            </div>
            {favorites.length === 0 && <p>Избранных объектов пока нет.</p>}
        </div>
    );
};

export default FavoritesList;
