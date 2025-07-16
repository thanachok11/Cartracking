// GoogleMapsProvider.tsx
import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'], // กำหนด libraries แค่ชุดเดียวในโปรเจกต์
    });

    return (
        <GoogleMapsContext.Provider value={{ isLoaded }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export const useGoogleMaps = () => useContext(GoogleMapsContext);
