import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DATA_UPDATE_INFO, RUSSIAN_CITIES } from '../../constants/regions';
import PropertyCard from './PropertyCard';

const PAGE_SIZE = 20;

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [cityFilter, setCityFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            loadFavorites();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        loadProperties();
    }, [page, cityFilter]);

    const loadProperties = async () => {
        setLoading(true);
        try {
            const params = { page, limit: PAGE_SIZE };
            if (cityFilter) {
                params.city = cityFilter;
            }
            const response = await API.get('/properties', { params });
            const data = response.data;
            setProperties(data.items ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.total_pages ?? 0);
        } catch (error) {
            console.error('Failed to load properties', error);
        } finally {
            setLoading(false);
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

    const handleCityChange = (e) => {
        setCityFilter(e.target.value);
        setPage(1);
    };

    const goToPage = (nextPage) => {
        if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
            return;
        }
        setPage(nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const pageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = new Set([1, totalPages, page, page - 1, page + 1]);
        return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    };

    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="property-list page-container">
            <h2>Объекты недвижимости</h2>
            <p className="data-update-hint">
                Новые объявления: парсер — каждые {DATA_UPDATE_INFO.parserHours} ч. (26 регионов),
                вручную — после входа в систему.
            </p>
            <div className="filters">
                <label>
                    Город:
                    <select value={cityFilter} onChange={handleCityChange}>
                        <option value="">Все</option>
                        {RUSSIAN_CITIES.map((city) => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </label>
            </div>

            {loading ? (
                <p className="loading-hint">Загрузка...</p>
            ) : (
                <>
                    <div className="properties-grid">
                        {properties.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                isFavorite={favorites.includes(property.id)}
                                onToggleFavorite={isAuthenticated ? toggleFavorite : null}
                            />
                        ))}
                    </div>
                    {properties.length === 0 && (
                        <p>Нет объектов. Запустите парсер или добавьте вручную.</p>
                    )}
                    {totalPages > 1 && (
                        <nav className="pagination" aria-label="Навигация по страницам">
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={() => goToPage(page - 1)}
                                disabled={page <= 1}
                            >
                                ← Назад
                            </button>
                            <div className="pagination-pages">
                                {pageNumbers().map((num, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    const showEllipsis = prev !== undefined && num - prev > 1;
                                    return (
                                        <React.Fragment key={num}>
                                            {showEllipsis && <span className="pagination-ellipsis">…</span>}
                                            <button
                                                type="button"
                                                className={`pagination-btn${num === page ? ' active' : ''}`}
                                                onClick={() => goToPage(num)}
                                                aria-current={num === page ? 'page' : undefined}
                                            >
                                                {num}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={() => goToPage(page + 1)}
                                disabled={page >= totalPages}
                            >
                                Вперёд →
                            </button>
                        </nav>
                    )}
                    {total > 0 && (
                        <p className="pagination-info">
                            Показано {from}–{to} из {total}
                            {totalPages > 1 && ` · страница ${page} из ${totalPages}`}
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export default PropertyList;
