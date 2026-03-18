/* ============================================================
   ANTHEM OF THE SEAS — CRUISE WEATHER APP
   Fetches from Open-Meteo (free, no API key needed)
   ============================================================ */

'use strict';

/* ---- ITINERARY DATA ---------------------------------------- */
const ITINERARY = [
    { day: 0,  date: '2026-03-21', location: 'Sydney, Australia',              short: 'Sydney',        lat: -33.8688, lon: 151.2093, arrival: '7:25 AM',  departure: null,      type: 'port',  flight: 'QF12' },
    { day: 1,  date: '2026-03-22', location: 'Sydney, Australia',              short: 'Sydney',        lat: -33.8688, lon: 151.2093, arrival: null,       departure: '5:00 PM', type: 'port'   },
    { day: 2,  date: '2026-03-23', location: 'At Sea — Tasman Sea',            short: 'Tasman Sea',    lat: -33.00,   lon: 157.50,   arrival: null,       departure: null,      type: 'sea'    },
    { day: 3,  date: '2026-03-24', location: 'At Sea — Crossing to NZ',        short: 'Tasman Sea',    lat: -33.50,   lon: 165.00,   arrival: null,       departure: null,      type: 'sea'    },
    { day: 4,  date: '2026-03-25', location: 'Bay of Islands, New Zealand',    short: 'Bay of Islands',lat: -35.2627, lon: 174.0900, arrival: '9:30 AM',  departure: '6:00 PM', type: 'port'   },
    { day: 5,  date: '2026-03-26', location: 'Tauranga, New Zealand',          short: 'Tauranga',      lat: -37.6878, lon: 176.1651, arrival: '8:00 AM',  departure: '5:00 PM', type: 'port'   },
    { day: 6,  date: '2026-03-27', location: 'Napier, New Zealand',            short: 'Napier',        lat: -39.4928, lon: 176.9120, arrival: '10:00 AM', departure: '7:00 PM', type: 'port'   },
    { day: 7,  date: '2026-03-28', location: 'Wellington, New Zealand',        short: 'Wellington',    lat: -41.2865, lon: 174.7762, arrival: '9:00 AM',  departure: '6:00 PM', type: 'port'   },
    { day: 8,  date: '2026-03-29', location: 'Christchurch (Lyttelton), NZ',  short: 'Christchurch',  lat: -43.6032, lon: 172.7194, arrival: '7:30 AM',  departure: '6:00 PM', type: 'port'   },
    { day: 9,  date: '2026-03-30', location: 'Port Chalmers (Dunedin), NZ',   short: 'Dunedin',       lat: -45.8167, lon: 170.6233, arrival: '7:30 AM',  departure: '5:00 PM', type: 'port'   },
    { day: 10, date: '2026-03-31', location: 'Fiordland Scenic Cruising',      short: 'Fiordland',     lat: -45.40,   lon: 167.00,   arrival: '11:00 AM', departure: '5:00 PM', type: 'scenic' },
    { day: 11, date: '2026-04-01', location: 'At Sea — Tasman Sea Return',     short: 'Tasman Sea',    lat: -43.50,   lon: 163.00,   arrival: null,       departure: null,      type: 'sea'    },
    { day: 12, date: '2026-04-02', location: 'At Sea — Approaching Sydney',    short: 'Tasman Sea',    lat: -38.50,   lon: 157.00,   arrival: null,       departure: null,      type: 'sea'    },
    { day: 13, date: '2026-04-03', location: 'Sydney, Australia',              short: 'Sydney',        lat: -33.8688, lon: 151.2093, arrival: '6:30 AM',  departure: null,      type: 'port'   },
    { day: 14, date: '2026-04-04', location: 'Sydney, Australia',              short: 'Sydney',        lat: -33.8688, lon: 151.2093, arrival: null,       departure: null,      type: 'port'   },
    { day: 15, date: '2026-04-05', location: 'Sydney, Australia',              short: 'Sydney',        lat: -33.8688, lon: 151.2093, arrival: null,       departure: null,      type: 'port'   },
    { day: 16, date: '2026-04-06', location: 'Sydney, Australia',              short: 'Sydney',        lat: -33.8688, lon: 151.2093, arrival: null,       departure: '5:25 PM', type: 'port',  flight: 'QF11' }
];

