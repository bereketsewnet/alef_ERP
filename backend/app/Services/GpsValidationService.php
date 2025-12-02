<?php

namespace App\Services;

use App\Models\ClientSite;

/**
 * GPS Validation Service
 * 
 * Validates if a given GPS coordinate is within the allowed radius of a client site.
 * Uses Haversine formula as fallback since PostGIS is not available.
 */
class GpsValidationService
{
    /**
     * Check if coordinates are within the site's allowed radius
     *
     * @param float $lat Latitude of the point to check
     * @param float $lng Longitude of the point to check
     * @param ClientSite $site The site to check against
     * @return array ['withinRadius' => bool, 'distanceMeters' => float]
     */
    public function isWithinRadius(float $lat, float $lng, ClientSite $site): array
    {
        $distanceMeters = $this->calculateHaversineDistance(
            $lat,
            $lng,
            $site->latitude,
            $site->longitude
        );

        return [
            'withinRadius' => $distanceMeters <= $site->geo_radius_meters,
            'distanceMeters' => $distanceMeters,
        ];
    }

    /**
     * Calculate distance between two points using Haversine formula
     *
     * @param float $lat1 Latitude of first point
     * @param float $lon1 Longitude of first point
     * @param float $lat2 Latitude of second point
     * @param float $lon2 Longitude of second point
     * @return float Distance in meters
     */
    public function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadiusMeters = 6371000; // Earth's radius in meters

        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLatRad = deg2rad($lat2 - $lat1);
        $deltaLonRad = deg2rad($lon2 - $lon1);

        $a = sin($deltaLatRad / 2) * sin($deltaLatRad / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLonRad / 2) * sin($deltaLonRad / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusMeters * $c;
    }
}
