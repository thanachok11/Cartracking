import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Hook ใช้กับ react-router
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

// Format Date
function formatDate(inputDate: string | undefined) {
    if (!inputDate) return '-';
    const d = new Date(inputDate);
    return d.toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'medium',
    });
}

// แปลงค่าน้ำมัน
function convertFuelRawToLiters(rawValue: number) {
    return rawValue * 0.4;
}

// Leaflet icon config
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// MAIN COMPONENT
const VehicleView = () => {
    const { id } = useParams<{ id: string }>();
    const query = useQuery();
    const date = query.get('date');

    const [timeline, setTimeline] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // ref บอกว่า fetch timeline แล้ว
    const hasFetchedTimeline = useRef(false);
    // ref บอกว่า fetch addresses แล้ว
    const hasFetchedAddresses = useRef(false);

    const [eventAddresses, setEventAddresses] = useState<Record<number, string>>({});

    // Fetch timeline data
    useEffect(() => {
        if (!id || !date) return;
        if (hasFetchedTimeline.current) return;

        setLoading(true);
        axios
            .get(`${process.env.REACT_APP_API_URL}/vehicle/${id}/view`, { params: { date } })
            .then((res) => {
                if (res.data) {
                    setTimeline(res.data);
                    setError('');
                    hasFetchedTimeline.current = true;
                } else {
                    setError('ไม่พบข้อมูล timeline');
                }
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'ดึงข้อมูลไม่สำเร็จ');
            })
            .finally(() => setLoading(false));
    }, [id, date]);

    useEffect(() => {
        if (!timeline?.events || timeline.events.length === 0) return;
        if (hasFetchedAddresses.current) return;

        const cacheKey = `eventAddresses-10-${timeline.events[0]?.date || ''}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            setEventAddresses(JSON.parse(cached));
            hasFetchedAddresses.current = true;
            return;
        }

        const fetchAllAddresses = async () => {
            const newAddresses: Record<number, string> = {};

            const events = timeline.events.slice(-10); // ✅ ใช้แค่ 10 เหตุการณ์ล่าสุด

            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                const lat = event.lat || event.coords?.lat;
                const lon = event.lng || event.coords?.lng;

                if (!lat || !lon) {
                    newAddresses[i] = '-';
                    setEventAddresses({ ...newAddresses });
                    continue;
                }

                const url = `${process.env.REACT_APP_API_URL}/reverse-geocode?lat=${lat}&lon=${lon}`;

                try {
                    const res = await fetch(url);
                    const data = await res.json();
                    newAddresses[i] = data.display_name || '-';
                } catch (e) {
                    console.error('Error fetching address:', e);
                    newAddresses[i] = '-';
                }

                setEventAddresses({ ...newAddresses });

                await new Promise((r) => setTimeout(r, 1000));
            }

            sessionStorage.setItem(cacheKey, JSON.stringify(newAddresses));
            hasFetchedAddresses.current = true;
        };

        fetchAllAddresses();
    }, [timeline?.events]);
    
    // Map sensorNumber → sensorName
    const sensorMap =
        timeline?.sensorByNumber?.reduce((acc: Record<string, string>, sensor: any) => {
            acc[sensor.sensorNumber] = sensor.name;
            return acc;
        }, {}) || {};

    const lastPos = timeline?.lastPosition;
    const lat = lastPos?.lat;
    const lng = lastPos?.lng;

    return (
        <div style={{ padding: 20 }}>
            <h2>Timeline ของรถ {id}</h2>
            <p>วันที่: {date}</p>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading && <p>กำลังโหลดข้อมูล...</p>}

            {/* MAP */}
            {timeline && lat && lng && (
                <MapContainer center={[lat, lng]} zoom={14} style={{ height: '60vh', width: '100%', marginBottom: 20 }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />

                    <Marker position={[lat, lng]}>
                        <Popup>
                            <div>
                                <strong>ตำแหน่งล่าสุด</strong><br />
                                {lastPos.position_description?.principal?.description || '-'}
                            </div>
                        </Popup>
                    </Marker>

                    {timeline.timeline?.slice(-20).map((trip: any, index: number) => {
                        const startLat = parseFloat(trip.trip_start_valid_latitude);
                        const startLng = parseFloat(trip.trip_start_valid_longitude);
                        const endLat = parseFloat(trip.trip_end_valid_latitude);
                        const endLng = parseFloat(trip.trip_end_valid_longitude);

                        if (
                            isNaN(startLat) ||
                            isNaN(startLng) ||
                            isNaN(endLat) ||
                            isNaN(endLng)
                        ) {
                            return null;
                        }

                        return (
                            <Polyline
                                key={index}
                                positions={[
                                    [startLat, startLng],
                                    [endLat, endLng],
                                ]}
                                color="blue"
                            />
                        );
                    })}
                </MapContainer>
            )}

            {/* EVENTS */}
            {timeline?.events && timeline.events.length > 0 && (
                <div style={{ marginTop: 30 }}>
                    <h3>Events (แสดงล่าสุด {Math.min(10, timeline.events.length)} เหตุการณ์)</h3>
                    <ul>
                        {timeline.events
                            .slice(-10)
                            .map((event: any, idx: number) => (
                                <li key={idx} style={{ marginBottom: 10 }}>
                                    <div><strong>เวลา:</strong> {formatDate(event.date)}</div>
                                    <div>
                                        <strong>ตำแหน่ง:</strong>{' '}
                                        {eventAddresses[idx] === undefined
                                            ? 'กำลังโหลดที่อยู่...'
                                            : eventAddresses[idx] || (
                                                event.coords
                                                    ? `Lat: ${event.coords.lat}, Lng: ${event.coords.lng}`
                                                    : '-'
                                            )}
                                    </div>

                                    <div><strong>Odometer:</strong> {event.odometer ?? '-'}</div>
                                    <div><strong>Status:</strong> {event.vehicleStatus}</div>
                                    <div><strong>Sensors:</strong>{' '}
                                        {event.sensors && Object.keys(event.sensors).length > 0 ? (
                                            Object.entries(event.sensors)
                                                .map(([sensorNumber, value]) => {
                                                    if (sensorMap[sensorNumber] === 'FUEL CAPACITY') {
                                                        const liters = convertFuelRawToLiters(Number(value));
                                                        return `${sensorMap[sensorNumber]}: ${liters.toFixed(2)} L`;
                                                    }
                                                    return `${sensorMap[sensorNumber] || sensorNumber}: ${value}`;
                                                })
                                                .join(', ')
                                        ) : (
                                            '-'
                                        )}
                                    </div>
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            {/* TOTALS */}
            {timeline?.totals && (
                <div style={{ marginTop: 30 }}>
                    <h3>สรุปประจำวัน</h3>
                    <p>ระยะทางรวม: {timeline.totals.totalDistance} km</p>
                    <p>เวลาขับ: {timeline.totals.drivingTime}</p>
                    <p>เวลาจอด: {timeline.totals.stopTime}</p>
                    <p>การใช้น้ำมัน: {timeline.totals.totalFuelUsed} L</p>
                    <p>อัตราสิ้นเปลือง: {timeline.totals.totalFuelEconomy} km/L</p>
                </div>
            )}
        </div>
    );
};

export default VehicleView;
