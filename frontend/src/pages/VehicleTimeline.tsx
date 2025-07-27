// VehicleTimeline.tsx
import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
    GoogleMap,
    Marker,
    InfoWindow,
    useJsApiLoader,
    DirectionsRenderer,
} from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

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

function filterEventsLast4Hours(events: any[]): any[] {
    if (!events || events.length === 0) return [];
    
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000)); // 4 hours ago
    
    return events
        .filter(event => {
            if (!event.date) return false;
            const eventDate = new Date(event.date);
            return eventDate >= fourHoursAgo && eventDate <= now;
        })
        .sort((a, b) => {
            // Sort by date descending (newest first)
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
}

function getTimeRangeText(): string {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    
    const formatTime = (date: Date) => date.toLocaleString('th-TH', {
        timeStyle: 'short',
        dateStyle: 'short'
    });
    
    return `${formatTime(fourHoursAgo)} - ${formatTime(now)}`;
}

function getPositionFromEvent(event: any): string {
    const lat = event.lat || event.coords?.lat;
    const lon = event.lng || event.coords?.lng;
    
    // Debug: log event structure to understand available fields
    console.log('Event structure:', event);
    
    // Check if there's a position description from API
    if (event.position_description?.principal?.description) {
        return event.position_description.principal.description;
    }
    
    // Check if there's address info in the event
    if (event.address) {
        return event.address;
    }
    
    // Check if there's location info in the event
    if (event.location) {
        return event.location;
    }
    
    // Check if there's any description field
    if (event.description) {
        return event.description;
    }
    
    // Check for other possible location fields
    if (event.locationName) {
        return event.locationName;
    }
    
    if (event.place) {
        return event.place;
    }
    
    // Fall back to coordinates if available
    if (lat && lon) {
        return `${lat}, ${lon}`;
    }
    
    return 'ไม่มีข้อมูลตำแหน่ง';
}

const VehicleView = () => {
    const { id } = useParams<{ id: string }>();
    const query = useQuery();
    const date = query.get('date');

    const [timeline, setTimeline] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);

    const hasFetchedTimeline = useRef(false);

    const { isLoaded } = useGoogleMaps();


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

    // Update filtered events whenever timeline changes
    useEffect(() => {
        if (timeline?.events) {
            const filtered = filterEventsLast4Hours(timeline.events);
            setFilteredEvents(filtered);
        } else {
            setFilteredEvents([]);
        }
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

    // Get the latest event position for map marker
    const getLatestEventPosition = () => {
        if (filteredEvents && filteredEvents.length > 0) {
            const latestEvent = filteredEvents[0]; // First event is the latest due to sorting
            const lat = latestEvent.lat || latestEvent.coords?.lat;
            const lng = latestEvent.lng || latestEvent.coords?.lng;
            
            if (lat && lng) {
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            }
        }
        
        // Fallback to last position from API
        const lastPos = timeline?.lastPosition;
        if (lastPos?.lat && lastPos?.lng) {
            return { lat: lastPos.lat, lng: lastPos.lng };
        }
        
        return null;
    };

    const mapPosition = getLatestEventPosition();

    return (
        <div className="vehicle-container">
            <h2 className="vehicle-header">Timeline ของรถ {id}</h2>
            <p className="vehicle-date">วันที่: {date}</p>

            {error && <p className="vehicle-error">{error}</p>}
            {loading && <p className="vehicle-loading">กำลังโหลดข้อมูล...</p>}

            {isLoaded && timeline && mapPosition && (
                <GoogleMap
                    center={mapPosition}
                    zoom={14}
                    mapContainerClassName="vehicle-map"
                >
                    <Marker 
                        position={mapPosition}
                        title="ตำแหน่งล่าสุด"
                    />
                    {directionsResponse && (
                        <DirectionsRenderer directions={directionsResponse} />
                    )}
                </GoogleMap>
            )}

            {timeline?.events && timeline.events.length > 0 && (
                <div className="event-list">
                    <h3>Events (แสดงข้อมูลย้อนหลัง 4 ชั่วโมง - {filteredEvents.length} เหตุการณ์) - เรียงจากล่าสุด</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        ช่วงเวลา: {getTimeRangeText()}
                    </p>
                    {filteredEvents.length === 0 ? (
                        <p>ไม่มีเหตุการณ์ในช่วง 4 ชั่วโมงที่ผ่านมา</p>
                    ) : (
                        <>
                            {filteredEvents.length > 5 && (
                                <p className="scroll-hint">
                                    💡 เลื่อนลงเพื่อดูเหตุการณ์เพิ่มเติม
                                </p>
                            )}
                            <ul>
                                {filteredEvents.map((event: any, idx: number) => {
                                    const lat = event.lat || event.coords?.lat;
                                    const lon = event.lng || event.coords?.lng;

                                    return (
                                    <li key={`${event.date}-${lat}-${lon}-${idx}`} className="event-item">
                                        <div><strong>เวลา:</strong> {formatDate(event.date)}</div>
                                        <div><strong>ตำแหน่ง:</strong> {getPositionFromEvent(event)}</div>
                                        <div><strong>Odometer:</strong> {event.odometer ?? '-'}</div>
                                        <div><strong>Status:</strong> {event.vehicleStatus}</div>
                                        <div><strong>Sensors:</strong>{' '}
                                            {event.sensors && Object.keys(event.sensors).length > 0 ? (
                                                Object.entries(event.sensors)
                                                    .map(([sensorNumber, value]) => {
                                                        const sensorName = sensorMap[sensorNumber] || sensorNumber;
                                                        
                                                        // Add units based on sensor type
                                                        if (sensorName === 'FUEL CAPACITY') {
                                                            const liters = convertFuelRawToLiters(Number(value));
                                                            return `${sensorName}: ${liters.toFixed(2)} L`;
                                                        } else if (sensorName.toLowerCase().includes('temp') || sensorName.toLowerCase().includes('temperature')) {
                                                            return `${sensorName}: ${value} °C`;
                                                        } else if (sensorName.toLowerCase().includes('speed')) {
                                                            return `${sensorName}: ${value} km/h`;
                                                        } else if (sensorName.toLowerCase().includes('voltage') || sensorName.toLowerCase().includes('volt')) {
                                                            return `${sensorName}: ${value} V`;
                                                        } else if (sensorName.toLowerCase().includes('current') || sensorName.toLowerCase().includes('amp')) {
                                                            return `${sensorName}: ${value} A`;
                                                        } else if (sensorName.toLowerCase().includes('pressure')) {
                                                            return `${sensorName}: ${value} bar`;
                                                        } else if (sensorName.toLowerCase().includes('distance') || sensorName.toLowerCase().includes('odometer')) {
                                                            return `${sensorName}: ${value} km`;
                                                        } else if (sensorName.toLowerCase().includes('rpm')) {
                                                            return `${sensorName}: ${value} RPM`;
                                                        } else if (sensorName.toLowerCase().includes('percent') || sensorName.toLowerCase().includes('%')) {
                                                            return `${sensorName}: ${value}%`;
                                                        } else if (sensorName.toLowerCase().includes('battery')) {
                                                            return `${sensorName}: ${value}%`;
                                                        } else if (sensorName.toLowerCase().includes('power') || sensorName.toLowerCase().includes('watt')) {
                                                            return `${sensorName}: ${value} W`;
                                                        } else if (sensorName.toLowerCase().includes('frequency') || sensorName.toLowerCase().includes('hz')) {
                                                            return `${sensorName}: ${value} Hz`;
                                                        } else if (sensorName.toLowerCase().includes('weight') || sensorName.toLowerCase().includes('mass')) {
                                                            return `${sensorName}: ${value} kg`;
                                                        } else if (sensorName.toLowerCase().includes('time') || sensorName.toLowerCase().includes('duration')) {
                                                            return `${sensorName}: ${value} s`;
                                                        } else {
                                                            return `${sensorName}: ${value}`;
                                                        }
                                                    })
                                                    .join(', ')
                                            ) : (
                                                '-'
                                            )}
                                        </div>                            
                                    </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>

    );
};

export default VehicleView;
