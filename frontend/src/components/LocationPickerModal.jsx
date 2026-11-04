import React, { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationPickerModal = ({ onSelect, onClose }) => {
    const [selectedLocation, setSelectedLocation] = useState(null);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                console.log('Map clicked at:', e.latlng);
                setSelectedLocation(e.latlng);
            },
        });
        return null;
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            const locationData = {
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                city: `City at ${selectedLocation.lat.toFixed(2)}, ${selectedLocation.lng.toFixed(2)}`,
                pincode: '123456'
            };
            onSelect(locationData);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-3xl">
                <h2 className="text-2xl font-bold mb-4">Select a Location</h2>
                <div style={{ height: '500px', width: '100%' }}>
                    <MapContainer center={[28.6139, 77.2090]} zoom={5} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapEvents />
                    </MapContainer>
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={!selectedLocation}>
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPickerModal;