// Konfiguracja Weather Widget dla Notion
// Ten plik zawiera przykłady konfiguracji i integracji

// ===========================================
// PODSTAWOWA KONFIGURACJA
// ===========================================

const WEATHER_CONFIG = {
    // Twój klucz API z OpenWeatherMap
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // Podstawowy URL do API
    API_BASE: 'https://api.openweathermap.org/data/2.5',
    
    // Język dla opisów pogody
    LANGUAGE: 'pl', // pl, en, fr, de, es, it, etc.
    
    // Jednostki temperatury
    UNITS: 'metric', // metric (Celsius), imperial (Fahrenheit), kelvin
    
    // Domyślne miasto jeśli nie podano w URL
    DEFAULT_CITY: 'Warsaw',
    
    // Czas cache'owania danych (w minutach)
    CACHE_DURATION: 10
};

// ===========================================
// MAPOWANIE IKON POGODY
// ===========================================

const WEATHER_ICONS = {
    // Dzień
    '01d': '☀️',  // czyste niebo
    '02d': '⛅',  // częściowo pochmurno
    '03d': '☁️',  // pochmurno
    '04d': '☁️',  // bardzo pochmurno
    '09d': '🌧️',  // deszcz
    '10d': '🌦️',  // deszcz ze słońcem
    '11d': '⛈️',  // burza
    '13d': '❄️',  // śnieg
    '50d': '🌫️',  // mgła
    
    // Noc
    '01n': '🌙',  // czyste niebo
    '02n': '☁️',  // częściowo pochmurno
    '03n': '☁️',  // pochmurno
    '04n': '☁️',  // bardzo pochmurno
    '09n': '🌧️',  // deszcz
    '10n': '🌧️',  // deszcz
    '11n': '⛈️',  // burza
    '13n': '❄️',  // śnieg
    '50n': '🌫️'   // mgła
};

// ===========================================
// FUNKCJE POMOCNICZE
// ===========================================

/**
 * Pobiera parametry z URL
 * @param {string} param - nazwa parametru
 * @returns {string|null} - wartość parametru lub null
 */
function getUrlParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Formatuje datę dla prognozy
 * @param {number} timestamp - timestamp Unix
 * @returns {string} - sformatowana data
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('pl-PL', { 
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

/**
 * Konwertuje prędkość wiatru z m/s na km/h
 * @param {number} speed - prędkość w m/s
 * @returns {number} - prędkość w km/h
 */
function convertWindSpeed(speed) {
    return Math.round(speed * 3.6);
}

/**
 * Określa kierunek wiatru na podstawie stopni
 * @param {number} degrees - kierunek w stopniach
 * @returns {string} - kierunek wiatru
 */
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

/**
 * Cache dla danych pogodowych
 */
class WeatherCache {
    constructor() {
        this.cache = new Map();
    }
    
    /**
     * Pobiera dane z cache
     * @param {string} key - klucz cache
     * @returns {object|null} - dane z cache lub null
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        const now = Date.now();
        if (now - item.timestamp > WEATHER_CONFIG.CACHE_DURATION * 60 * 1000) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    /**
     * Zapisuje dane do cache
     * @param {string} key - klucz cache
     * @param {object} data - dane do zapisania
     */
    set(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
}

// ===========================================
// GŁÓWNA KLASA WEATHER WIDGET
// ===========================================

class WeatherWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cache = new WeatherCache();
        this.location = this.getLocation();
    }
    
    /**
     * Pobiera lokalizację z różnych źródeł
     * @returns {string} - nazwa miasta
     */
    getLocation() {
        // Priorytet: URL params > localStorage > default
        return getUrlParameter('city') || 
               getUrlParameter('location') || 
               localStorage.getItem('weather-location') ||
               WEATHER_CONFIG.DEFAULT_CITY;
    }
    
    /**
     * Pobiera aktualne dane pogodowe
     * @param {string} city - nazwa miasta
     * @returns {Promise<object>} - dane pogodowe
     */
    async getCurrentWeather(city) {
        const cacheKey = `current-${city}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
        
        const url = `${WEATHER_CONFIG.API_BASE}/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANGUAGE}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        this.cache.set(cacheKey, data);
        return data;
    }
    
    /**
     * Pobiera prognozę pogody
     * @param {string} city - nazwa miasta
     * @returns {Promise<object>} - prognoza pogody
     */
    async getForecast(city) {
        const cacheKey = `forecast-${city}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
        
        const url = `${WEATHER_CONFIG.API_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANGUAGE}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Forecast API error: ${response.status}`);
        }
        
        const data = await response.json();
        this.cache.set(cacheKey, data);
        return data;
    }
    
    /**
     * Renderuje widget pogodowy
     * @param {object} current - aktualne dane pogodowe
     * @param {object} forecast - prognoza pogody
     */
    render(current, forecast) {
        // Przygotuj dane prognozy (jeden wpis na dzień)
        const dailyForecast = this.processForecast(forecast);
        
        this.container.innerHTML = `
            <div class="weather-header">
                <h2 class="location">${current.name}, ${current.sys.country}</h2>
                <div class="last-updated">Aktualizacja: ${new Date().toLocaleTimeString('pl-PL')}</div>
            </div>
            
            <div class="current-weather">
                <div class="weather-main">
                    <div class="weather-icon">${WEATHER_ICONS[current.weather[0].icon] || '🌤️'}</div>
                    <div class="temperature">${Math.round(current.main.temp)}°C</div>
                </div>
                <div class="weather-description">${current.weather[0].description}</div>
            </div>
            
            <div class="weather-details">
                ${this.renderDetails(current)}
            </div>
            
            <div class="weather-forecast">
                <h3>Prognoza 5-dniowa</h3>
                <div class="forecast-container">
                    ${dailyForecast.map(day => this.renderForecastDay(day)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Renderuje szczegóły pogody
     * @param {object} current - aktualne dane pogodowe
     * @returns {string} - HTML ze szczegółami
     */
    renderDetails(current) {
        const details = [
            { label: 'Odczuwalna', value: `${Math.round(current.main.feels_like)}°C` },
            { label: 'Wilgotność', value: `${current.main.humidity}%` },
            { label: 'Wiatr', value: `${convertWindSpeed(current.wind.speed)} km/h ${getWindDirection(current.wind.deg)}` },
            { label: 'Ciśnienie', value: `${current.main.pressure} hPa` },
            { label: 'Widoczność', value: `${(current.visibility / 1000).toFixed(1)} km` },
            { label: 'Indeks UV', value: current.uvi ? current.uvi.toFixed(1) : 'N/A' }
        ];
        
        return details.map(detail => `
            <div class="detail-item">
                <span class="detail-label">${detail.label}</span>
                <span class="detail-value">${detail.value}</span>
            </div>
        `).join('');
    }
    
    /**
     * Przetwarza dane prognozy na format dzienny
     * @param {object} forecast - dane prognozy
     * @returns {Array} - prognoza dzienna
     */
    processForecast(forecast) {
        const dailyData = [];
        const processedDates = new Set();
        
        forecast.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!processedDates.has(date) && dailyData.length < 5) {
                dailyData.push(item);
                processedDates.add(date);
            }
        });
        
        return dailyData;
    }
    
    /**
     * Renderuje jeden dzień prognozy
     * @param {object} day - dane dnia
     * @returns {string} - HTML dnia prognozy
     */
    renderForecastDay(day) {
        return `
            <div class="forecast-day">
                <div class="forecast-date">${formatDate(day.dt)}</div>
                <div class="forecast-icon">${WEATHER_ICONS[day.weather[0].icon] || '🌤️'}</div>
                <div class="forecast-temps">
                    <span class="temp-max">${Math.round(day.main.temp_max)}°</span>
                    <span class="temp-min">${Math.round(day.main.temp_min)}°</span>
                </div>
                <div class="forecast-desc">${day.weather[0].description}</div>
            </div>
        `;
    }
    
    /**
     * Wyświetla błąd
     * @param {string} message - wiadomość błędu
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="weather-error">
                <div class="error-icon">❌</div>
                <div class="error-message">${message}</div>
                <div class="error-details">Lokalizacja: "${this.location}"</div>
            </div>
        `;
    }
    
    /**
     * Wyświetla loader
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="weather-loading">
                <div class="loading-icon">🌤️</div>
                <div class="loading-text">Ładowanie prognozy pogody...</div>
            </div>
        `;
    }
    
    /**
     * Inicjalizuje widget
     */
    async init() {
        try {
            this.showLoading();
            
            // Sprawdź klucz API
            if (WEATHER_CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
                throw new Error('Nie ustawiono klucza API. Zarejestruj się na openweathermap.org');
            }
            
            // Pobierz dane pogodowe
            const [current, forecast] = await Promise.all([
                this.getCurrentWeather(this.location),
                this.getForecast(this.location)
            ]);
            
            // Zapisz lokalizację w localStorage
            localStorage.setItem('weather-location', this.location);
            
            // Renderuj widget
            this.render(current, forecast);
            
        } catch (error) {
            console.error('Weather widget error:', error);
            this.showError(error.message);
        }
    }
}

