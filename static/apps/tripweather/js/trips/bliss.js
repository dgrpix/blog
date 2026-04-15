/* Norwegian Bliss — Mexican Riviera + Dana Point, March 2026 */
const TRIP_CONFIG = {
    shipName:  'Norwegian Bliss',
    subtitle:  'Norwegian Cruise Line &middot; Mexican Riviera',
    dateRange: 'March 1 \u2013 11, 2026',
    nights:    10,
    itinerary: [
        { day: 1,  date: '2026-03-01', location: 'Los Angeles (San Pedro), California', short: 'Los Angeles',    lat: 33.7361,  lon: -118.2724, arrival: null,        departure: '4:00 PM', type: 'port'  },
        { day: 2,  date: '2026-03-02', location: 'At Sea \u2014 Pacific Ocean',         short: 'At Sea',         lat: 25.00,    lon: -112.00,   arrival: null,        departure: null,      type: 'sea'   },
        { day: 3,  date: '2026-03-03', location: 'At Sea \u2014 Approaching Mexico',    short: 'At Sea',         lat: 22.00,    lon: -107.00,   arrival: null,        departure: null,      type: 'sea'   },
        { day: 4,  date: '2026-03-04', location: 'Puerto Vallarta, Mexico',             short: 'Puerto Vallarta',lat: 20.6534,  lon: -105.2253, arrival: '7:00 AM',   departure: '6:00 PM', type: 'port'  },
        { day: 5,  date: '2026-03-05', location: 'Mazatl\u00e1n, Mexico',              short: 'Mazatl\u00e1n',  lat: 23.2494,  lon: -106.4111, arrival: '8:00 AM',   departure: '6:00 PM', type: 'port'  },
        { day: 6,  date: '2026-03-06', location: 'Cabo San Lucas, Mexico',             short: 'Cabo San Lucas', lat: 22.8905,  lon: -109.9167, arrival: '6:30 AM',   departure: '2:00 PM', type: 'port', note: 'Tender port' },
        { day: 7,  date: '2026-03-07', location: 'At Sea \u2014 Heading North',        short: 'At Sea',         lat: 26.00,    lon: -113.00,   arrival: null,        departure: null,      type: 'sea'   },
        { day: 8,  date: '2026-03-08', location: 'Los Angeles (San Pedro), California', short: 'Los Angeles',   lat: 33.7361,  lon: -118.2724, arrival: '7:00 AM',   departure: null,      type: 'port'  },
        { day: 9,  date: '2026-03-09', location: 'Waldorf Astoria Monarch Beach',      short: 'Dana Point',     lat: 33.4720,  lon: -117.7055, arrival: null,        departure: null,      type: 'hotel', note: 'Waldorf Astoria Monarch Beach' },
        { day: 10, date: '2026-03-10', location: 'Waldorf Astoria Monarch Beach',      short: 'Dana Point',     lat: 33.4720,  lon: -117.7055, arrival: null,        departure: null,      type: 'hotel', note: 'Waldorf Astoria Monarch Beach' },
        { day: 11, date: '2026-03-11', location: 'Dana Point \u2014 Travel Home',      short: 'Dana Point',     lat: 33.4720,  lon: -117.7055, arrival: null,        departure: null,      type: 'travel' }
    ]
};
