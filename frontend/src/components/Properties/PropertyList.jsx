import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DATA_UPDATE_INFO, RUSSIAN_CITIES } from '../../constants/regions';
import {
    APARTMENT_TYPES,
    applyHousingTypeRules,
    isStudioRoomsLocked,
    optionalChoice,
    resetCityFilterFields,
} from '../../constants/propertyOptions';
import HousingTypeSelect from '../common/HousingTypeSelect';
import { useCityFilters } from '../../hooks/useCityFilters';
import FilterSelect from '../common/FilterSelect';
import {
    MAX_FLOOR,
    MAX_TOTAL_FLOORS,
    MIN_FLOOR,
    MIN_TOTAL_FLOORS,
    parseOptionalFloor,
} from '../../utils/validateFloors';
import {
    MAX_YEAR_BUILT,
    MIN_YEAR_BUILT,
    parseOptionalYear,
} from '../../utils/validateYear';
import PropertyCard from './PropertyCard';

const PAGE_SIZE = 20;
const FAVORITE_FILTER_KEY = 'favoritePropertyFilters';

const INITIAL_FILTERS = {
    city: '',
    area: '',
    rooms: '',
    housing_type: '',
    apartment_type: '',
    district: '',
    floor: '',
    total_floors: '',
    building_type: '',
    year_built: '',
    developer: '',
    repair_type: '',
    building_repair_type: '',
};

