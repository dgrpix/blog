/* Celebrity Ascent — Rome → Transatlantic → Fort Lauderdale, Oct–Nov 2026 */
const TRIP_CONFIG = {
    shipName:  'Celebrity Ascent',
    subtitle:  'Celebrity &middot; Rome &rarr; Transatlantic &rarr; Fort Lauderdale',
    dateRange: 'October 27 – November 13, 2026',
    nights:    17,
    itinerary: [
        { day: 1,  date: '2026-10-27', location: 'San Diego → Amsterdam',            short: 'San Diego',      lat: 32.7338, lon: -117.1933, arrival: null,       departure: '3:05 PM', type: 'travel', flight: 'DL9378', note: 'Overnight SAN → AMS (KLM 787-9), seats 34C/34D' },
        { day: 2,  date: '2026-10-28', location: 'Amsterdam → Rome',                 short: 'Rome',           lat: 41.9028, lon: 12.4964,   arrival: '4:20 PM',  departure: null,      type: 'travel', flight: 'DL9231', note: 'AMS → FCO T1; The Rome EDITION, Loft Suite' },
        { day: 3,  date: '2026-10-29', location: 'Rome, Italy',                      short: 'Rome',           lat: 41.9028, lon: 12.4964,   arrival: null,       departure: null,      type: 'hotel',  note: 'Walking loop: EDITION → Pantheon → Corso → Spanish Steps' },
        { day: 4,  date: '2026-10-30', location: 'Civitavecchia (Rome), Italy',      short: 'Civitavecchia',  lat: 42.0930, lon: 11.7960,   arrival: null,       departure: '5:00 PM', type: 'port',   note: 'Embark Celebrity Ascent — all aboard 4:00 PM; EU EES immigration queue can exceed 90 min' },
        { day: 5,  date: '2026-10-31', location: 'Cagliari, Sardinia',               short: 'Cagliari',       lat: 39.2238, lon: 9.1217,    arrival: '8:00 AM',  departure: '5:00 PM', type: 'port',   note: 'Excursion: Best of Sardinia — 8:30 AM' },
        { day: 6,  date: '2026-11-01', location: 'At Sea — Mediterranean',           short: 'At Sea',         lat: 37.80,   lon: 1.50,      arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 7,  date: '2026-11-02', location: 'Málaga, Spain',                    short: 'Málaga',         lat: 36.7213, lon: -4.4214,   arrival: '7:00 AM',  departure: '8:00 PM', type: 'port',   note: 'Excursion: Málaga City Tour — 8:30 AM' },
        { day: 8,  date: '2026-11-03', location: 'At Sea — toward Madeira',          short: 'At Sea',         lat: 34.60,   lon: -10.80,    arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 9,  date: '2026-11-04', location: 'Funchal, Madeira',                 short: 'Funchal',        lat: 32.6500, lon: -16.9083,  arrival: '8:00 AM',  departure: '6:00 PM', type: 'port',   note: 'Excursion: Cable Car & Monte Palace Gardens — 9:30 AM' },
        { day: 10, date: '2026-11-05', location: 'At Sea — Atlantic crossing',       short: 'At Sea',         lat: 33.50,   lon: -24.00,    arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 11, date: '2026-11-06', location: 'At Sea — Atlantic crossing',       short: 'At Sea',         lat: 34.50,   lon: -32.00,    arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 12, date: '2026-11-07', location: 'At Sea — Atlantic crossing',       short: 'At Sea',         lat: 35.00,   lon: -40.00,    arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 13, date: '2026-11-08', location: 'At Sea — Atlantic crossing',       short: 'At Sea',         lat: 34.50,   lon: -48.00,    arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 14, date: '2026-11-09', location: 'At Sea — toward Bermuda',          short: 'At Sea',         lat: 33.50,   lon: -56.00,    arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 15, date: '2026-11-10', location: 'Royal Naval Dockyard, Bermuda',    short: 'Bermuda',        lat: 32.3270, lon: -64.8340,  arrival: '8:00 AM',  departure: '3:30 PM', type: 'port',   note: 'Excursion: Lighthouses, Pink Sands and Shopping — 9:45 AM' },
        { day: 16, date: '2026-11-11', location: 'At Sea — toward Florida',          short: 'At Sea',         lat: 30.00,   lon: -70.00,    arrival: null,       departure: null,      type: 'sea',    note: 'Doug: Private Room 8:30 AM' },
        { day: 17, date: '2026-11-12', location: 'At Sea — toward Florida',          short: 'At Sea',         lat: 27.50,   lon: -76.00,    arrival: null,       departure: null,      type: 'sea'    },
        { day: 18, date: '2026-11-13', location: 'Fort Lauderdale → San Diego',      short: 'Fort Lauderdale', lat: 26.0920, lon: -80.1180, arrival: '5:00 AM',  departure: '3:35 PM', type: 'travel', flight: 'DL1554', note: 'Disembark Ascent; FLL → Atlanta → SAN (DL 819), lands 9:41 PM' }
    ]
};
