import React, { useEffect, useState } from 'react';
import { fetchVehicle, VehiclePosition } from '../api/components/MapApi';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/VehiclePage.css';

const VehiclePage: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const getVehicles = async () => {
            try {
                const data = await fetchVehicle();
                setVehicles(data);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            } finally {
                setLoading(false);
            }
        };

        getVehicles();
    }, []);

    if (loading) return <div className="loading">Loading vehicle data...</div>;

    return (
        <div className="vehicle-page">
            {/* แถวหัวเรื่อง + ปุ่ม */}
            <div className="header-row">
                <h1 className="page-title">Vehicle Data</h1>
            </div>
            <button onClick={() => navigate('/drivers')} className="btn-driver-navigate">
                Drivers
            </button>
            
            {/* ตารางข้อมูลรถ */}
            <div className="vehicle-grid">
                
                {vehicles.map((vehicle) => (
                    <div key={vehicle.vehicle_id} className="vehicle-card">
                        <h3 className="vehicle-registration">{vehicle.registration}</h3>
                        <p><strong>Driver:</strong> {vehicle.driver_name?.name || 'No Driver Assigned'}</p>
                        <p><strong>Status:</strong> {vehicle.running_status}</p>
                        <p><strong>Speed:</strong> {vehicle.speed} km/h</p>
                        <p><strong>Ignition:</strong> {vehicle.ignition}</p>
                        <p><strong>Location:</strong> {vehicle.latitude}, {vehicle.longitude}</p>
                        <p><strong>Description:</strong> {vehicle.position_description?.principal?.description || '-'}</p>
                        <p><strong>Battery:</strong> {vehicle.alertsActions?.batteryAlerts?.batteryPercentage ?? 'N/A'}%</p>

                        {vehicle.actionAlerts?.eventType && (
                            <div className="alert-box">
                                <p><strong>Alert:</strong> {vehicle.actionAlerts.eventTypeDescription}</p>
                                {vehicle.actionAlerts.eventTypeIcon && (
                                    <img
                                        src={vehicle.actionAlerts.eventTypeIcon}
                                        alt="event icon"
                                        className="alert-icon"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VehiclePage;
