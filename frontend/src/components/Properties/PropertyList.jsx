import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DATA_UPDATE_INFO, RUSSIAN_CITIES } from '../../constants/regions';
import PropertyCard from './PropertyCard';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [cityFilter, setCityFilter] = useState('');
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
            setFavorites(response.data.map((p) => p.id));
        } catch (error) {
            console.error('Failed to load favorites', error);
        }
    };

    const toggleFavorite = async (propertyId) => {
        if (favorites.includes(propertyId)) {
            try {
                await API.delete(`/favorites/${propertyId}`);
                setFavorites(favorites.filter((id) => id !== propertyId));
            } catch (error) {
                console.error('Failed to remove from favorites', error);
            }
        } else {
            try {
                await API.post(`/favorites/${propertyId}`);
                setFavorites([...favorites, propertyId]);
            } catch (error) {
                console.error('Failed to add to favorites', error);
            }
        }
    };

    const cities = [...new Set([...RUSSIAN_CITIES, ...properties.map((p) => p.city)])].sort(
        (a, b) => RUSSIAN_CITIES.indexOf(a) - RUSSIAN_CITIES.indexOf(b) || a.localeCompare(b, 'ru')
    );
    const filtered = cityFilter
        ? properties.filter((p) => p.city === cityFilter)
        : properties;

    return (
        <div className="property-list page-container">
            <h2>Объекты недвижимости</h2>
            <p className="data-update-hint">
                Новые объявления: парсер — каждые {DATA_UPDATE_INFO.parserHours} ч. (26 регионов),
                вручную — после входа в систему.
            </p>
            {cities.length > 0 && (
                <div className="filters">
                    <label>
                        Город:
                        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                            <option value="">Все</option>
                            {cities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
            <div className="properties-grid">
                {filtered.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={favorites.includes(property.id)}
                        onToggleFavorite={isAuthenticated ? toggleFavorite : null}
                    />
                ))}
            </div>
            {filtered.length === 0 && <p>Нет объектов. Запустите парсер или добавьте вручную.</p>}
        </div>
    );
};

export default PropertyList;
