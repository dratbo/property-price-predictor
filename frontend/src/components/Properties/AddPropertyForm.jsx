import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { RUSSIAN_CITIES } from '../../constants/regions';
import { optionalChoice, resetCityFilterFields } from '../../constants/propertyOptions';
import { useCityFilters } from '../../hooks/useCityFilters';
import FilterSelect from '../common/FilterSelect';
import {
    MAX_FLOOR,
    MAX_TOTAL_FLOORS,
    MIN_FLOOR,
    MIN_TOTAL_FLOORS,
    parseOptionalFloor,
    validateFloors,
} from '../../utils/validateFloors';
import {
    MAX_YEAR_BUILT,
    MIN_YEAR_BUILT,
    parseOptionalYear,
    validateYearBuilt,
} from '../../utils/validateYear';

const AddPropertyForm = () => {
    const [form, setForm] = useState({
        address: '',
        city: 'Москва',
        district: '',
        metro: '',
        area: '',
        rooms: '',
        floor: '',
        total_floors: '',
        building_type: '',
        year_built: '',
        developer: '',
        repair_type: '',
        building_repair_type: '',
        price: '',
        source_url: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { filters, loading: filtersLoading } = useCityFilters(form.city);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const optional = (value) => (value === '' ? undefined : value);
    const optionalInt = (value) => (value === '' ? undefined : parseInt(value, 10));

    const handleCityChange = (e) => {
        setForm(resetCityFilterFields(form, e.target.value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const floorError = validateFloors(form.floor, form.total_floors);
        const yearError = validateYearBuilt(form.year_built);
        if (floorError || yearError) {
            setError(floorError || yearError);
            return;
        }
        try {
            await API.post('/properties', {
                address: form.address,
                city: form.city,
                district: optionalChoice(form.district),
                metro: optional(form.metro),
                area: parseFloat(form.area),
                rooms: parseInt(form.rooms, 10),
                floor: parseOptionalFloor(form.floor),
                total_floors: parseOptionalFloor(form.total_floors),
                building_type: optionalChoice(form.building_type),
                year_built: parseOptionalYear(form.year_built),
                developer: optionalChoice(form.developer),
                repair_type: optionalChoice(form.repair_type),
                building_repair_type: optionalChoice(form.building_repair_type),
                price: parseFloat(form.price),
                source_url: optional(form.source_url),
            });
            navigate('/properties');
        } catch {
            setError('Не удалось добавить объект');
        }
    };

    return (
        <div className="page-container">
            <h2>Добавить объект</h2>
            {error && <p className="error">{error}</p>}
            <form className="form-grid" onSubmit={handleSubmit}>
                <label>Адрес *<input value={form.address} onChange={update('address')} required /></label>
                <label>
                    Город *
                    <select value={form.city} onChange={handleCityChange} required>
                        {RUSSIAN_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>
                <FilterSelect
                    label="Район"
                    value={form.district}
                    onChange={update('district')}
                    options={filters.districts}
                    loading={filtersLoading}
                />
                <label>Метро<input value={form.metro} onChange={update('metro')} /></label>
                <label>Площадь (м²) *<input type="number" step="0.1" value={form.area} onChange={update('area')} required /></label>
                <label>Комнат *<input type="number" value={form.rooms} onChange={update('rooms')} required /></label>
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
                <label>Цена (₽) *<input type="number" step="1000" value={form.price} onChange={update('price')} required /></label>
                <label>Ссылка на объявление<input value={form.source_url} onChange={update('source_url')} /></label>
                <button type="submit" className="btn-primary">Сохранить</button>
            </form>
        </div>
    );
};

export default AddPropertyForm;
