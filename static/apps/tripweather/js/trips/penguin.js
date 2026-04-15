/* Silver Endeavour — Antarctica Expedition, January 2026 */
const TRIP_CONFIG = {
    shipName:  'Silver Endeavour',
    subtitle:  'Silversea &middot; Antarctic Peninsula Expedition',
    dateRange: 'January 5 \u2013 15, 2026',
    nights:    10,
    itinerary: [
        { day: 1,  date: '2026-01-05', location: 'San Diego \u2014 Departing for Santiago', short: 'San Diego',       lat: 32.7157,  lon: -117.1611, arrival: null,       departure: null,      type: 'travel' },
        { day: 2,  date: '2026-01-06', location: 'Santiago, Chile',                         short: 'Santiago',        lat: -33.4489, lon: -70.6693,  arrival: null,       departure: null,      type: 'hotel',  note: 'Ritz-Carlton Santiago' },
        { day: 3,  date: '2026-01-07', location: 'Punta Arenas, Chile',                     short: 'Punta Arenas',    lat: -53.1638, lon: -70.9171,  arrival: null,       departure: null,      type: 'port'   },
        { day: 4,  date: '2026-01-08', location: 'King George Island, Antarctica',          short: 'King George Is.', lat: -62.0500, lon: -58.3900,  arrival: null,       departure: null,      type: 'port',   note: 'Fly-in embarkation' },
        { day: 5,  date: '2026-01-09', location: 'Antarctic Peninsula',                     short: 'Antarctica',      lat: -63.3000, lon: -59.5000,  arrival: null,       departure: null,      type: 'scenic' },
        { day: 6,  date: '2026-01-10', location: 'Antarctic Peninsula',                     short: 'Antarctica',      lat: -64.8000, lon: -63.5000,  arrival: null,       departure: null,      type: 'scenic' },
        { day: 7,  date: '2026-01-11', location: 'Antarctic Peninsula',                     short: 'Antarctica',      lat: -65.0000, lon: -64.0000,  arrival: null,       departure: null,      type: 'scenic' },
        { day: 8,  date: '2026-01-12', location: 'Antarctic Peninsula',                     short: 'Antarctica',      lat: -64.0000, lon: -61.5000,  arrival: null,       departure: null,      type: 'scenic' },
        { day: 9,  date: '2026-01-13', location: 'Antarctic Peninsula',                     short: 'Antarctica',      lat: -63.0000, lon: -60.0000,  arrival: null,       departure: null,      type: 'scenic' },
        { day: 10, date: '2026-01-14', location: 'Punta Arenas, Chile',                     short: 'Punta Arenas',    lat: -53.1638, lon: -70.9171,  arrival: null,       departure: null,      type: 'port'   },
        { day: 11, date: '2026-01-15', location: 'Santiago \u2014 Flying Home',             short: 'Santiago',        lat: -33.4489, lon: -70.6693,  arrival: null,       departure: null,      type: 'travel' }
    ]
};
