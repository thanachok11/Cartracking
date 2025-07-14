import React, { useEffect, useState } from 'react';
import {
    GoogleMap,
    Marker,
    InfoWindow,
    StreetViewPanorama,
    useJsApiLoader,
} from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import {
    fetchVehiclePositions,
    fetchDrivers,
    fetchGeofences,
    VehiclePosition,
    Driver,
    Geofence,
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
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
    const [showStreetView, setShowStreetView] = useState(false);
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [vehicleData, driverData, geofenceData] = await Promise.all([
                    fetchVehiclePositions(),
                    fetchDrivers(),
                    fetchGeofences(),
                ]);

                setVehicles(vehicleData);
                setDrivers(driverData);
                setGeofences(geofenceData);

                console.log('vehicles', vehicleData);
                console.log('drivers', driverData);
                console.log('geofences', geofenceData);
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

    const getDriverName = (vehicleId: string): string | undefined => {
        const driver = drivers.find(d => d.vehicle_id === vehicleId);
        return driver?.driver_name;
    };

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <div className="map-page">
            {/* Sidebar */}
            <div className="sidebar">
                {vehicles.map(vehicle => (
                    <div
                        key={vehicle.vehicle_id}
                        className={`vehicle-item ${selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'active' : ''}`}
                        onMouseEnter={() => {
                            setSelectedVehicle(vehicle);
                            setShowStreetView(false);
                        }}
                        onClick={() => handleClick(vehicle.vehicle_id)}
                    >
                        <div className="vehicle-reg">
                            {vehicle.registration}
                        </div>

                        {/* แสดงรายละเอียดเมื่อ hover หรือ active */}
                        {selectedVehicle?.vehicle_id === vehicle.vehicle_id && (
                            <div className="vehicle-details">
                                <div>Speed: {vehicle.speed} km/h</div>
                                <div>Status: {vehicle.event_description}</div>
                                <div>Ignition: {vehicle.ignition === '1' ? 'ON' : 'OFF'}</div>
                                <div>Running Time: {vehicle.running_status}</div>
                                {getDriverName(vehicle.vehicle_id) && (
                                    <div>Driver: {getDriverName(vehicle.vehicle_id)}</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Map Area */}
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

                    {selectedVehicle && (
                        <InfoWindow
                            position={{
                                lat: parseFloat(selectedVehicle.latitude),
                                lng: parseFloat(selectedVehicle.longitude),
                            }}
                            onCloseClick={() => setSelectedVehicle(null)}
                        >
                            <div className="popup-info">
                                <strong>{selectedVehicle.registration}</strong><br />
                                Speed: {selectedVehicle.speed} km/h <br />
                                Ignition: {selectedVehicle.ignition === '1' ? 'ON' : 'OFF'} <br />
                                Status: {selectedVehicle.event_description} <br />
                                Running Time: {selectedVehicle.running_status} <br />
                                {getDriverName(selectedVehicle.vehicle_id) && (
                                    <>Driver: {getDriverName(selectedVehicle.vehicle_id)}<br /></>
                                )}
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
