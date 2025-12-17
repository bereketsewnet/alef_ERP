import { GoogleMap, useJsApiLoader, CircleF, MarkerF } from '@react-google-maps/api'
import { memo, useMemo } from 'react'
import { Spinner } from './ui/Spinner'

interface MapPreviewProps {
    siteLatitude: number
    siteLongitude: number
    siteRadius: number
    userLatitude?: number
    userLongitude?: number
    className?: string
}

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
}

function MapPreviewComponent({
    siteLatitude,
    siteLongitude,
    siteRadius,
    userLatitude,
    userLongitude,
    className,
}: MapPreviewProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
    })

    // Ensure numeric values
    const safeSiteLat = Number(siteLatitude) || 0
    const safeSiteLng = Number(siteLongitude) || 0
    const safeRadius = Number(siteRadius) || 100

    const safeUserLat = userLatitude ? Number(userLatitude) : null
    const safeUserLng = userLongitude ? Number(userLongitude) : null

    const center = useMemo(() => ({
        lat: safeSiteLat,
        lng: safeSiteLng,
    }), [safeSiteLat, safeSiteLng])

    const siteOptions = useMemo(() => ({
        strokeColor: '#0B3D91',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0B3D91',
        fillOpacity: 0.1,
        clickable: false,
        draggable: false,
        editable: false,
        visible: true,
        radius: safeRadius,
        zIndex: 1,
    }), [safeRadius])

    if (!isLoaded) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
                <Spinner />
            </div>
        )
    }

    if (!import.meta.env.VITE_GOOGLE_API_KEY) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-red-500 text-center p-4 ${className}`}>
                <p>Missing Google Maps API Key</p>
            </div>
        )
    }

    // Safety check for valid coordinates
    if (safeSiteLat === 0 && safeSiteLng === 0) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-500 text-center p-4 ${className}`}>
                <p>Invalid Site Coordinates</p>
            </div>
        )
    }

    return (
        <div className={className}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={18}
                options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {/* Site Marker */}
                <MarkerF position={center} />

                {/* Geofence Radius */}
                <CircleF center={center} options={siteOptions} />

                {/* User Position */}
                {safeUserLat !== null && safeUserLng !== null && (
                    <MarkerF
                        position={{ lat: safeUserLat, lng: safeUserLng }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 7,
                            fillColor: '#0FA3A3',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2,
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    )
}

export const MapPreview = memo(MapPreviewComponent)
