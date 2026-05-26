import React from 'react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ property, isFavorite, onToggleFavorite }) => {
    return (
        <div className="property-card">
            <h3>
                <Link to={`/properties/${property.id}`}>{property.address}</Link>
            </h3>
            <p className="property-city">{property.city}{property.district ? `, ${property.district}` : ''}</p>
            <p>Площадь: {property.area} м² · Комнат: {property.rooms}</p>
            <p className="property-price">{Number(property.price).toLocaleString('ru-RU')} ₽</p>
            {onToggleFavorite && (
                <button className="btn-secondary" onClick={() => onToggleFavorite(property.id)}>
                    {isFavorite ? 'Убрать из избранного' : 'В избранное'}
                </button>
            )}
        </div>
    );
};

export default PropertyCard;
