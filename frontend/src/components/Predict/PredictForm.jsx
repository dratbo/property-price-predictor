import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { DATA_UPDATE_INFO, RUSSIAN_CITIES } from '../../constants/regions';
import { optionalChoice, resetCityFilterFields } from '../../constants/propertyOptions';
import { useCityFilters } from '../../hooks/useCityFilters';
import FilterSelect from '../common/FilterSelect';
import PredictDashboard from './PredictDashboard';
import { useLocation } from 'react-router-dom';
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

const PredictForm = () => {
    const DEFAULT_FORM = {
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
        building_repair_type: '',
    };

    const [form, setForm] = useState(DEFAULT_FORM);
    const [result, setResult] = useState(null);
    const [cityStats, setCityStats] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mlStatus, setMlStatus] = useState(null);
    const { filters, loading: filtersLoading } = useCityFilters(form.city);
    const location = useLocation();

    useEffect(() => {
        loadAnalytics();
        checkML();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const city = params.get('city');
        const area = params.get('area');
        const rooms = params.get('rooms');

        // Нужны минимум 3 поля, которые обязательны для запроса к ML.
        if (!city || !area || !rooms) return;

        setForm({
            ...DEFAULT_FORM,
            city,
            area,
            rooms,
            district: params.get('district') ?? '',
            floor: params.get('floor') ?? '',
            total_floors: params.get('total_floors') ?? '',
            building_type: params.get('building_type') ?? '',
            year_built: params.get('year_built') ?? '',
            developer: params.get('developer') ?? '',
            repair_type: params.get('repair_type') ?? '',
            building_repair_type: params.get('building_repair_type') ?? '',
        });
        setError('');
        setResult(null);
    }, [location.search]);

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
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await API.post('/predict', {
                area: parseFloat(form.area),
                rooms: parseInt(form.rooms, 10),
                city: form.city,
                district: optionalChoice(form.district),
                floor: parseOptionalFloor(form.floor),
                total_floors: parseOptionalFloor(form.total_floors),
                building_type: optionalChoice(form.building_type),
                year_built: parseOptionalYear(form.year_built),
                developer: optionalChoice(form.developer),
                repair_type: optionalChoice(form.repair_type),
                building_repair_type: optionalChoice(form.building_repair_type),
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
                    <select value={form.city} onChange={handleCityChange} required>
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
                <FilterSelect
                    label="Район"
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
