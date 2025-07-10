import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface VehiclePosition {
    vehicle_id: string;
    latitude: string;
    longitude: string;
    registration: string;
    speed: number;
    ignition: string;
    event_description: string;
    running_status: string;
}

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
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/vehicles`);
                console.log('Res', response.data);

                const positionsArray: VehiclePosition[] = Object.values(response.data);
                setVehicles(positionsArray);
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
        <MapContainer
            center={[18.7904, 98.9847]}
            zoom={6}
            style={{ height: '100vh', width: '100%' }}
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
                    <Popup>
                        <div>
                            <strong>ทะเบียน: {vehicle.registration}</strong> <br />
                            ความเร็ว: {vehicle.speed} km/h <br />
                            เครื่องยนต์: {vehicle.ignition === '1' ? 'ON' : 'OFF'} <br />
                            สถานะ: {vehicle.event_description} <br />
                            ระยะเวลาทำงาน: {vehicle.running_status} <br />
                            <button
                                onClick={() => handleClick(vehicle.vehicle_id)}
                                style={{
                                    marginTop: '8px',
                                    padding: '4px 10px',
                                    backgroundColor: '#1d72b8',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: 4
                                }}
                            >
                                ดูรายละเอียด
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapView;
