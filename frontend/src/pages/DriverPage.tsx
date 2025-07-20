import React, { useEffect, useState } from 'react';
import { fetchAllDrivers } from '../api/components/VehicleApi';
import { Driver } from '../types/Driver';
import '../styles/pages/DriverPage.css';

const VehiclePage: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const driverData = await fetchAllDrivers();
                setDrivers(driverData);
                console.log('Drivers loaded:', driverData);
            } catch (error) {
                console.error('Error loading drivers:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return <div className="loading">Loading data...</div>;

    return (
        <div className="vehicle-page">
            <h2 className="section-title">All Drivers Information</h2>
            <div className="grid-container">
                {drivers.map((driver) => (
                    <div className="card" key={driver._id}>
                        {driver.profile_img && (
                            <img
                                src={driver.profile_img}
                                alt={`${driver.firstName} ${driver.lastName}`}
                                className="profile-img"
                            />
                        )}
                        <h3>{driver.firstName} {driver.lastName}</h3>
                        <p>Position: {driver.position}</p>
                        <p>Company: {driver.company}</p>
                        <p>Phone Number: {driver.phoneNumber}</p>
                        {driver.detail && <p>Details: {driver.detail}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VehiclePage;