/* ---- WMO WEATHER CODE MAP ---------------------------------- */
const WMO = {
    0:  { emoji: '☀️',  label: 'Clear Sky',           grad: ['#1557b0','#2577cc','#4a9ed8'] },
    1:  { emoji: '🌤️', label: 'Mainly Clear',         grad: ['#1565c0','#2987d4','#5aaee0'] },
    2:  { emoji: '⛅',  label: 'Partly Cloudy',        grad: ['#3a5a80','#4d7498','#7298b8'] },
    3:  { emoji: '☁️',  label: 'Overcast',             grad: ['#455260','#5d6e7c','#7d909e'] },
    45: { emoji: '🌫️', label: 'Foggy',                grad: ['#596066','#6d7b84','#8f9ea8'] },
    48: { emoji: '🌫️', label: 'Freezing Fog',         grad: ['#596066','#6d7b84','#8f9ea8'] },
    51: { emoji: '🌦️', label: 'Light Drizzle',        grad: ['#2b4e70','#3d6888','#5f8eac'] },
    53: { emoji: '🌦️', label: 'Drizzle',              grad: ['#234260','#2e5878','#4a7898'] },
    55: { emoji: '🌧️', label: 'Heavy Drizzle',        grad: ['#1a3654','#24506e','#3a7090'] },
    61: { emoji: '🌧️', label: 'Light Rain',           grad: ['#18325a','#224e74','#356e94'] },
    63: { emoji: '🌧️', label: 'Moderate Rain',        grad: ['#122840','#1a3e5e','#285e80'] },
    65: { emoji: '🌧️', label: 'Heavy Rain',           grad: ['#0d1e30','#142e4a','#1e4e6e'] },
    71: { emoji: '🌨️', label: 'Light Snow',           grad: ['#3a5068','#4e6a80','#7090aa'] },
    73: { emoji: '🌨️', label: 'Moderate Snow',        grad: ['#304460','#3e5878','#5c7898'] },
    75: { emoji: '❄️',  label: 'Heavy Snow',           grad: ['#28384e','#364e68','#4e6e8a'] },
    80: { emoji: '🌦️', label: 'Rain Showers',         grad: ['#1c3a5c','#285876','#3e7898'] },
    81: { emoji: '🌧️', label: 'Moderate Showers',     grad: ['#162e4c','#1e4668','#2e6688'] },
    82: { emoji: '⛈️',  label: 'Violent Showers',     grad: ['#0e1e30','#162c46','#204c66'] },
    95: { emoji: '⛈️',  label: 'Thunderstorm',        grad: ['#1a1a42','#2a2a62','#3a3a80'] },
    96: { emoji: '⛈️',  label: 'Thunderstorm + Hail', grad: ['#14143a','#201e54','#302868'] },
    99: { emoji: '⛈️',  label: 'Severe Thunderstorm', grad: ['#0c0c28','#16143e','#221e52'] }
};

function wmoInfo(code) {
    if (WMO[code]) return WMO[code];
    // Nearest match
    const keys = Object.keys(WMO).map(Number);
    const nearest = keys.reduce((a, b) => Math.abs(b - code) < Math.abs(a - code) ? b : a);
    return WMO[nearest] || { emoji: '🌡️', label: 'Unknown', grad: ['#3a4a5a','#506070','#6a8090'] };
}

function gradientFromWmo(code) {
    const { grad } = wmoInfo(code);
    return `linear-gradient(160deg, ${grad[0]} 0%, ${grad[1]} 50%, ${grad[2]} 100%)`;
}

