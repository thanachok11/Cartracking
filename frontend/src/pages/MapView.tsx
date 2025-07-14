import React, { useEffect, useState } from 'react';
import {
    GoogleMap,
    Marker,
    InfoWindow,
    StreetViewPanorama,
    useJsApiLoader,
} from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { fetchVehiclePositions, VehiclePosition } from '../api/components/MapApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStreetView } from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/GoogleMapView.css'; // 👈 import CSS

const containerStyle = {
    width: '100%',
    height: '100vh',
};

const center = {
    lat: 18.7904,
    lng: 98.9847,
};

const GoogleMapView = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
    const [showStreetView, setShowStreetView] = useState(false);
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    });

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const data = await fetchVehiclePositions();
                setVehicles(data);
                console.log('data',data)
            } catch (error) {
                console.error('Error fetching vehicle positions:', error);
            }
        };

        loadVehicles();
    }, []);

    const handleClick = (vehicleId: string) => {
        const today = new Date().toISOString().split('T')[0];
        navigate(`/vehicle/${vehicleId}/view?date=${today}`);
    };

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <div className="map-wrapper">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={6}
            >
                {vehicles.map(vehicle => (
                    <Marker
                        key={vehicle.vehicle_id}
                        position={{
                            lat: parseFloat(vehicle.latitude),
                            lng: parseFloat(vehicle.longitude),
                        }}
                        onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowStreetView(false);
                        }}
                    />
                ))}

                {selectedVehicle && (
                    <InfoWindow
                        position={{
                            lat: parseFloat(selectedVehicle.latitude),
                            lng: parseFloat(selectedVehicle.longitude),
                        }}
                        onCloseClick={() => setSelectedVehicle(null)}
                    >
                        <div className="popup-info">
                            <strong>ทะเบียน: {selectedVehicle.registration}</strong> <br />
                            ความเร็ว: {selectedVehicle.speed} km/h <br />
                            เครื่องยนต์: {selectedVehicle.ignition === '1' ? 'ON' : 'OFF'} <br />
                            สถานะ: {selectedVehicle.event_description} <br />
                            ระยะเวลาทำงาน: {selectedVehicle.running_status} <br />
                            <button
                                className="popup-button"
                                onClick={() => handleClick(selectedVehicle.vehicle_id)}
                            >
                                ดูรายละเอียด
                            </button>
                        </div>
                    </InfoWindow>
                )}

                {selectedVehicle && showStreetView && (
                    <StreetViewPanorama
                        options={{
                            position: {
                                lat: parseFloat(selectedVehicle.latitude),
                                lng: parseFloat(selectedVehicle.longitude),
                            },
                            pov: { heading: 100, pitch: 0 },
                            zoom: 1,
                        }}
                    />
                )}

            </GoogleMap>

            {/* ปุ่ม Street View */}
            {selectedVehicle && (
                <button
                    className="streetview-button"
                    onClick={() => setShowStreetView(!showStreetView)}
                    title="เปิด Street View"
                >
                    <FontAwesomeIcon icon={faStreetView} size="lg" color="#f57c00" />
                </button>
            )}
        </div>
    );
};

export default GoogleMapView;
