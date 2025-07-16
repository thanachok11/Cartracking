// GoogleMapView.tsx
import React, { useEffect, useState } from 'react';
import {
    GoogleMap,
    Marker,
    StreetViewPanorama,
    InfoWindow,
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
    faStreetView, faMapMarkerAlt, faBatteryFull, faTruck,faCar, faUser, faClock, faRoad, faTachometerAlt, faExclamationTriangle
 } from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/GoogleMapView.css';
import { useGoogleMaps } from './GoogleMapsProvider';

const containerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 18.7904,
    lng: 98.9847,
};
function getVehicleIcon(circleColor: string, imageUrl: string) {
    const svg = `
      <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="25" fill="${circleColor}" />
        <image href="${imageUrl}" x="12" y="12" height="26" width="26" />
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}



const GoogleMapView = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
    const [showStreetView, setShowStreetView] = useState(false);
    const [hoveredVehicle, setHoveredVehicle] = useState<VehiclePosition | null>(null);

    const [popupVehicle, setPopupVehicle] = useState<VehiclePosition | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

    const [searchTerm, setSearchTerm] = useState("");

    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(6);

    const navigate = useNavigate();

    const { isLoaded } = useGoogleMaps();


    useEffect(() => {
        if (popupVehicle) {
            const lat = parseFloat(popupVehicle.latitude);
            const lng = parseFloat(popupVehicle.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapCenter({ lat, lng });
                setMapZoom(12); // ซูมเข้า
            }
        }
    }, [popupVehicle]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [vehicleData, geofenceData] = await Promise.all([
                    fetchVehicle(),
                    fetchGeofences(),
                ]);
                setVehicles(vehicleData);
                setGeofences(geofenceData); // ✅ แปลงเป็น array
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

    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );



    const getDriverName = (vehicle: VehiclePosition) => {
        return vehicle.driver_name?.name || null;
    };

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <div className="map-page">
            {/* Sidebar */}
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

                    {popupVehicle?.position_description?.principal?.description ? (
                        <div className="location-info">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <span>{popupVehicle.position_description.principal.description}</span>
                        </div>
                    ) : (
                        <div className="location-info">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <em>ไม่พบตำแหน่ง</em>
                        </div>
                    )}

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
                        {popupVehicle?.alertsActions?.batteryAlerts?.batteryPercentage != null
                            ? <span>{popupVehicle.alertsActions.batteryAlerts.batteryPercentage}%</span>
                            : popupVehicle?.batteryAlerts?.batteryPercentage != null
                                ? <span>{popupVehicle.batteryAlerts.batteryPercentage}%</span>
                                : <em>ไม่พบข้อมูล</em>}
                        <FontAwesomeIcon icon={faBatteryFull
                        } className="battery-icon" />
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
            <hr />

            {/* Map */}
            <div className="map-area" style={{ flexGrow: 1, position: 'relative' }}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter}
                    zoom={mapZoom}
                    onClick={() => {
                        setSelectedVehicle(null);
                        setShowStreetView(false);
                    }}
                    onZoomChanged={() => {
                        // ถ้าใช้ ref map จะดี แต่ขอเว้นไว้
                    }}
                >
                    {vehicles.map(vehicle => {
                        const lat = parseFloat(vehicle.latitude);
                        const lng = parseFloat(vehicle.longitude);
                        if (isNaN(lat) || isNaN(lng)) return null;

                        // กำหนดสีวงกลมตามสถานะ (statusClassName)
                        const status = vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-');

                        const statusColorMap: Record<string, string> = {
                            'driving': '#00a326',
                            'idling': '#ffc107',
                            'stationary': '#7dc2ff',
                            'ignition-off': '#6c757d',
                        };

                        const circleColor = statusColorMap[status] || '#999999';

                        return (
                            <Marker
                                key={vehicle.vehicle_id}
                                position={{ lat, lng }}
                                icon={{
                                    url: getVehicleIcon(circleColor, "/container.png"),
                                    scaledSize: new window.google.maps.Size(50, 50),
                                    anchor: new window.google.maps.Point(25, 25),
                                }}

                                onClick={() => {
                                    setSelectedVehicle(vehicle);
                                    setShowStreetView(false);
                                }}
                            />
                        );
                    })}



                    {/* แสดง InfoWindow เมื่อมีรถถูกเลือก */}
                    {selectedVehicle && (
                        <InfoWindow
                            position={{
                                lat: parseFloat(selectedVehicle.latitude),
                                lng: parseFloat(selectedVehicle.longitude),
                            }}
                            onCloseClick={() => setSelectedVehicle(null)}
                        >
                            <div style={{ minWidth: 200, padding: '10px' }}>
                                <strong>Car registration: {selectedVehicle.registration}</strong><br />
                                Speed: {selectedVehicle.speed} km/h<br />
                                Status: {selectedVehicle.statusClassName}<br />
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