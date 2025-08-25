const fs = require('fs');
const fetch = require('node-fetch');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const API_BASE = 'https://api.openweathermap.org/data/2.5';

// Lista popularnych miast dla cache
const POPULAR_CITIES = [
    'Warsaw', 'Paris', 'London', 'New York', 'Tokyo', 'Sydney',
    'Barcelona', 'Rome', 'Berlin', 'Amsterdam', 'Prague', 'Vienna',
    'Budapest', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan', 'Zakopane',
    'Madrid', 'Lisbon', 'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki',
    'Dublin', 'Edinburgh', 'Brussels', 'Zurich', 'Milan', 'Florence',
    'Athens', 'Istanbul', 'Moscow', 'St Petersburg', 'Kiev', 'Minsk'
];

/**
 * Pobiera dane pogodowe dla określonego miasta
 * @param {string} city - nazwa miasta
 * @returns {Object|null} - dane pogodowe lub null w przypadku błędu
 */
async function fetchWeatherData(city) {
    try {
        console.log(`Fetching weather data for: ${city}`);
        
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${API_BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`),
            fetch(`${API_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`)
        ]);
        
        if (!currentResponse.ok) {
            console.error(`Current weather API error for ${city}: ${currentResponse.status} ${currentResponse.statusText}`);
            return null;
        }
        
        if (!forecastResponse.ok) {
            console.error(`Forecast API error for ${city}: ${forecastResponse.status} ${forecastResponse.statusText}`);
            return null;
        }
        
        const current = await currentResponse.json();
        const forecast = await forecastResponse.json();
        
        // Walidacja danych
        if (!current.main || !current.weather || !forecast.list) {
            console.error(`Invalid weather data structure for ${city}`);
            return null;
        }
        
        return {
            current: {
                name: current.name,
                country: current.sys.country,
                temp: current.main.temp,
                feels_like: current.main.feels_like,
                humidity: current.main.humidity,
                pressure: current.main.pressure,
                description: current.weather[0].description,
                icon: current.weather[0].icon,
                wind: {
                    speed: current.wind?.speed || 0,
                    deg: current.wind?.deg || 0
                },
                visibility: current.visibility || 0,
                dt: current.dt
            },
            forecast: {
                list: forecast.list.map(item => ({
                    dt: item.dt,
                    main: {
                        temp: item.main.temp,
                        temp_min: item.main.temp_min,
                        temp_max: item.main.temp_max,
                        humidity: item.main.humidity
                    },
                    weather: [{
                        description: item.weather[0].description,
                        icon: item.weather[0].icon
                    }],
                    wind: {
                        speed: item.wind?.speed || 0
                    },
                    dt_txt: item.dt_txt
                }))
            },
            lastUpdated: new Date().toISOString(),
            city: city
        };
    } catch (error) {
        console.error(`Error fetching weather for ${city}:`, error.message);
        return null;
    }
}

/**
 * Ładuje istniejące dane z cache
 * @returns {Object} - istniejące dane pogodowe
 */
function loadExistingData() {
    try {
        if (fs.existsSync('./data/weather.json')) {
            const data = fs.readFileSync('./data/weather.json', 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading existing data:', error.message);
    }
    return {};
}

/**
 * Główna funkcja aktualizująca dane pogodowe
 */
async function updateWeatherData() {
    if (!API_KEY) {
        console.error('OPENWEATHER_API_KEY environment variable is not set!');
        process.exit(1);
    }
    
    console.log('🌤️ Starting weather data update...');
    console.log(`📍 Fetching data for ${POPULAR_CITIES.length} cities`);
    
    // Załaduj istniejące dane
    const existingData = loadExistingData();
    const weatherData = { ...existingData };
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < POPULAR_CITIES.length; i++) {
        const city = POPULAR_CITIES[i];
        const progress = `[${i + 1}/${POPULAR_CITIES.length}]`;
        
        console.log(`${progress} Processing ${city}...`);
        
        const data = await fetchWeatherData(city);
        if (data) {
            weatherData[city.toLowerCase()] = data;
            successCount++;
            console.log(`${progress} ✅ ${city} - Success`);
        } else {
            errorCount++;
            console.log(`${progress} ❌ ${city} - Failed (keeping old data if exists)`);
        }
        
        // Rate limiting - pauza między zapytaniami
        if (i < POPULAR_CITIES.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    // Utwórz katalog data jeśli nie istnieje
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('📁 Created data directory');
    }
    
    // Dodaj metadane
    const finalData = {
        ...weatherData,
        _metadata: {
            lastUpdate: new Date().toISOString(),
            totalCities: Object.keys(weatherData).filter(key => !key.startsWith('_')).length,
            successfulUpdates: successCount,
            failedUpdates: errorCount,
            availableCities: Object.keys(weatherData)
                .filter(key => !key.startsWith('_'))
                .sort()
        }
    };
    
    // Zapisz dane do pliku JSON
    try {
        fs.writeFileSync('./data/weather.json', JSON.stringify(finalData, null, 2));
        console.log('\n🎉 Weather data update completed!');
        console.log(`✅ Successful updates: ${successCount}`);
        console.log(`❌ Failed updates: ${errorCount}`);
        console.log(`📊 Total cities in cache: ${finalData._metadata.totalCities}`);
        console.log(`💾 Data saved to: ./data/weather.json`);
        
        // Wyświetl rozmiar pliku
        const stats = fs.statSync('./data/weather.json');
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        console.log(`📏 File size: ${fileSizeKB} KB`);
        
    } catch (error) {
        console.error('❌ Error saving weather data:', error.message);
        process.exit(1);
    }
}

/**
 * Funkcja pomocnicza do testowania pojedynczego miasta
 * @param {string} city - nazwa miasta do przetestowania
 */
async function testCity(city) {
    console.log(`🧪 Testing weather data for: ${city}`);
    const data = await fetchWeatherData(city);
    if (data) {
        console.log('✅ Success!');
        console.log(`📍 Location: ${data.current.name}, ${data.current.country}`);
        console.log(`🌡️ Temperature: ${data.current.temp}°C`);
        console.log(`📝 Description: ${data.current.description}`);
        console.log(`📅 Forecast days: ${data.forecast.list.length}`);
    } else {
        console.log('❌ Failed to fetch data');
    }
}

// Obsługa argumentów wiersza poleceń
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] === 'test') {
        const city = args[1] || 'Warsaw';
        testCity(city).catch(console.error);
    } else {
        updateWeatherData().catch(error => {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        });
    }
}

module.exports = { 
    updateWeatherData, 
    fetchWeatherData, 
    testCity,
    POPULAR_CITIES 
};