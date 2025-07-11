import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { fetchVehiclePositions, VehiclePosition } from '../api/components/MapApi';

import '../styles/pages/MapView.css'; // 👈 import CSS ที่คุณสร้างไว้

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapView = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const navigate = useNavigate();
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;

        const fetchPositions = async () => {
            try {
                const positions = await fetchVehiclePositions();
                setVehicles(positions);
                hasFetched.current = true;
            } catch (error) {
                console.error('Error fetching vehicle positions:', error);
            }
        };

        fetchPositions();
    }, []);

    const handleClick = (vehicleId: string) => {
        const today = new Date().toISOString().split('T')[0];
        navigate(`/vehicle/${vehicleId}/view?date=${today}`);
    };

    return (
        <div className="map-container-wrapper">
            <MapContainer
                center={[18.7904, 98.9847]}
                zoom={6}
                className="leaflet-container"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {vehicles.map(vehicle => (
                    <Marker
                        key={vehicle.vehicle_id}
                        position={[
                            parseFloat(vehicle.latitude),
                            parseFloat(vehicle.longitude)
                        ]}
                    >
                        <Popup className="popup-content">
                            <div>
                                <strong>ทะเบียน: {vehicle.registration}</strong> <br />
                                ความเร็ว: {vehicle.speed} km/h <br />
                                เครื่องยนต์: {vehicle.ignition === '1' ? 'ON' : 'OFF'} <br />
                                สถานะ: {vehicle.event_description} <br />
                                ระยะเวลาทำงาน: {vehicle.running_status} <br />
                                <button
                                    className="popup-button"
                                    onClick={() => handleClick(vehicle.vehicle_id)}
                                >
                                    ดูรายละเอียด
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;
