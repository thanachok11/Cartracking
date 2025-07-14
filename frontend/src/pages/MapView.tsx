// GoogleMapView.tsx
import React, { useEffect, useState } from 'react';
import {
    GoogleMap,
    Marker,
    StreetViewPanorama,
    InfoWindow,
    useJsApiLoader,
} from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import {
    fetchVehicle,
    VehiclePosition,
    Geofence,
    fetchGeofences,
} from '../api/components/MapApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStreetView } from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/GoogleMapView.css';

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: 18.7904,
    lng: 98.9847,
};

const GoogleMapView = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
    const [showStreetView, setShowStreetView] = useState(false);

    const [popupVehicle, setPopupVehicle] = useState<VehiclePosition | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [vehicleData, geofenceData] = await Promise.all([
                    fetchVehicle(),
                    fetchGeofences(),
                ]);
                setVehicles(vehicleData);
                setGeofences(geofenceData);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    const handleClick = (vehicleId: string) => {
        const today = new Date().toISOString().split('T')[0];
        navigate(`/vehicle/${vehicleId}/view?date=${today}`);
    };

    const getDriverName = (vehicle: VehiclePosition) => {
        return vehicle.driver_name?.name || null;
    };

    const hoveredVehicle = vehicles.find(v => v.vehicle_id === hoveredVehicleId) || null;

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <div className="map-page">
            {/* Sidebar */}
            <div className="vehicle-panel">
                {vehicles.map(vehicle => (
                    <div
                        key={vehicle.vehicle_id}
                        className="vehicle-item"
                        onMouseEnter={(e) => {
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            setPopupVehicle(vehicle);
                            setPopupPosition({ top: rect.top, left: rect.right + 10 });
                            setHoveredVehicleId(vehicle.vehicle_id);
                        }}
                        onMouseLeave={() => {
                            setPopupVehicle(null);
                            setPopupPosition(null);
                            setHoveredVehicleId(null);
                        }}
                        onClick={() => handleClick(vehicle.vehicle_id)}
                    >
                        <strong>{vehicle.registration}</strong>
                    </div>
                ))}
            </div>

            {popupVehicle && popupPosition && (
                <div
                    className="vehicle-popup-fixed"
                    style={{
                        top: popupPosition.top,
                        left: popupPosition.left,
                        position: 'fixed',
                    }}
                >
                    <div><strong>ทะเบียน:</strong> {popupVehicle.registration}</div>
                    <div><strong>Speed:</strong> {popupVehicle.speed} km/h</div>
                    <div><strong>Status:</strong> {popupVehicle.event_description}</div>
                    <div><strong>Ignition:</strong> {popupVehicle.ignition === '1' ? 'ON' : 'OFF'}</div>
                    <div><strong>Running:</strong> {popupVehicle.running_status}</div>
                    <div>
                        <strong>Driver:</strong> {getDriverName(popupVehicle) || <em>ไม่พบข้อมูลคนขับ</em>}
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="map-area">
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

                    {/* แสดง InfoWindow เมื่อมีรถถูกเลือก */}
                    {selectedVehicle && (
                        <InfoWindow
                            position={{
                                lat: parseFloat(selectedVehicle.latitude),
                                lng: parseFloat(selectedVehicle.longitude),
                            }}
                            onCloseClick={() => setSelectedVehicle(null)}
                        >
                            <div style={{ minWidth: 200 }}>
                                <strong>{selectedVehicle.registration}</strong><br />
                                Speed: {selectedVehicle.speed} km/h<br />
                                Status: {selectedVehicle.event_description}<br />
                                Ignition: {selectedVehicle.ignition === '1' ? 'ON' : 'OFF'}<br />
                                Running: {selectedVehicle.running_status}<br />
                                Driver: {getDriverName(selectedVehicle) || <em>ไม่พบข้อมูลคนขับ</em>}
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

                {/* Street View Button */}
                {selectedVehicle && (
                    <button
                        className="streetview-button"
                        onClick={() => setShowStreetView(!showStreetView)}
                        title="Street View"
                    >
                        <FontAwesomeIcon icon={faStreetView} size="lg" color="#f57c00" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default GoogleMapView;