function buildListParams(form, page) {
    const params = { page, limit: PAGE_SIZE };
    if (form.city) {
        params.city = form.city;
    }
    if (form.area !== '') {
        params.area = parseFloat(form.area);
    }
    if (form.rooms !== '') {
        params.rooms = parseInt(form.rooms, 10);
    }
    const housingType = optionalChoice(form.housing_type);
    if (housingType) {
        params.housing_type = housingType;
    }
    const apartmentType = optionalChoice(form.apartment_type);
    if (apartmentType) {
        params.apartment_type = apartmentType;
    }
    const district = optionalChoice(form.district);
    if (district) {
        params.district = district;
    }
    const floor = parseOptionalFloor(form.floor);
    if (floor !== undefined) {
        params.floor = floor;
    }
    const totalFloors = parseOptionalFloor(form.total_floors);
    if (totalFloors !== undefined) {
        params.total_floors = totalFloors;
    }
    const buildingType = optionalChoice(form.building_type);
    if (buildingType) {
        params.building_type = buildingType;
    }
    const yearBuilt = parseOptionalYear(form.year_built);
    if (yearBuilt !== undefined) {
        params.year_built = yearBuilt;
    }
    const developer = optionalChoice(form.developer);
    if (developer) {
        params.developer = developer;
    }
    const repairType = optionalChoice(form.repair_type);
    if (repairType) {
        params.repair_type = repairType;
    }
    const buildingRepairType = optionalChoice(form.building_repair_type);
    if (buildingRepairType) {
        params.building_repair_type = buildingRepairType;
    }
    return params;
}

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [form, setForm] = useState(INITIAL_FILTERS);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [watchSaved, setWatchSaved] = useState(false);
    const { isAuthenticated } = useAuth();
    const { filters, loading: filtersLoading } = useCityFilters(form.city);

    useEffect(() => {
        if (isAuthenticated) {
            loadFavorites();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        setWatchSaved(Boolean(localStorage.getItem(FAVORITE_FILTER_KEY)));
    }, []);

    useEffect(() => {
        loadProperties();
    }, [
        page,
        form.city,
        form.area,
        form.rooms,
        form.housing_type,
        form.apartment_type,
        form.district,
        form.floor,
        form.total_floors,
        form.building_type,
        form.year_built,
        form.developer,
        form.repair_type,
        form.building_repair_type,
    ]);

    const loadProperties = async () => {
        setLoading(true);
        try {
            const response = await API.get('/properties', {
                params: buildListParams(form, page),
            });
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

    const update = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setPage(1);
    };

    const handleCityChange = (e) => {
        setForm(resetCityFilterFields(form, e.target.value));
        setPage(1);
    };

    const handleHousingTypeChange = (housingType) => {
        setForm(applyHousingTypeRules({ ...form, housing_type: housingType }, housingType));
        setPage(1);
    };

    const resetFilters = () => {
        setForm(INITIAL_FILTERS);
        setPage(1);
    };

    const saveFavoriteCharacteristics = () => {
        const params = buildListParams(form, 1);
        delete params.page;
        delete params.limit;
        localStorage.setItem(
            FAVORITE_FILTER_KEY,
            JSON.stringify({
                ...params,
                saved_at: new Date().toISOString(),
                last_checked_at: new Date().toISOString(),
                seen_ids: [],
            })
        );
        setWatchSaved(true);
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

    const hasActiveFilters =
        form.city !== '' ||
        form.area !== '' ||
        form.rooms !== '' ||
        form.apartment_type !== '' ||
        form.district !== '' ||
        form.floor !== '' ||
        form.total_floors !== '' ||
        form.building_type !== '' ||
        form.year_built !== '' ||
        form.developer !== '' ||
        form.repair_type !== '' ||
        form.building_repair_type !== '';

    return (
        <div className="property-list page-container">
            <h2>Объекты недвижимости</h2>
            <p className="data-update-hint">
                Новые объявления: парсер — каждые {DATA_UPDATE_INFO.parserHours} ч. (26 регионов),
                вручную — после входа в систему.
            </p>
            <div className="filters form-grid">
                <label>
                    Город
                    <select value={form.city} onChange={handleCityChange}>
                        <option value="">Все</option>
                        {RUSSIAN_CITIES.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Площадь (м²)
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.area}
                        onChange={update('area')}
                        placeholder="любая"
                    />
                </label>
                <label>
                    Комнат
                    <input
                        type="number"
                        min="1"
                        max={isStudioRoomsLocked(form.housing_type) ? 1 : undefined}
                        value={form.rooms}
                        onChange={update('rooms')}
                        disabled={isStudioRoomsLocked(form.housing_type)}
                        placeholder={isStudioRoomsLocked(form.housing_type) ? '1' : 'любое'}
                    />
                </label>
                <HousingTypeSelect
                    value={form.housing_type}
                    onChange={handleHousingTypeChange}
                    allowAny
                />
                <FilterSelect
                    label="Тип квартиры"
                    value={form.apartment_type}
                    onChange={update('apartment_type')}
                    options={APARTMENT_TYPES}
                />
                <FilterSelect
                    label="Округ"
                    value={form.district}
                    onChange={update('district')}
                    options={filters.districts}
                    loading={filtersLoading}
                />
                <label>
                    Этаж
                    <input
                        type="number"
                        min={MIN_FLOOR}
                        max={MAX_FLOOR}
                        value={form.floor}
                        onChange={update('floor')}
                        placeholder={`${MIN_FLOOR}–${MAX_FLOOR}`}
                    />
                </label>
                <label>
                    Этажей в доме
                    <input
                        type="number"
                        min={MIN_TOTAL_FLOORS}
                        max={MAX_TOTAL_FLOORS}
                        value={form.total_floors}
                        onChange={update('total_floors')}
                        placeholder={`${MIN_TOTAL_FLOORS}–${MAX_TOTAL_FLOORS}`}
                    />
                </label>
                <FilterSelect
                    label="Тип дома"
                    value={form.building_type}
                    onChange={update('building_type')}
                    options={filters.building_types}
                    loading={filtersLoading}
                />
                <label>
                    Год постройки
                    <input
                        type="number"
                        min={MIN_YEAR_BUILT}
                        max={MAX_YEAR_BUILT}
                        value={form.year_built}
                        onChange={update('year_built')}
                        placeholder={`${MIN_YEAR_BUILT}–${MAX_YEAR_BUILT}`}
                    />
                </label>
                <FilterSelect
                    label="Застройщик"
                    value={form.developer}
                    onChange={update('developer')}
                    options={filters.developers}
                    loading={filtersLoading}
                />
                <FilterSelect
                    label="Ремонт квартиры"
                    value={form.repair_type}
                    onChange={update('repair_type')}
                    options={filters.repair_types}
                    loading={filtersLoading}
                />
                <FilterSelect
                    label="Ремонт дома"
                    value={form.building_repair_type}
                    onChange={update('building_repair_type')}
                    options={filters.building_repair_types}
                    loading={filtersLoading}
                />
                {isAuthenticated && hasActiveFilters && (
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={saveFavoriteCharacteristics}
                    >
                        Сохранить избранные характеристики
                    </button>
                )}
                {hasActiveFilters && (
                    <button type="button" className="btn-secondary" onClick={resetFilters}>
                        Сбросить фильтры
                    </button>
                )}
            </div>
            {isAuthenticated && watchSaved && (
                <p className="data-update-hint">
                    Избранные характеристики сохранены. Колокольчик в шапке сообщит о новых совпадениях
                    после обновления базы парсером.
                </p>
            )}

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
                        <p>
                            {hasActiveFilters
                                ? 'Нет объектов по выбранным фильтрам. Измените условия или сбросьте фильтры.'
                                : 'Нет объектов. Запустите парсер или добавьте вручную.'}
                        </p>
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
                                            {showEllipsis && (
                                                <span className="pagination-ellipsis">…</span>
                                            )}
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
