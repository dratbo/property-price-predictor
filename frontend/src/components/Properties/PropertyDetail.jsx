import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const formatPrice = (price) => Number(price).toLocaleString('ru-RU');

const Field = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="detail-row">
            <span className="detail-label">{label}</span>
            <span className="detail-value">{value}</span>
        </div>
    );
};

const PropertyDetail = () => {
    const { id } = useParams();
    const [property, setProperty] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        loadProperty();
    }, [id]);

    const loadProperty = async () => {
        try {
            const response = await API.get(`/properties/${id}`);
            setProperty(response.data);
            if (isAuthenticated) {
                const favRes = await API.get('/favorites');
                setIsFavorite(favRes.data.some((p) => p.id === response.data.id));
            }
        } catch {
            setError('Объект не найден');
        }
    };

    const toggleFavorite = async () => {
        if (!property) return;
        try {
            if (isFavorite) {
                await API.delete(`/favorites/${property.id}`);
                setIsFavorite(false);
            } else {
                await API.post(`/favorites/${property.id}`);
                setIsFavorite(true);
            }
        } catch {
            setError('Не удалось обновить избранное');
        }
    };

    if (error) return <p className="error">{error}</p>;
    if (!property) return <p>Загрузка...</p>;

    return (
        <div className="property-detail page-container">
            <Link to="/properties" className="back-link">← К списку</Link>
            <h2>{property.address}</h2>
            <p className="price-highlight">{formatPrice(property.price)} ₽</p>

            <div className="detail-grid">
                <Field label="Город" value={property.city} />
                <Field label="Район" value={property.district} />
                <Field label="Метро" value={property.metro} />
                <Field label="Площадь" value={`${property.area} м²`} />
                <Field label="Комнат" value={property.rooms} />
                <Field label="Этаж" value={property.floor} />
                <Field label="Этажей в доме" value={property.total_floors} />
                <Field label="Тип дома" value={property.building_type} />
                <Field label="Год постройки" value={property.year_built} />
                <Field label="Застройщик" value={property.developer} />
                <Field label="Ремонт квартиры" value={property.repair_type} />
                <Field label="Ремонт дома" value={property.building_repair_type} />
            </div>

            {property.source_url && (
                <a href={property.source_url} target="_blank" rel="noreferrer" className="source-link">
                    Открыть объявление
                </a>
            )}

            {isAuthenticated && (
                <button className="btn-primary" onClick={toggleFavorite}>
                    {isFavorite ? 'Убрать из избранного' : 'В избранное'}
                </button>
            )}
        </div>
    );
};

export default PropertyDetail;
