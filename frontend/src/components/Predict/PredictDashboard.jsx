import React from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const formatPrice = (v) => {
    if (v == null) return '—';
    return `${Number(v).toLocaleString('ru-RU')} ₽`;
};

const TREND_COLORS = {
    growth: '#059669',
    stable: '#d97706',
    decline: '#dc2626',
};

const PredictDashboard = ({ result, cityStats }) => {
    const comparisonData = [
        {
            name: 'Прогноз',
            price: result.predicted_price,
            fill: '#2563eb',
        },
        ...(result.city_avg_price
            ? [{ name: 'Среднее в городе', price: result.city_avg_price, fill: '#94a3b8' }]
            : []),
    ];

    const outlookClass =
        result.outlook === 'positive'
            ? 'positive'
            : result.outlook === 'caution'
              ? 'caution'
              : 'neutral';

    return (
        <div className="predict-dashboard">
            <div className={`trend-badge ${outlookClass}`}>
                {result.trend_label}
            </div>

            <div className="kpi-row">
                <div className="kpi-card">
                    <div className="kpi-value">{formatPrice(result.predicted_price)}</div>
                    <div className="kpi-label">Прогноз цены</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{formatPrice(result.price_per_sqm)}</div>
                    <div className="kpi-label">₽ / м²</div>
                </div>
                {result.annual_growth_rate_percent != null && (
                    <div className="kpi-card">
                        <div className="kpi-value">+{result.annual_growth_rate_percent}%</div>
                        <div className="kpi-label">Рост в регионе / год</div>
                    </div>
                )}
                {result.vs_market_percent != null && (
                    <div className="kpi-card">
                        <div className="kpi-value">
                            {result.vs_market_percent > 0 ? '+' : ''}
                            {result.vs_market_percent}%
                        </div>
                        <div className="kpi-label">К среднему по городу</div>
                    </div>
                )}
            </div>

            <div className="dashboard-grid">
                <div className="chart-card">
                    <h3>Прогноз цены на 12 месяцев ({result.city})</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={result.forecast_12m || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis
                                tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
                                tick={{ fontSize: 11 }}
                            />
                            <Tooltip formatter={(v) => formatPrice(v)} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="price"
                                name="Цена"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Сравнение с рынком города</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                            <Tooltip formatter={(v) => formatPrice(v)} />
                            <Bar dataKey="price" name="Цена">
                                {comparisonData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {cityStats && cityStats.length > 0 && (
                    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                        <h3>Средние цены по регионам России (данные из БД)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={cityStats}
                                layout="vertical"
                                margin={{ left: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                                <YAxis type="category" dataKey="city" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => formatPrice(v)} />
                                <Bar dataKey="avg_price" name="Средняя цена" fill="#1d4ed8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {result.profile_stats && result.profile_stats.length > 0 && (
                    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                        <h3>
                            Средние цены по регионам для профиля: {result.profile_filter?.area} м²,{' '}
                            {result.profile_filter?.rooms} комн.
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={result.profile_stats}
                                layout="vertical"
                                margin={{ left: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                                <YAxis type="category" dataKey="city" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => formatPrice(v)} />
                                <Bar dataKey="avg_price" name="Средняя цена (профиль)" fill="#0f766e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {cityStats && cityStats.length > 0 && (
                    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                        <h3>Ожидаемый годовой рост по регионам (%)</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={cityStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                                <YAxis unit="%" />
                                <Tooltip />
                                <Bar dataKey="annual_growth_rate_percent" name="Рост %">
                                    {cityStats.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                entry.annual_growth_rate_percent >= 5.5
                                                    ? TREND_COLORS.growth
                                                    : entry.annual_growth_rate_percent >= 3.5
                                                      ? TREND_COLORS.stable
                                                      : TREND_COLORS.decline
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {result.profile_stats && result.profile_stats.length > 0 && (
                    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                        <h3>
                            Ожидаемый годовой рост по регионам (%) для профиля:{' '}
                            {result.profile_filter?.area} м², {result.profile_filter?.rooms} комн.
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={result.profile_stats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="city"
                                    tick={{ fontSize: 11 }}
                                    angle={-20}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis unit="%" />
                                <Tooltip />
                                <Bar dataKey="annual_growth_rate_percent" name="Рост % (профиль)">
                                    {result.profile_stats.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                entry.annual_growth_rate_percent >= 5.5
                                                    ? TREND_COLORS.growth
                                                    : entry.annual_growth_rate_percent >= 3.5
                                                      ? TREND_COLORS.stable
                                                      : TREND_COLORS.decline
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PredictDashboard;
