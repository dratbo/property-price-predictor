import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AddPropertyForm = () => {
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('');
    const [rooms, setRooms] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/properties', {
                address,
                area: parseFloat(area),
                rooms: parseInt(rooms),
                price: parseFloat(price),
            });
            navigate('/properties');
        } catch (err) {
            setError('Failed to add property');
        }
    };

    return (
        <div className="add-property-form">
            <h2>Add New Property</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Address:</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div>
                    <label>Area (m²):</label>
                    <input type="number" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} required />
                </div>
                <div>
                    <label>Rooms:</label>
                    <input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} required />
                </div>
                <div>
                    <label>Price (₽):</label>
                    <input type="number" step="1000" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <button type="submit">Add Property</button>
            </form>
        </div>
    );
};

export default AddPropertyForm;