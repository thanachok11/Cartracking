// GoogleMapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {
    GoogleMap,

} from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import {
    fetchVehicle,
    VehiclePosition,
    Geofence,
    fetchGeofences,

} from '../api/components/MapApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
     faMapMarkerAlt, faBatteryFull, faTruck, faRoad, faTachometerAlt,
} from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/GoogleMapView.css';

const containerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 18.7904,
    lng: 98.9847,
};


const statusColorMap: Record<string, string> = {
    'driving': '#00a326',
    'idling': '#ffc107',
    'stationary': '#7dc2ff',
    'ignition-off': '#6c757d',
};

const GoogleMapView = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
    const [hoveredVehicle, setHoveredVehicle] = useState<VehiclePosition | null>(null);

    const [popupVehicle, setPopupVehicle] = useState<VehiclePosition | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

    const [searchTerm, setSearchTerm] = useState("");

    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(6);

    const navigate = useNavigate();
    const { isLoaded } = useGoogleMaps();
    const mapRef = useRef<google.maps.Map | null>(null);
    const clustererRef = useRef<MarkerClusterer | null>(null);

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
        const interval = setInterval(loadData, 20000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;

        // Clear old cluster if exists
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        const filtered = vehicles.filter(vehicle =>
            vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const markers = filtered.map(vehicle => {
            const lat = parseFloat(vehicle.latitude);
            const lng = parseFloat(vehicle.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const marker = new google.maps.Marker({
                position: { lat, lng },
                icon: {
                    url:  "/container.png",
                    scaledSize: new google.maps.Size(50, 50),
                    anchor: new google.maps.Point(25, 25),
                },
                title: `Vehicle: ${vehicle.registration}`,
            });

            marker.addListener('click', () => {
                const today = new Date().toISOString().split('T')[0];
                navigate(`/vehicle/${vehicle.vehicle_id}/view?date=${today}`);
            });

            return marker;
        }).filter(Boolean) as google.maps.Marker[];

        clustererRef.current = new MarkerClusterer({ markers, map: mapRef.current });

    }, [vehicles, searchTerm, isLoaded]);
    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClick = (vehicleId: string) => {
        const today = new Date().toISOString().split('T')[0];
        navigate(`/vehicle/${vehicleId}/view?date=${today}`);
    };

    const getDriverName = (vehicle: VehiclePosition) => {
        return vehicle.driver_name?.name || null;
    };

    if (!isLoaded) return <div>Loading Map...</div>;

return (
        <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
            {/* Sidebar Panel */}
            <div className="vehicle-panel">
                <div className="vehicle-search">
                    <input
                        type="text"
                        placeholder="ค้นหาทะเบียน..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="vehicle-list">
                    {filteredVehicles.map(vehicle => (
                        <div
                            key={vehicle.vehicle_id}
                            className="vehicle-item"
                            onMouseEnter={(e) => {
                                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                setPopupVehicle(vehicle);
                                setPopupPosition({ top: rect.top, left: rect.right + 10 });
                                setHoveredVehicleId(vehicle.vehicle_id);
                                setHoveredVehicle(vehicle);
                            }}
                            onMouseLeave={() => {
                                setPopupVehicle(null);
                                setPopupPosition(null);
                                setHoveredVehicleId(null);
                                setHoveredVehicle(null);
                            }}
                            onClick={() => handleClick(vehicle.vehicle_id)}
                        >
                            <div className={`status-circle status-${vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
                                <FontAwesomeIcon icon={faTruck} style={{ color: 'white' }} />
                            </div>
                            <div className="vehicle-details">
                                <div className="registration">{vehicle.registration}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Google Map */}
            <div style={{ flex: 1 }}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter}
                    zoom={mapZoom}
                onLoad={(map) => void (mapRef.current = map)}
                />
            </div>

            {/* Popup Panel */}
            {popupVehicle && popupPosition && (
                <div
                    className="vehicle-popup-fixed"
                    style={{
                        top: popupPosition.top,
                        left: popupPosition.left,
                    }}
                >
                    <div className="info-row">
                        <span className={`status-badge status-${popupVehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {popupVehicle.statusClassName}
                        </span>
                        <span className="timestamp">
                            {popupVehicle.event_ts ? new Date(popupVehicle.event_ts).toLocaleString('th-TH', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                            }) : "-"}
                        </span>
                    </div>

                    <div className="location-info">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        <span>{popupVehicle.position_description?.principal?.description || <em>ไม่พบตำแหน่ง</em>}</span>
                    </div>

                    <div className="stats">
                        <div>
                            <div>{popupVehicle.speed != null ? `${popupVehicle.speed} KM/H` : '--'}</div>
                            <div>SPEED</div>
                            <FontAwesomeIcon icon={faTachometerAlt} />
                        </div>
                        <div>
                            <div>{popupVehicle.road_speed != null ? `${popupVehicle.road_speed} KM/H` : '--'}</div>
                            <div>ROAD SPEED</div>
                            <FontAwesomeIcon icon={faRoad} />
                        </div>
                    </div>

                    <div className="info-row">
                        <span className="label">TCU Battery:</span>{" "}
                        {
                            popupVehicle?.alertsActions?.batteryAlerts?.batteryPercentage != null
                                ? <span>{popupVehicle.alertsActions.batteryAlerts.batteryPercentage}%</span>
                                : popupVehicle?.batteryAlerts?.batteryPercentage != null
                                    ? <span>{popupVehicle.batteryAlerts.batteryPercentage}%</span>
                                    : <em>ไม่พบข้อมูล</em>
                        }
                        <FontAwesomeIcon icon={faBatteryFull} className="battery-icon" />
                    </div>

                    <hr />

                    <div className="info-row">
                        <span className="label">Car registration:</span> <span>{popupVehicle.registration}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Ignition:</span> <span>{popupVehicle.ignition === '1' ? 'ON' : 'OFF'}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Running:</span> <span>{popupVehicle.running_status}</span>
                    </div>
                    <div className="driver-tag">
                        <strong>Driver:</strong>{" "}
                        {getDriverName(popupVehicle) || <em>ไม่พบข้อมูลคนขับ</em>}
                    </div>
                </div>
            )}
        </div>
    );

};

export default GoogleMapView;