/* ---- DATE / TIME HELPERS ----------------------------------- */
const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDateUTC(dateStr) {
    // Parse YYYY-MM-DD without local timezone shift
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function shortDayName(dateStr) {
    return DAY_NAMES[parseDateUTC(dateStr).getUTCDay()];
}

function shortDate(dateStr) {
    const d = parseDateUTC(dateStr);
    return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function todayStr() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function windDirLabel(deg) {
    if (deg === null || deg === undefined) return '—';
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
}

function uvLabel(uv) {
    if (uv === null || uv === undefined) return { text: '—', cls: '' };
    if (uv <= 2)  return { text: uv, cls: 'uv-low' };
    if (uv <= 5)  return { text: uv, cls: 'uv-med' };
    if (uv <= 7)  return { text: uv, cls: 'uv-high' };
    if (uv <= 10) return { text: uv, cls: 'uv-vhigh' };
    return { text: uv, cls: 'uv-extreme' };
}

/* ---- WEATHER DATA STORE ------------------------------------ */
// keyed by cruise date string  "2026-03-22"
const weatherStore = {};

/* ---- API FETCH -------------------------------------------- */
async function fetchWeatherForStop(stop) {
    if (stop.date < todayStr()) {
        return fetchActualWeatherForStop(stop);
    }

    const qs = new URLSearchParams({
        latitude:            stop.lat,
        longitude:           stop.lon,
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_probability_max',
            'wind_speed_10m_max',
            'wind_direction_10m_dominant',
            'uv_index_max'
        ].join(','),
        temperature_unit:    'fahrenheit',
        wind_speed_unit:     'mph',
        precipitation_unit:  'inch',
        timezone:            'auto',
        forecast_days:       '16'
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${stop.location}`);
    const data = await res.json();

    const idx = data.daily.time.indexOf(stop.date);
    if (idx === -1) return null; // date outside forecast window

    return {
        weatherCode: data.daily.weather_code[idx],
        tempHi:  Math.round(data.daily.temperature_2m_max[idx]),
        tempLo:  Math.round(data.daily.temperature_2m_min[idx]),
        precip:  data.daily.precipitation_probability_max[idx],
        wind:    Math.round(data.daily.wind_speed_10m_max[idx]),
        windDir: data.daily.wind_direction_10m_dominant[idx],
        uv:      data.daily.uv_index_max[idx] != null
                     ? Math.round(data.daily.uv_index_max[idx]) : null,
        isActual: false
    };
}

async function fetchActualWeatherForStop(stop) {
    const qs = new URLSearchParams({
        latitude:           stop.lat,
        longitude:          stop.lon,
        start_date:         stop.date,
        end_date:           stop.date,
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'wind_direction_10m_dominant',
            'uv_index_max'
        ].join(','),
        hourly: [
            'temperature_2m',
            'weather_code',
            'wind_speed_10m'
        ].join(','),
        temperature_unit:   'fahrenheit',
        wind_speed_unit:    'mph',
        precipitation_unit: 'inch',
        timezone:           'auto'
    });

    const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${qs}`);
    if (!res.ok) return null; // archive lag — data not yet available

    const data = await res.json();
    if (!data.daily || !data.daily.time || data.daily.time.length === 0) return null;

    // Average wind from all 24 hourly readings
    const hourlyWind = data.hourly.wind_speed_10m;
    const windAvg = Math.round(hourlyWind.reduce((a, b) => a + b, 0) / hourlyWind.length);

    // Snapshots at 8 AM, 2 PM, 8 PM local time
    const times      = data.hourly.time;
    const hourlyTemp = data.hourly.temperature_2m;
    const hourlyCode = data.hourly.weather_code;
    const snapshots  = [
        { hour: 8,  label: '8 AM'  },
        { hour: 14, label: '2 PM'  },
        { hour: 20, label: '8 PM'  }
    ].map(({ hour, label }) => {
        const target = `${stop.date}T${String(hour).padStart(2, '0')}:00`;
        const idx    = times.indexOf(target);
        return {
            label,
            temp:        idx !== -1 ? Math.round(hourlyTemp[idx]) : null,
            weatherCode: idx !== -1 ? hourlyCode[idx]             : null
        };
    });

    const precip = data.daily.precipitation_sum[0];

    return {
        weatherCode: data.daily.weather_code[0],
        tempHi:      Math.round(data.daily.temperature_2m_max[0]),
        tempLo:      Math.round(data.daily.temperature_2m_min[0]),
        precipIn:    precip != null ? parseFloat(precip.toFixed(2)) : null,
        wind:        windAvg,
        windDir:     data.daily.wind_direction_10m_dominant[0],
        uv:          data.daily.uv_index_max[0] != null
                         ? Math.round(data.daily.uv_index_max[0]) : null,
        isActual:    true,
        snapshots
    };
}

/* ---- LOAD ALL WEATHER ------------------------------------- */
async function loadWeather() {
    // UI reset
    const loadingEl  = document.getElementById('loadingState');
    const errorEl    = document.getElementById('errorState');
    const itinEl     = document.getElementById('itinerary');
    const refreshBtn = document.getElementById('refreshBtn');
    const progressEl = document.getElementById('loadingProgress');

    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    itinEl.classList.add('hidden');
    refreshBtn.classList.add('spinning');
    progressEl.textContent = 'Connecting to weather service…';

    let completed = 0;
    const total = ITINERARY.length;

    // Fetch all stops in parallel, track individual progress
    const results = await Promise.allSettled(
        ITINERARY.map(stop =>
            fetchWeatherForStop(stop).then(w => {
                completed++;
                progressEl.textContent = `Loaded ${completed} of ${total} locations…`;
                if (w) weatherStore[stop.date] = w;
            })
        )
    );

    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        refreshBtn.classList.remove('spinning');
        return;
    }

    renderItinerary();

    loadingEl.classList.add('hidden');
    itinEl.classList.remove('hidden');
    refreshBtn.classList.remove('spinning');

    const now = new Date();
    document.getElementById('updatedText').textContent =
        'Updated ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/* ---- RENDER ALL CARDS ------------------------------------- */
function renderItinerary() {
    const container = document.getElementById('itinerary');
    container.innerHTML = '';
    const today = todayStr();

    ITINERARY.forEach((stop, i) => {
        const card = buildCard(stop, i, today);
        container.appendChild(card);
    });
}

/* ---- BUILD A SINGLE DAY CARD ------------------------------ */
function buildCard(stop, idx, today) {
    const weather  = weatherStore[stop.date] || null;
    const info     = weather ? wmoInfo(weather.weatherCode) : wmoInfo(2);
    const gradient = weather ? gradientFromWmo(weather.weatherCode) : gradientFromWmo(2);
    const isToday  = stop.date === today;

    // Type config
    const TYPE_CONFIG = {
        port:   { icon: '⚓', label: 'Port',    cls: 'port'   },
        sea:    { icon: '🌊', label: 'At Sea',  cls: 'sea'    },
        scenic: { icon: '🏔️', label: 'Scenic', cls: 'scenic' }
    };
    const tc = TYPE_CONFIG[stop.type] || TYPE_CONFIG.sea;

    /* --- Port times --- */
    let portTimesHtml = '';
    if (stop.arrival || stop.departure) {
        const parts = [];
        if (stop.arrival)   parts.push(`<span class="port-time-item">🟢 Arrives ${stop.arrival}</span>`);
        if (stop.departure) parts.push(`<span class="port-time-item">🔴 Departs ${stop.departure}</span>`);
        const flightBadge = stop.flight
            ? ` <a class="flight-badge" href="https://www.flightaware.com/live/flight/${stop.flight.replace('QF','QFA')}" target="_blank" rel="noopener noreferrer">✈ ${stop.flight}</a>`
            : '';
        portTimesHtml = `<div class="port-times">${parts.join('')}${flightBadge}</div>`;
    }

    /* --- Main temperature / condition --- */
    let mainHtml;
    if (weather) {
        const uv    = uvLabel(weather.uv);
        const wdir  = windDirLabel(weather.windDir);
        const windChipLabel = weather.isActual ? `Avg Wind ${wdir}` : `Wind ${wdir}`;
        const precipChip    = weather.isActual
            ? `<span class="chip-value">${weather.precipIn != null ? weather.precipIn : '—'}<small>${weather.precipIn != null ? ' in' : ''}</small></span>
                    <span class="chip-label">Rainfall</span>`
            : `<span class="chip-value">${weather.precip ?? '—'}<small>%</small></span>
                    <span class="chip-label">Rain</span>`;
        mainHtml = `
            <div class="weather-icon-temp">
                <div class="weather-emoji">${info.emoji}</div>
                <div class="temp-block">
                    <div class="temp-high">${weather.tempHi}<span class="temp-unit">°</span></div>
                    <div class="temp-low">Low ${weather.tempLo}°F</div>
                </div>
            </div>
            <div class="weather-condition">${info.label}</div>
            <div class="detail-chips">
                <div class="chip">
                    <span class="chip-icon">💨</span>
                    <span class="chip-value">${weather.wind}<small> mph</small></span>
                    <span class="chip-label">${windChipLabel}</span>
                </div>
                <div class="chip">
                    <span class="chip-icon">🌧️</span>
                    ${precipChip}
                </div>
                ${!weather.isActual ? `
                <div class="chip">
                    <span class="chip-icon">🕶️</span>
                    <span class="chip-value ${uv.cls}">${uv.text}</span>
                    <span class="chip-label">UV Index</span>
                </div>` : ''}
            </div>`;
    } else {
        mainHtml = `
            <div class="weather-emoji">🌡️</div>
            <div class="no-weather">Forecast unavailable</div>`;
    }

    /* --- Bottom strip: actual snapshots (past) or 3-day forecast (future) --- */
    let miniFcHtml = '';
    if (weather && weather.isActual && weather.snapshots) {
        /* Past day: show 8 AM / 2 PM / 8 PM actuals */
        const slots = weather.snapshots.map(({ label, temp, weatherCode: wc }) => {
            const wi      = wc != null ? wmoInfo(wc) : null;
            const icon    = wi ? wi.emoji : '—';
            const tempStr = temp != null
                ? `<span class="fc-temps"><b>${temp}°</b></span>`
                : `<span class="fc-pending">—</span>`;
            return `
                <div class="fc-day${label === '2 PM' ? ' fc-today' : ''}">
                    <div class="fc-day-label">${label}</div>
                    <div class="fc-icon">${icon}</div>
                    ${tempStr}
                </div>`;
        }).join('');
        miniFcHtml = `<div class="mini-forecast">${slots}</div>`;
    } else {
        /* Future/today: show day-before, this day, day-after */
        const fcSlots = [-1, 0, 1].map(offset => {
            const s = ITINERARY[idx + offset];
            if (!s) return null;
            const w = weatherStore[s.date] || null;
            const wi = w ? wmoInfo(w.weatherCode) : null;
            return { stop: s, weather: w, info: wi, offset };
        }).filter(Boolean);

        if (fcSlots.length) {
            const slots = fcSlots.map(({ stop: s, weather: w, info: wi, offset }) => {
                const label   = shortDayName(s.date);
                const tempStr = w
                    ? `<span class="fc-temps"><b>${w.tempHi}°</b><span class="fc-lo">${w.tempLo}°</span></span>`
                    : `<span class="fc-pending">—</span>`;
                const icon = wi ? wi.emoji : '❓';
                return `
                <div class="fc-day${offset === 0 ? ' fc-today' : ''}">
                    <div class="fc-day-label">${label}</div>
                    <div class="fc-icon">${icon}</div>
                    ${tempStr}
                    <div class="fc-location">${s.short}</div>
                </div>`;
            }).join('');
            miniFcHtml = `<div class="mini-forecast">${slots}</div>`;
        }
    }

    /* --- Assemble card --- */
    const card = document.createElement('div');
    card.className = 'day-card' + (isToday ? ' is-today' : '');
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Day ${stop.day}: ${stop.location}`);

    card.innerHTML = `
        <div class="card-bg" style="background:${gradient};"></div>
        <div class="card-content">
            <div class="card-top">
                <div class="card-day-info">
                    ${isToday ? '<div class="today-flag">▶ Today</div>' : ''}
                    ${weather && weather.isActual ? '<div class="actual-flag">✓ Actual</div>' : ''}
                    <div class="day-number-label">Day ${stop.day}</div>
                    <div class="day-date-label">${shortDayName(stop.date)}, ${shortDate(stop.date)}</div>
                </div>
                <div class="type-badge ${tc.cls}">
                    <span>${tc.icon}</span><span>${tc.label}</span>
                </div>
            </div>

            <div class="location-name">${stop.location}</div>
            ${portTimesHtml}

            <div class="card-main">${mainHtml}</div>

            ${miniFcHtml}
        </div>`;

    return card;
}

/* ---- INIT -------------------------------------------------- */
document.getElementById('refreshBtn').addEventListener('click', loadWeather);
loadWeather();
