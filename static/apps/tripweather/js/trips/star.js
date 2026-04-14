/* Star of the Seas — Eastern Caribbean, April 2026 (full trip) */
const TRIP_CONFIG = {
    shipName:  'Star of the Seas',
    subtitle:  'Royal Caribbean &middot; Eastern Caribbean',
    dateRange: 'April 17 \u2013 30, 2026',
    nights:    13,
    itinerary: [
        { day: 1,  date: '2026-04-17', location: 'Tampa, Florida',                   short: 'Tampa',          lat: 27.9755,  lon: -82.4301,  arrival: '10:00 PM',  departure: null,      type: 'hotel', flight: 'AS432' },
        { day: 2,  date: '2026-04-18', location: 'Tampa, Florida',                   short: 'Tampa',          lat: 27.9755,  lon: -82.4301,  arrival: null,        departure: null,      type: 'hotel', note: 'Foreigner concert' },
        { day: 3,  date: '2026-04-19', location: 'Orlando (Port Canaveral), Florida', short: 'Port Canaveral', lat: 28.4158,  lon: -80.5935,  arrival: null,        departure: '4:30 PM', type: 'port'  },
        { day: 4,  date: '2026-04-20', location: 'Perfect Day at CocoCay, Bahamas',  short: 'CocoCay',        lat: 25.8267,  lon: -77.7417,  arrival: '7:00 AM',   departure: '4:00 PM', type: 'port'  },
        { day: 5,  date: '2026-04-21', location: 'At Sea',                           short: 'At Sea',         lat: 22.00,    lon: -71.00,    arrival: null,        departure: null,      type: 'sea'   },
        { day: 6,  date: '2026-04-22', location: 'Charlotte Amalie, St. Thomas',     short: 'St. Thomas',     lat: 18.3419,  lon: -64.9307,  arrival: '12:30 PM',  departure: '8:00 PM', type: 'port'  },
        { day: 7,  date: '2026-04-23', location: 'Philipsburg, St. Maarten',         short: 'St. Maarten',    lat: 18.0235,  lon: -63.0519,  arrival: '8:00 AM',   departure: '5:00 PM', type: 'port'  },
        { day: 8,  date: '2026-04-24', location: 'At Sea',                           short: 'At Sea',         lat: 22.00,    lon: -68.00,    arrival: null,        departure: null,      type: 'sea'   },
        { day: 9,  date: '2026-04-25', location: 'At Sea',                           short: 'At Sea',         lat: 25.50,    lon: -74.00,    arrival: null,        departure: null,      type: 'sea'   },
        { day: 10, date: '2026-04-26', location: 'Orlando (Port Canaveral), Florida', short: 'Port Canaveral', lat: 28.4158,  lon: -80.5935,  arrival: '6:00 AM',   departure: null,      type: 'port'  },
        { day: 11, date: '2026-04-27', location: "Disney's Pop Century Resort",       short: 'Disney World',   lat: 28.3544,  lon: -81.5481,  arrival: null,        departure: null,      type: 'hotel', note: 'Dinner: Todd English\u2019s Bluezoo 7:15 PM' },
        { day: 12, date: '2026-04-28', location: "Disney's Pop Century Resort",       short: 'Disney World',   lat: 28.3544,  lon: -81.5481,  arrival: null,        departure: null,      type: 'hotel' },
        { day: 13, date: '2026-04-29', location: "Disney's Pop Century Resort",       short: 'Disney World',   lat: 28.3544,  lon: -81.5481,  arrival: null,        departure: null,      type: 'hotel' },
        { day: 14, date: '2026-04-30', location: 'Orlando (MCO)',                     short: 'Orlando',        lat: 28.4312,  lon: -81.3081,  arrival: null,        departure: '7:00 PM', type: 'travel', flight: 'AS397' }
    ]
};
