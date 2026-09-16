/* MSC Seashore + Resilient Lady — Caribbean back-to-back, Sept–Oct 2026 */
const TRIP_CONFIG = {
    shipName:  'MSC Seashore + Resilient Lady',
    subtitle:  'MSC &middot; Virgin Voyages &middot; Caribbean Back-to-Back',
    dateRange: 'September 16 – October 5, 2026',
    nights:    19,
    itinerary: [
        { day: 1,  date: '2026-09-16', location: 'Orlando (MCO), Florida',            short: 'Orlando',        lat: 28.4312, lon: -81.3081, arrival: '5:45 PM',  departure: null,      type: 'travel', flight: 'AS396', note: 'Hyatt Regency MCO, in-terminal' },
        { day: 2,  date: '2026-09-17', location: 'Port Canaveral, Florida',           short: 'Port Canaveral', lat: 28.4158, lon: -80.5935, arrival: null,       departure: null,      type: 'port',   note: 'Embark MSC Seashore — stateroom 10024' },
        { day: 3,  date: '2026-09-18', location: 'Nassau, Bahamas',                   short: 'Nassau',         lat: 25.0443, lon: -77.3504, arrival: null,       departure: null,      type: 'port'   },
        { day: 4,  date: '2026-09-19', location: 'Ocean Cay MSC Marine Reserve',      short: 'Ocean Cay',      lat: 25.4167, lon: -79.1333, arrival: null,       departure: null,      type: 'port'   },
        { day: 5,  date: '2026-09-20', location: 'Port Canaveral, Florida',           short: 'Port Canaveral', lat: 28.4158, lon: -80.5935, arrival: null,       departure: null,      type: 'port'   },
        { day: 6,  date: '2026-09-21', location: 'Nassau, Bahamas',                   short: 'Nassau',         lat: 25.0443, lon: -77.3504, arrival: null,       departure: null,      type: 'port'   },
        { day: 7,  date: '2026-09-22', location: 'At Sea — toward Yucatán', short: 'At Sea',         lat: 22.80,   lon: -82.20,   arrival: null,       departure: null,      type: 'sea'    },
        { day: 8,  date: '2026-09-23', location: 'Cozumel, Mexico',                   short: 'Cozumel',        lat: 20.5083, lon: -86.9458, arrival: null,       departure: null,      type: 'port'   },
        { day: 9,  date: '2026-09-24', location: 'Costa Maya, Mexico',                short: 'Costa Maya',     lat: 18.7333, lon: -87.7000, arrival: null,       departure: null,      type: 'port'   },
        { day: 10, date: '2026-09-25', location: 'At Sea — toward the Bahamas',  short: 'At Sea',         lat: 22.10,   lon: -83.40,   arrival: null,       departure: null,      type: 'sea'    },
        { day: 11, date: '2026-09-26', location: 'Ocean Cay MSC Marine Reserve',      short: 'Ocean Cay',      lat: 25.4167, lon: -79.1333, arrival: null,       departure: null,      type: 'port'   },
        { day: 12, date: '2026-09-27', location: 'Port Canaveral → Miami',       short: 'Miami',          lat: 25.7617, lon: -80.1918, arrival: null,       departure: null,      type: 'travel', note: 'Disembark MSC Seashore; overnight AC Hotel Miami Brickell' },
        { day: 13, date: '2026-09-28', location: 'Miami, Florida',                    short: 'Miami',          lat: 25.7617, lon: -80.1918, arrival: null,       departure: null,      type: 'port',   note: 'Embark Virgin Resilient Lady — Dominican Daze' },
        { day: 14, date: '2026-09-29', location: 'At Sea — toward Hispaniola',   short: 'At Sea',         lat: 22.80,   lon: -75.40,   arrival: null,       departure: null,      type: 'sea'    },
        { day: 15, date: '2026-09-30', location: 'Puerto Plata, Dominican Republic',  short: 'Puerto Plata',   lat: 19.7934, lon: -70.6884, arrival: null,       departure: null,      type: 'port'   },
        { day: 16, date: '2026-10-01', location: 'At Sea — toward Bimini',       short: 'At Sea',         lat: 22.80,   lon: -75.00,   arrival: null,       departure: null,      type: 'sea'    },
        { day: 17, date: '2026-10-02', location: 'Bimini Beach Club, Bahamas',        short: 'Bimini',         lat: 25.7333, lon: -79.3000, arrival: null,       departure: null,      type: 'port'   },
        { day: 18, date: '2026-10-03', location: 'Miami → Charlotte',            short: 'Charlotte',      lat: 35.2271, lon: -80.8431, arrival: '6:22 PM',  departure: '3:59 PM', type: 'travel', flight: 'F9 3037', note: 'Disembark Resilient Lady; Charlotte Marriott City Center' },
        { day: 19, date: '2026-10-04', location: 'Charlotte, North Carolina',         short: 'Charlotte',      lat: 35.2271, lon: -80.8431, arrival: null,       departure: null,      type: 'hotel'  },
        { day: 20, date: '2026-10-05', location: 'Charlotte → San Diego',        short: 'Charlotte',      lat: 35.2271, lon: -80.8431, arrival: null,       departure: '4:49 PM', type: 'travel', flight: 'AA 562', note: 'Home — lands SAN 7:00 PM' }
    ]
};
