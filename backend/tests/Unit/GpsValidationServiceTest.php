<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\GpsValidationService;
use App\Models\ClientSite;
use App\Models\Client;

class GpsValidationServiceTest extends TestCase
{
    private GpsValidationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GpsValidationService();
    }

    public function test_haversine_distance_calculation()
    {
        // Addis Ababa to Bole (approximately 8km)
        $lat1 = 9.0054;
        $lon1 = 38.7636;
        $lat2 = 8.9806;
        $lon2 = 38.8;

        $distance = $this->service->calculateHaversineDistance($lat1, $lon1, $lat2, $lon2);

        // Distance should be around 7000-8000 meters
        $this->assertGreaterThan(7000, $distance);
        $this->assertLessThan(9000, $distance);
    }

    public function test_within_radius_returns_true_when_inside()
    {
        $client = Client::factory()->create();
        $site = ClientSite::factory()->create([
            'client_id' => $client->id,
            'latitude' => 9.0054,
            'longitude' => 38.7636,
            'geo_radius_meters' => 100,
        ]);

        // Very close coordinates (same location)
        $result = $this->service->isWithinRadius(9.0054, 38.7636, $site);

        $this->assertTrue($result['withinRadius']);
        $this->assertLessThan(100, $result['distanceMeters']);
    }

    public function test_within_radius_returns_false_when_outside()
    {
        $client = Client::factory()->create();
        $site = ClientSite::factory()->create([
            'client_id' => $client->id,
            'latitude' => 9.0054,
            'longitude' => 38.7636,
            'geo_radius_meters' => 100,
        ]);

        // Far away coordinates (about 3km away)
        $result = $this->service->isWithinRadius(9.0354, 38.7836, $site);

        $this->assertFalse($result['withinRadius']);
        $this->assertGreaterThan(100, $result['distanceMeters']);
    }
}
