import React, { useEffect, useState } from 'react';
import { fetchAllContrainers } from '../api/components/containersApi';
import { Contrainers } from '../types/Contrainer'; // ถ้าพิมพ์ผิดตรงนี้ ต้องเปลี่ยนเป็น Containers
import '../styles/pages/ContainerPage.css';

const ContainerPage: React.FC = () => {
    const [containers, setContainers] = useState<Contrainers[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const containerData = await fetchAllContrainers(); // <-- แก้ชื่อฟังก์ชัน
                setContainers(containerData);
                console.log('Containers loaded:', containerData);
            } catch (error) {
                console.error('Error loading containers:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const filteredContainers = containers.filter(container =>
        container.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        container.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Loading Containers Data...</div>;

    return (
        <div className="Containers-page">
            <div className="Container-header-row">
                <h2 className="section-title">All Container Information</h2>
                <button className="add-container-button">+ Add Container</button>
            </div>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="ค้นหาหมายเลขตู้หรือชื่อบริษัท"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <p className="search-results">
                        Found {filteredContainers.length} vehicle(s) matching "{searchTerm}"
                    </p>
                )}
            </div>

            <div className="grid-container">
                {filteredContainers.length === 0 && searchTerm ? (
                    <div className="no-results">
                        <p>No vehicles found matching "{searchTerm}"</p>
                        <p>Try adjusting your search term.</p>
                    </div>
                ) : (
                    filteredContainers.map((container) => (
                        <div className="card" key={container._id}>
                            <h3>Container Number: {container.containerNumber}</h3>
                            <p>Company Name: {container.companyName}</p>
                            <p>Container Size: {container.containerSize}</p>
                            {container.createdAt && <p>Created At: {new Date(container.createdAt).toLocaleString()}</p>}
                            {container.updatedAt && <p>Updated At: {new Date(container.updatedAt).toLocaleString()}</p>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ContainerPage;
