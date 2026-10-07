/* Sapphire Princess — Canada & New England, Boston → Québec City, October 2026 */
const TRIP_CONFIG = {
    shipName:  'Sapphire Princess',
    subtitle:  'Princess &middot; Boston &rarr; Canada &amp; New England &rarr; Qu&eacute;bec City',
    dateRange: 'October 11 – 25, 2026',
    nights:    14,
    itinerary: [
        { day: 1,  date: '2026-10-11', location: 'Boston, Massachusetts',            short: 'Boston',        lat: 42.3601, lon: -71.0589, arrival: '8:00 PM',  departure: null,      type: 'travel', flight: 'UA 489 / UA 597', note: 'SNA → Denver → Boston; Renaissance Boston Seaport District' },
        { day: 2,  date: '2026-10-12', location: 'Boston, Massachusetts',            short: 'Boston',        lat: 42.3601, lon: -71.0589, arrival: null,       departure: null,      type: 'hotel'  },
        { day: 3,  date: '2026-10-13', location: 'Boston, Massachusetts',            short: 'Boston',        lat: 42.3601, lon: -71.0589, arrival: null,       departure: '4:00 PM', type: 'port',   note: 'Embark Sapphire Princess' },
        { day: 4,  date: '2026-10-14', location: 'Portland, Maine',                  short: 'Portland ME',   lat: 43.6591, lon: -70.2568, arrival: null,       departure: null,      type: 'port'   },
        { day: 5,  date: '2026-10-15', location: 'Saint John, New Brunswick',        short: 'Saint John',    lat: 45.2733, lon: -66.0633, arrival: '9:00 AM',  departure: '7:00 PM', type: 'port',   note: 'Bay of Fundy — the big tides' },
        { day: 6,  date: '2026-10-16', location: 'At Sea — toward Nova Scotia',  short: 'At Sea',        lat: 44.80,   lon: -64.80,   arrival: null,       departure: null,      type: 'sea'    },
        { day: 7,  date: '2026-10-17', location: 'Halifax, Nova Scotia',             short: 'Halifax',       lat: 44.6488, lon: -63.5752, arrival: '7:00 AM',  departure: '4:00 PM', type: 'port'   },
        { day: 8,  date: '2026-10-18', location: 'Sydney, Nova Scotia',              short: 'Sydney NS',     lat: 46.1368, lon: -60.1942, arrival: '9:00 AM',  departure: '6:00 PM', type: 'port'   },
        { day: 9,  date: '2026-10-19', location: 'Charlottetown, Prince Edward Is.', short: 'Charlottetown', lat: 46.2382, lon: -63.1311, arrival: '8:00 AM',  departure: '5:00 PM', type: 'port'   },
        { day: 10, date: '2026-10-20', location: 'At Sea — Gulf of St. Lawrence', short: 'At Sea',        lat: 48.00,   lon: -65.50,   arrival: null,       departure: null,      type: 'sea'    },
        { day: 11, date: '2026-10-21', location: 'Saguenay (La Baie), Québec',       short: 'Saguenay',      lat: 48.3333, lon: -70.8667, arrival: null,       departure: null,      type: 'port',   note: 'Saguenay Fjord' },
        { day: 12, date: '2026-10-22', location: 'Québec City, Québec',              short: 'Québec City',   lat: 46.8139, lon: -71.2080, arrival: null,       departure: null,      type: 'port',   note: 'Overnight in port' },
        { day: 13, date: '2026-10-23', location: 'Québec City → home',          short: 'Québec City',   lat: 46.8139, lon: -71.2080, arrival: null,       departure: '12:45 PM', type: 'travel', flight: 'UA 3568 / UA 1690', note: 'Disembark 6:00 AM; YQB → Newark → SNA, lands 8:03 PM. JW Marriott Anaheim' },
        { day: 14, date: '2026-10-24', location: 'Anaheim, California',              short: 'Anaheim',       lat: 33.8366, lon: -117.9143, arrival: null,      departure: null,      type: 'hotel'  },
        { day: 15, date: '2026-10-25', location: 'Anaheim, California',              short: 'Anaheim',       lat: 33.8366, lon: -117.9143, arrival: null,      departure: '11:00 AM', type: 'travel', note: 'Check out, drive home to Temecula' }
    ]
};
