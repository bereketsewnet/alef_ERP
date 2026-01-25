import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useRef } from "react"
import { useReportDashboard } from "@/services/useReports"
import { Loader2 } from "lucide-react"

declare global {
    interface Window {
        google: any
        initMap: () => void
    }
}

export function LiveMap() {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const { data: dashboardData, isLoading } = useReportDashboard()

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY

        if (!apiKey) {
            console.warn('Google Maps API key not found in VITE_GOOGLE_API_KEY')
            return
        }

        // Check if script is already in the DOM
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
        
        // Load Google Maps script if not already loaded
        if (!window.google && !existingScript) {
            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
            script.async = true
            script.defer = true
            script.id = 'google-maps-script'
            script.onerror = () => {
                console.error('Failed to load Google Maps script')
            }
            document.head.appendChild(script)

            script.onload = () => {
                initializeMap()
            }
        } else if (window.google) {
            // Script already loaded, just initialize map
            initializeMap()
        } else if (existingScript) {
            // Script is loading, wait for it
            existingScript.addEventListener('load', initializeMap)
        }

        function initializeMap() {
            if (!mapRef.current || !window.google) return

            // Initialize map centered on Ethiopia (Addis Ababa)
            const defaultCenter = { lat: 9.1450, lng: 38.7617 }

            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center: defaultCenter,
                zoom: 6,
                mapTypeControl: true,
                streetViewControl: false,
            })

            updateMarkers()
        }

        function updateMarkers() {
            if (!mapInstanceRef.current || !window.google || !dashboardData?.active_clock_ins) return

            // Clear existing markers
            markersRef.current.forEach(marker => marker.setMap(null))
            markersRef.current = []

            const clockIns = dashboardData.active_clock_ins.filter(
                (clockIn) => clockIn.latitude && clockIn.longitude
            )

            if (clockIns.length === 0) {
                // Center on default location if no active clock-ins
                mapInstanceRef.current.setCenter({ lat: 9.1450, lng: 38.7617 })
                mapInstanceRef.current.setZoom(6)
                return
            }

            // Create markers for each active clock-in
            const bounds = new window.google.maps.LatLngBounds()

            clockIns.forEach((clockIn) => {
                const position = {
                    lat: clockIn.latitude!,
                    lng: clockIn.longitude!,
                }

                const marker = new window.google.maps.Marker({
                    position,
                    map: mapInstanceRef.current,
                    title: `${clockIn.employee_name} - ${clockIn.site_name}`,
                })

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px;">
                            <strong>${clockIn.employee_name}</strong><br/>
                            <small>${clockIn.site_name}</small><br/>
                            <small>Clocked in: ${new Date(clockIn.clock_in_time).toLocaleString()}</small>
                        </div>
                    `,
                })

                marker.addListener('click', () => {
                    infoWindow.open(mapInstanceRef.current, marker)
                })

                markersRef.current.push(marker)
                bounds.extend(position)
            })

            // Fit map to show all markers
            if (clockIns.length > 1) {
                mapInstanceRef.current.fitBounds(bounds)
            } else if (clockIns.length === 1) {
                mapInstanceRef.current.setCenter({
                    lat: clockIns[0].latitude!,
                    lng: clockIns[0].longitude!,
                })
                mapInstanceRef.current.setZoom(15)
            }
        }

        // Update markers when data changes
        if (window.google && mapInstanceRef.current) {
            updateMarkers()
        }

        return () => {
            // Cleanup markers on unmount
            markersRef.current.forEach(marker => marker.setMap(null))
            // Remove event listener if script was loading
            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
            if (existingScript) {
                existingScript.removeEventListener('load', initializeMap)
            }
        }
    }, [dashboardData?.active_clock_ins])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Live Map</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                    </div>
                ) : !import.meta.env.VITE_GOOGLE_API_KEY ? (
                    <div className="h-[400px] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-neutral-600 mb-2">Google Maps API Key Required</p>
                            <p className="text-sm text-neutral-500">
                                Please set VITE_GOOGLE_API_KEY in your .env file
                            </p>
                        </div>
                    </div>
                ) : (
                    <div ref={mapRef} className="h-[400px] w-full rounded-lg border border-neutral-200" />
                )}
            </CardContent>
        </Card>
    )
}