// ===========================================
// PRZYKŁADY UŻYCIA
// ===========================================

/**
 * Przykład 1: Podstawowe użycie
 */
function initBasicWeatherWidget() {
    const widget = new WeatherWidget('weatherContainer');
    widget.init();
}

/**
 * Przykład 2: Widget z automatycznym odświeżaniem
 */
function initAutoRefreshWidget() {
    const widget = new WeatherWidget('weatherContainer');
    widget.init();
    
    // Odświeżaj co 10 minut
    setInterval(() => {
        widget.init();
    }, 10 * 60 * 1000);
}

/**
 * Przykład 3: Widget z obsługą błędów i retry
 */
function initRobustWidget() {
    const widget = new WeatherWidget('weatherContainer');
    
    async function tryInit(retries = 3) {
        try {
            await widget.init();
        } catch (error) {
            if (retries > 0) {
                console.log(`Retry in 5 seconds... (${retries} attempts left)`);
                setTimeout(() => tryInit(retries - 1), 5000);
            } else {
                widget.showError('Nie udało się załadować pogody po kilku próbach');
            }
        }
    }
    
    tryInit();
}

// ===========================================
// INTEGRACJA Z NOTION
// ===========================================

/**
 * Funkcje pomocnicze dla integracji z Notion
 */
const NotionIntegration = {
    /**
     * Generuje URL widget dla Notion Embed
     * @param {string} baseUrl - podstawowy URL widget
     * @param {string} city - nazwa miasta
     * @returns {string} - pełny URL
     */
    generateWidgetUrl(baseUrl, city) {
        return `${baseUrl}?city=${encodeURIComponent(city)}&notion=true`;
    },
    
    /**
     * Formuła Notion dla automatycznego generowania URL
     * Użyj tej formuły w polu URL w Notion:
     */
    notionFormula: `"https://twoja-domena.com/weather-widget.html?city=" + prop("Location")`,
    
    /**
     * Przykład konfiguracji dla różnych typów podróży
     */
    tripTypeConfigs: {
        business: {
            showDetails: ['temperature', 'rain', 'wind'],
            theme: 'professional'
        },
        vacation: {
            showDetails: ['temperature', 'rain', 'uv', 'humidity'],
            theme: 'colorful'
        },
        adventure: {
            showDetails: ['temperature', 'wind', 'visibility', 'pressure'],
            theme: 'outdoor'
        }
    }
};

// Eksportuj dla użycia w innych plikach
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WEATHER_CONFIG,
        WEATHER_ICONS,
        WeatherWidget,
        NotionIntegration
    };
}