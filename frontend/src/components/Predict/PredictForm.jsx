import React, { useState } from 'react';
import API from '../../services/api';

const PredictForm = () => {
    const [area, setArea] = useState('');
    const [rooms, setRooms] = useState('');
    const [predictedPrice, setPredictedPrice] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await API.post('/predict', {
                area: parseFloat(area),
                rooms: parseInt(rooms),
            });
            setPredictedPrice(response.data.predicted_price);
            setError('');
        } catch (err) {
            setError('Prediction failed');
        }
    };

    return (
        <div className="predict-form">
            <h2>Predict Property Price</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Area (m²):</label>
                    <input type="number" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} required />
                </div>
                <div>
                    <label>Rooms:</label>
                    <input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} required />
                </div>
                <button type="submit">Predict</button>
            </form>
            {predictedPrice !== null && (
                <div className="result">
                    Predicted Price: {predictedPrice.toLocaleString()} ₽
                </div>
            )}
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default PredictForm;