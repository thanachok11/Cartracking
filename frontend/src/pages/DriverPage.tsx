import React, { useEffect, useState } from 'react';
import { fetchAllDrivers } from '../api/components/VehicleApi';
import { Driver } from '../types/Driver';
import '../styles/pages/DriverPage.css';

const DriverPage: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

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

    const filteredDrivers = drivers.filter(driver =>
        `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Loading Driver Data...</div>;

    return (
        <div className="driver-page">
            <div className="driver-header-row">
                <h2 className="section-title">All Drivers Information</h2>
                <button className="add-driver-button">+ Add Driver</button>
            </div>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="ค้นหาชื่อคนขับ"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <p className="search-results">
                        Found {filteredDrivers.length} Driver matching "{searchTerm}"
                    </p>
                )}
            </div>

            <div className="driver-grid-container">
                {filteredDrivers.length === 0 && searchTerm ? (
                    <div className="no-results">
                        <p>No vehicles found matching "{searchTerm}"</p>
                        <p>Try adjusting your search term.</p>
                    </div>
                ) : (
                    filteredDrivers.map((driver) => (
                        <div className="drivers-card" key={driver._id}>
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
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverPage;
