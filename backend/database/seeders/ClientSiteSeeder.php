<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;
use App\Models\ClientSite;
use App\Models\Job;

class ClientSiteSeeder extends Seeder
{
    public function run(): void
    {
        $ecb = Client::where('company_name', 'Ethiopian Commercial Bank')->first();
        $hilton = Client::where('company_name', 'Hilton Addis Ababa')->first();
        $dangote = Client::where('company_name', 'Dangote Cement Factory')->first();
        $sheraton = Client::where('company_name', 'Sheraton Addis')->first();
        $airport = Client::where('company_name', 'Bole International Airport')->first();

        $sites = [];

        if ($ecb) {
            $sites = array_merge($sites, [
                [
                    'client_id' => $ecb->id,
                    'site_name' => 'ECB Main Branch - Arada',
                    'latitude' => 9.0300,
                    'longitude' => 38.7500,
                    'geo_radius_meters' => 100,
                    'site_contact_phone' => '+251911234567',
                ],
                [
                    'client_id' => $ecb->id,
                    'site_name' => 'ECB Branch - Bole',
                    'latitude' => 8.9800,
                    'longitude' => 38.7800,
                    'geo_radius_meters' => 100,
                    'site_contact_phone' => '+251911234568',
                ],
            ]);
        }

        if ($hilton) {
            $sites = array_merge($sites, [
                [
                    'client_id' => $hilton->id,
                    'site_name' => 'Hilton Hotel - Main Building',
                    'latitude' => 9.0200,
                    'longitude' => 38.7600,
                    'geo_radius_meters' => 150,
                    'site_contact_phone' => '+251922345678',
                ],
                [
                    'client_id' => $hilton->id,
                    'site_name' => 'Hilton Hotel - Parking Area',
                    'latitude' => 9.0210,
                    'longitude' => 38.7610,
                    'geo_radius_meters' => 200,
                    'site_contact_phone' => '+251922345679',
                ],
            ]);
        }

        if ($dangote) {
            $sites = array_merge($sites, [
                [
                    'client_id' => $dangote->id,
                    'site_name' => 'Dangote Factory - Main Gate',
                    'latitude' => 8.8500,
                    'longitude' => 38.9000,
                    'geo_radius_meters' => 200,
                    'site_contact_phone' => '+251933456789',
                ],
                [
                    'client_id' => $dangote->id,
                    'site_name' => 'Dangote Factory - Warehouse',
                    'latitude' => 8.8510,
                    'longitude' => 38.9010,
                    'geo_radius_meters' => 150,
                    'site_contact_phone' => '+251933456790',
                ],
            ]);
        }

        if ($sheraton) {
            $sites = array_merge($sites, [
                [
                    'client_id' => $sheraton->id,
                    'site_name' => 'Sheraton Hotel - Main Entrance',
                    'latitude' => 9.0100,
                    'longitude' => 38.7700,
                    'geo_radius_meters' => 100,
                    'site_contact_phone' => '+251944567890',
                ],
            ]);
        }

        if ($airport) {
            $sites = array_merge($sites, [
                [
                    'client_id' => $airport->id,
                    'site_name' => 'Bole Airport - Terminal 1',
                    'latitude' => 8.9770,
                    'longitude' => 38.7990,
                    'geo_radius_meters' => 300,
                    'site_contact_phone' => '+251955678901',
                ],
                [
                    'client_id' => $airport->id,
                    'site_name' => 'Bole Airport - Terminal 2',
                    'latitude' => 8.9780,
                    'longitude' => 38.8000,
                    'geo_radius_meters' => 300,
                    'site_contact_phone' => '+251955678902',
                ],
            ]);
        }

        $createdSites = [];
        foreach ($sites as $site) {
            $createdSite = ClientSite::firstOrCreate(
                [
                    'client_id' => $site['client_id'],
                    'site_name' => $site['site_name'],
                ],
                $site
            );
            $createdSites[] = $createdSite;
        }

        // Assign jobs to sites
        $dayShiftGuard = Job::where('job_name', 'Day Shift Security Guard')->first();
        $nightShiftGuard = Job::where('job_name', 'Night Shift Security Guard')->first();
        $cleaner = Job::where('job_name', 'Office Cleaner')->first();

        foreach ($createdSites as $site) {
            // Assign security guards to all sites
            if ($dayShiftGuard) {
                $site->requiredJobs()->syncWithoutDetaching([
                    $dayShiftGuard->id => ['positions_needed' => 2]
                ]);
            }
            if ($nightShiftGuard) {
                $site->requiredJobs()->syncWithoutDetaching([
                    $nightShiftGuard->id => ['positions_needed' => 2]
                ]);
            }
            
            // Assign cleaners to hotel and office sites
            if ($cleaner && (str_contains($site->site_name, 'Hotel') || str_contains($site->site_name, 'ECB') || str_contains($site->site_name, 'Airport'))) {
                $site->requiredJobs()->syncWithoutDetaching([
                    $cleaner->id => ['positions_needed' => 1]
                ]);
            }
        }

        echo "Created " . count($createdSites) . " client sites.\n";
    }
}

