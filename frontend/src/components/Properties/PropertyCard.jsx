import React from 'react';

const PropertyCard = ({ property, isFavorite, onToggleFavorite }) => {
    return (
        <div className="property-card">
            <h3>{property.address}</h3>
            <p>Area: {property.area} m²</p>
            <p>Rooms: {property.rooms}</p>
            <p>Price: {property.price.toLocaleString()} ₽</p>
            {onToggleFavorite && (
                <button onClick={() => onToggleFavorite(property.id)}>
                    {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </button>
            )}
        </div>
    );
};

export default PropertyCard;