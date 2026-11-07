import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet'

import L from 'leaflet'

import './LocationPicker.css'

interface LocationPickerProps {
  coordinates: [number, number]
  onLocationSelect: (coordinates: [number, number]) => void
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (coordinates: [number, number]) => void
}) {
  useMapEvents({
    click(event) {
      onLocationSelect([
        event.latlng.lat,
        event.latlng.lng,
      ])
    },
  })

  return null
}

const selectedIcon = L.divIcon({
  className: 'selected-location-wrapper',
  html: '<div class="selected-location-marker"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function LocationPicker({
  coordinates,
  onLocationSelect,
}: LocationPickerProps) {
  return (
    <div className="location-picker">
      <p className="location-picker-hint">
        Tap the map to select where the incident happened.
      </p>

      <MapContainer
        center={coordinates}
        zoom={16}
        scrollWheelZoom={false}
        className="location-picker-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onLocationSelect={onLocationSelect}
        />

        <Marker
          position={coordinates}
          icon={selectedIcon}
        />
      </MapContainer>
    </div>
  )
}

export default LocationPicker

