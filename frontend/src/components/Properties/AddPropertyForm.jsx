import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { RUSSIAN_CITIES } from '../../constants/regions';

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
        price: '',
        source_url: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const optional = (value) => (value === '' ? undefined : value);
    const optionalInt = (value) => (value === '' ? undefined : parseInt(value, 10));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/properties', {
                address: form.address,
                city: form.city,
                district: optional(form.district),
                metro: optional(form.metro),
                area: parseFloat(form.area),
                rooms: parseInt(form.rooms, 10),
                floor: optionalInt(form.floor),
                total_floors: optionalInt(form.total_floors),
                building_type: optional(form.building_type),
                year_built: optionalInt(form.year_built),
                developer: optional(form.developer),
                repair_type: optional(form.repair_type),
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
                    <select value={form.city} onChange={update('city')} required>
                        {RUSSIAN_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>
                <label>Район<input value={form.district} onChange={update('district')} /></label>
                <label>Метро<input value={form.metro} onChange={update('metro')} /></label>
                <label>Площадь (м²) *<input type="number" step="0.1" value={form.area} onChange={update('area')} required /></label>
                <label>Комнат *<input type="number" value={form.rooms} onChange={update('rooms')} required /></label>
                <label>Этаж<input type="number" value={form.floor} onChange={update('floor')} /></label>
                <label>Этажей в доме<input type="number" value={form.total_floors} onChange={update('total_floors')} /></label>
                <label>Тип дома<input value={form.building_type} onChange={update('building_type')} placeholder="кирпичный" /></label>
                <label>Год постройки<input type="number" value={form.year_built} onChange={update('year_built')} /></label>
                <label>Застройщик<input value={form.developer} onChange={update('developer')} /></label>
                <label>Ремонт<input value={form.repair_type} onChange={update('repair_type')} placeholder="евроремонт" /></label>
                <label>Цена (₽) *<input type="number" step="1000" value={form.price} onChange={update('price')} required /></label>
                <label>Ссылка на объявление<input value={form.source_url} onChange={update('source_url')} /></label>
                <button type="submit" className="btn-primary">Сохранить</button>
            </form>
        </div>
    );
};

export default AddPropertyForm;
