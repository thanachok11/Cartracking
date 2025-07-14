import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
    GoogleMap,
    Marker,
    InfoWindow,
    useJsApiLoader,
    DirectionsRenderer,
} from '@react-google-maps/api';
import axios from 'axios';
import '../styles/pages/MapView.css';
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function formatDate(inputDate: string | undefined) {
    if (!inputDate) return '-';
    const d = new Date(inputDate);
    return d.toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'medium',
    });
}

function convertFuelRawToLiters(rawValue: number) {
    return rawValue * 0.4;
}

const VehicleView = () => {
    const { id } = useParams<{ id: string }>();
    const query = useQuery();
    const date = query.get('date');

    const [timeline, setTimeline] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [eventAddresses, setEventAddresses] = useState<Record<number, string>>({});
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

    const hasFetchedTimeline = useRef(false);
    const hasFetchedAddresses = useRef(false);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'],
    });

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
            const events = timeline.events.slice(-10);

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

    // สร้างเส้นทางการขับขี่จาก trip ล่าสุด
    useEffect(() => {
        if (!timeline?.timeline || timeline.timeline.length === 0 || !isLoaded) return;

        const lastTrip = timeline.timeline[timeline.timeline.length - 1];
        const startLat = parseFloat(lastTrip.trip_start_valid_latitude);
        const startLng = parseFloat(lastTrip.trip_start_valid_longitude);
        const endLat = parseFloat(lastTrip.trip_end_valid_latitude);
        const endLng = parseFloat(lastTrip.trip_end_valid_longitude);

        if (
            isNaN(startLat) ||
            isNaN(startLng) ||
            isNaN(endLat) ||
            isNaN(endLng)
        ) {
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: startLat, lng: startLng },
                destination: { lat: endLat, lng: endLng },
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirectionsResponse(result);
                } else {
                    console.error(`Directions request failed due to ${status}`);
                }
            }
        );
    }, [timeline?.timeline, isLoaded]);

    const sensorMap =
        timeline?.sensorByNumber?.reduce((acc: Record<string, string>, sensor: any) => {
            acc[sensor.sensorNumber] = sensor.name;
            return acc;
        }, {}) || {};

    const lastPos = timeline?.lastPosition;
    const lat = lastPos?.lat;
    const lng = lastPos?.lng;

    return (
        <div className="vehicle-container">
            <h2 className="vehicle-header">Timeline ของรถ {id}</h2>
            <p className="vehicle-date">วันที่: {date}</p>

            {error && <p className="vehicle-error">{error}</p>}
            {loading && <p className="vehicle-loading">กำลังโหลดข้อมูล...</p>}

            {isLoaded && timeline && lat && lng && (
                <GoogleMap
                    center={{ lat, lng }}
                    zoom={14}
                    mapContainerClassName="vehicle-map"
                >
                    <Marker position={{ lat, lng }} />
                    {directionsResponse && (
                        <DirectionsRenderer directions={directionsResponse} />
                    )}
                </GoogleMap>
            )}

            {timeline?.events && timeline.events.length > 0 && (
                <div className="event-list">
                    <h3>Events (แสดงล่าสุด {Math.min(10, timeline.events.length)} เหตุการณ์)</h3>
                    <ul>
                        {timeline.events.slice(-10).map((event: any, idx: number) => (
                            <li key={idx} className="event-item">
                                <div><strong>เวลา:</strong> {formatDate(event.date)}</div>
                                <div><strong>ตำแหน่ง:</strong> {eventAddresses[idx] ?? '-'}</div>
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
        </div>

    );
};

export default VehicleView;
