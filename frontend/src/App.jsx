import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import API from './services/api';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PropertyList from './components/Properties/PropertyList';
import PropertyDetail from './components/Properties/PropertyDetail';
import AddPropertyForm from './components/Properties/AddPropertyForm';
import FavoritesList from './components/Favorites/FavoritesList';
import PredictForm from './components/Predict/PredictForm';
import PrivateRoute from './components/Auth/PrivateRoute';
import './App.css';

const FAVORITE_FILTER_KEY = 'favoritePropertyFilters';
const POLL_MS = 30000;

function App() {
    const { isAuthenticated, logout } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isBellOpen, setIsBellOpen] = useState(false);

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.read).length,
        [notifications]
    );

    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            return undefined;
        }

        let cancelled = false;
        let timerId = null;

        const pollMatches = async () => {
            const raw = localStorage.getItem(FAVORITE_FILTER_KEY);
            if (!raw) return;

            let savedFilter;
            try {
                savedFilter = JSON.parse(raw);
            } catch {
                return;
            }

            const { saved_at, last_checked_at: lastCheckedAt, seen_ids: seenIds = [] } = savedFilter;
            const params = { ...savedFilter };
            delete params.page;
            delete params.limit;
            delete params.saved_at;
            delete params.last_checked_at;
            delete params.seen_ids;

            try {
                const response = await API.get('/properties', {
                    params: { ...params, page: 1, limit: 100 },
                });
                const items = response.data?.items ?? [];
                const since = new Date(lastCheckedAt || saved_at || 0).getTime();
                const newMatches = items.filter((property) => {
                    const createdAt = new Date(property.created_at).getTime();
                    return createdAt > since && !seenIds.includes(property.id);
                });

                if (!cancelled && newMatches.length > 0) {
                    setNotifications((prev) => {
                        const existing = new Set(prev.map((n) => n.id));
                        const fresh = newMatches
                            .filter((item) => !existing.has(item.id))
                            .map((item) => ({
                                id: item.id,
                                address: item.address,
                                city: item.city,
                                price: item.price,
                                read: false,
                            }));
                        return [...fresh, ...prev].slice(0, 20);
                    });
                }

                const updatedSeen = [...seenIds, ...newMatches.map((item) => item.id)].slice(-400);
                localStorage.setItem(
                    FAVORITE_FILTER_KEY,
                    JSON.stringify({
                        ...savedFilter,
                        last_checked_at: new Date().toISOString(),
                        seen_ids: updatedSeen,
                    })
                );
            } catch (error) {
                console.error('Failed to check notifications', error);
            }
        };

        pollMatches();
        timerId = setInterval(pollMatches, POLL_MS);

        return () => {
            cancelled = true;
            if (timerId) clearInterval(timerId);
        };
    }, [isAuthenticated]);

    const toggleBell = () => {
        setIsBellOpen((prev) => !prev);
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    };

    return (
        <BrowserRouter>
            <div className="App">
                <header className="app-header">
                    <h1 className="logo">Мониторинг недвижимости</h1>
                    <nav>
                        {isAuthenticated && (
                            <div className="bell-wrap">
                                <button
                                    type="button"
                                    className="btn-bell"
                                    onClick={toggleBell}
                                    aria-label="Уведомления"
                                >
                                    🔔
                                    {unreadCount > 0 && (
                                        <span className="bell-badge">{unreadCount}</span>
                                    )}
                                </button>
                                {isBellOpen && (
                                    <div className="bell-dropdown">
                                        {notifications.length === 0 ? (
                                            <p>Пока нет новых совпадений.</p>
                                        ) : (
                                            notifications.map((item) => (
                                                <Link
                                                    key={item.id}
                                                    to={`/properties/${item.id}`}
                                                    className="bell-item"
                                                    onClick={() => setIsBellOpen(false)}
                                                >
                                                    <strong>{item.address}</strong>
                                                    <span>{item.city}</span>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <Link to="/properties">Объекты</Link>
                        <Link to="/predict">Прогноз и аналитика</Link>
                        {isAuthenticated && <Link to="/favorites">Избранное</Link>}
                        {isAuthenticated && <Link to="/add-property">Добавить</Link>}
                        {!isAuthenticated && <Link to="/login">Вход</Link>}
                        {!isAuthenticated && <Link to="/register">Регистрация</Link>}
                        {isAuthenticated && (
                            <button type="button" className="btn-nav" onClick={logout}>
                                Выйти
                            </button>
                        )}
                    </nav>
                </header>

                <main className="app-main">
                    <Routes>
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="/properties" element={<PropertyList />} />
                        <Route path="/properties/:id" element={<PropertyDetail />} />
                        <Route path="/predict" element={<PredictForm />} />
                        <Route
                            path="/favorites"
                            element={
                                <PrivateRoute>
                                    <FavoritesList />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/add-property"
                            element={
                                <PrivateRoute>
                                    <AddPropertyForm />
                                </PrivateRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/properties" />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
