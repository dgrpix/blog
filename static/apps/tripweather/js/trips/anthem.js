/* Anthem of the Seas — Sydney ↔ New Zealand, March–April 2026 */
const TRIP_CONFIG = {
    shipName:  'Anthem of the Seas',
    subtitle:  'Royal Caribbean &middot; Sydney &harr; New Zealand',
    dateRange: 'March 21 \u2013 April 6, 2026',
    nights:    16,
    itinerary: [
        { day: 0,  date: '2026-03-21', location: 'Sydney, Australia',               short: 'Sydney',         lat: -33.8688, lon: 151.2093, arrival: '7:25 AM',  departure: null,      type: 'hotel', flight: 'QF12', note: 'Marriott Circular Quay' },
        { day: 1,  date: '2026-03-22', location: 'Sydney, Australia',               short: 'Sydney',         lat: -33.8688, lon: 151.2093, arrival: null,       departure: '5:00 PM', type: 'port' },
        { day: 2,  date: '2026-03-23', location: 'At Sea \u2014 Tasman Sea',        short: 'Tasman Sea',     lat: -33.00,   lon: 157.50,   arrival: null,       departure: null,      type: 'sea'  },
        { day: 3,  date: '2026-03-24', location: 'At Sea \u2014 Crossing to NZ',    short: 'Tasman Sea',     lat: -33.50,   lon: 165.00,   arrival: null,       departure: null,      type: 'sea'  },
        { day: 4,  date: '2026-03-25', location: 'Bay of Islands, New Zealand',     short: 'Bay of Islands', lat: -35.2627, lon: 174.0900, arrival: '9:30 AM',  departure: '6:00 PM', type: 'port' },
        { day: 5,  date: '2026-03-26', location: 'At Sea \u2014 Tauranga Skipped',    short: 'Tasman Sea',     lat: -37.50,   lon: 175.50,   arrival: null,       departure: null,      type: 'sea'  },
        { day: 6,  date: '2026-03-27', location: 'Napier, New Zealand',             short: 'Napier',         lat: -39.4928, lon: 176.9120, arrival: '10:00 AM', departure: '7:00 PM', type: 'port' },
        { day: 7,  date: '2026-03-28', location: 'Wellington, New Zealand',         short: 'Wellington',     lat: -41.2865, lon: 174.7762, arrival: '9:00 AM',  departure: null,      type: 'port' },
        { day: 8,  date: '2026-03-29', location: 'Wellington, New Zealand',         short: 'Wellington',     lat: -41.2865, lon: 174.7762, arrival: null,       departure: '6:00 PM', type: 'port' },
        { day: 9,  date: '2026-03-30', location: 'Christchurch (Lyttelton), NZ',   short: 'Christchurch',   lat: -43.6032, lon: 172.7194, arrival: '7:30 AM',  departure: '6:00 PM', type: 'port' },
        { day: 10, date: '2026-03-31', location: 'Picton, New Zealand',             short: 'Picton',         lat: -41.2966, lon: 174.0036, arrival: '8:00 AM',  departure: '5:00 PM', type: 'port' },
        { day: 11, date: '2026-04-01', location: 'At Sea \u2014 Heading North',     short: 'Tasman Sea',     lat: -38.00,   lon: 168.00,   arrival: null,       departure: null,      type: 'sea'  },
        { day: 12, date: '2026-04-02', location: 'At Sea \u2014 Approaching Sydney',short: 'Tasman Sea',     lat: -35.00,   lon: 158.00,   arrival: null,       departure: null,      type: 'sea'  },
        { day: 13, date: '2026-04-03', location: 'Sydney, Australia',               short: 'Sydney',         lat: -33.8688, lon: 151.2093, arrival: '6:30 AM',  departure: null,      type: 'hotel', note: 'Marriott Circular Quay' },
        { day: 14, date: '2026-04-04', location: 'Sydney, Australia',               short: 'Sydney',         lat: -33.8688, lon: 151.2093, arrival: null,       departure: null,      type: 'hotel', note: 'Marriott Circular Quay' },
        { day: 15, date: '2026-04-05', location: 'Sydney, Australia',               short: 'Sydney',         lat: -33.8688, lon: 151.2093, arrival: null,       departure: null,      type: 'hotel', note: 'Marriott Circular Quay' },
        { day: 16, date: '2026-04-06', location: 'Sydney, Australia',               short: 'Sydney',         lat: -33.8688, lon: 151.2093, arrival: null,       departure: '5:25 PM', type: 'travel', flight: 'QF11', note: 'Marriott Circular Quay' }
    ]
};
