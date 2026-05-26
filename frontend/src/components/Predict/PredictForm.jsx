import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { DATA_UPDATE_INFO, RUSSIAN_CITIES } from '../../constants/regions';
import PredictDashboard from './PredictDashboard';

const PredictForm = () => {
    const [form, setForm] = useState({
        area: '50',
        rooms: '2',
        city: 'Москва',
        district: '',
        floor: '',
        total_floors: '',
        building_type: '',
        year_built: '',
        developer: '',
        repair_type: '',
    });
    const [result, setResult] = useState(null);
    const [cityStats, setCityStats] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mlStatus, setMlStatus] = useState(null);

    useEffect(() => {
        loadAnalytics();
        checkML();
    }, []);

    const loadAnalytics = async () => {
        try {
            const res = await API.get('/analytics/cities');
            setCityStats(res.data || []);
        } catch {
            setCityStats([]);
        }
    };

    const checkML = async () => {
        try {
            const res = await API.get('/health/ml');
            setMlStatus(res.data?.status === 'ok' ? 'ok' : 'err');
        } catch {
            setMlStatus('err');
        }
    };

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const optional = (value) => (value === '' ? undefined : value);
    const optionalInt = (value) => (value === '' ? undefined : parseInt(value, 10));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await API.post('/predict', {
                area: parseFloat(form.area),
                rooms: parseInt(form.rooms, 10),
                city: form.city,
                district: optional(form.district),
                floor: optionalInt(form.floor),
                total_floors: optionalInt(form.total_floors),
                building_type: optional(form.building_type),
                year_built: optionalInt(form.year_built),
                developer: optional(form.developer),
                repair_type: optional(form.repair_type),
            });
            setResult(response.data);
            setMlStatus('ok');
        } catch (err) {
            const detail =
                err.response?.data?.detail ||
                err.response?.data ||
                'Сервис прогноза недоступен. Запустите: docker compose up --build';
            setError(
                typeof detail === 'string'
                    ? detail
                    : 'Ошибка прогноза. Убедитесь, что запущены go-backend и ml-service (docker compose up).'
            );
            setMlStatus('err');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container predict-layout">
            <h2>Прогноз цен по регионам России</h2>
            <p className="subtitle">
                ML-модель оценивает стоимость квартиры и показывает ожидаемую динамику цен в выбранном регионе
            </p>
            <p className="data-update-hint">
                Данные обновляются: парсер — раз в {DATA_UPDATE_INFO.parserHours} ч.,
                ML переобучается каждые {DATA_UPDATE_INFO.mlRetrainEvery} новых объектов;
                {DATA_UPDATE_INFO.manual}.
            </p>

            {mlStatus === 'ok' && (
                <span className="ml-status ok">ML-сервис подключён</span>
            )}
            {mlStatus === 'err' && (
                <span className="ml-status err">
                    ML-сервис недоступен — перезапустите Docker: docker compose up --build
                </span>
            )}

            <form className="form-grid" onSubmit={handleSubmit}>
                <label>
                    Город (регион) *
                    <select value={form.city} onChange={update('city')} required>
                        {RUSSIAN_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Площадь (м²) *
                    <input type="number" step="0.1" value={form.area} onChange={update('area')} required />
                </label>
                <label>
                    Комнат *
                    <input type="number" min="1" value={form.rooms} onChange={update('rooms')} required />
                </label>
                <label>Район<input value={form.district} onChange={update('district')} /></label>
                <label>Этаж<input type="number" value={form.floor} onChange={update('floor')} /></label>
                <label>Этажей в доме<input type="number" value={form.total_floors} onChange={update('total_floors')} /></label>
                <label>Тип дома<input value={form.building_type} onChange={update('building_type')} placeholder="кирпичный" /></label>
                <label>Год постройки<input type="number" value={form.year_built} onChange={update('year_built')} /></label>
                <label>Застройщик<input value={form.developer} onChange={update('developer')} /></label>
                <label>Ремонт<input value={form.repair_type} onChange={update('repair_type')} placeholder="евроремонт" /></label>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Расчёт…' : 'Рассчитать прогноз'}
                </button>
            </form>

            {error && <p className="error">{error}</p>}
            {result && <PredictDashboard result={result} cityStats={cityStats} />}
        </div>
    );
};

export default PredictForm;
