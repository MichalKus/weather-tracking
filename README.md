# 🌤️ Weather Widget for Notion - GitHub Pages

Dynamiczny widget pogodowy dla szablonów Notion, hostowany na GitHub Pages z bezpiecznym zarządzaniem kluczem API przez GitHub Secrets.

## ✨ Funkcje

- 🔒 **Bezpieczny klucz API** - przechowywany w GitHub Secrets
- ⚡ **Szybkie ładowanie** - dane cache'owane lokalnie w JSON
- 🔄 **Automatyczne aktualizacje** - GitHub Actions co godzinę
- 🌍 **Wiele miast** - ponad 30 popularnych lokalizacji
- 📱 **Responsywny design** - działa na wszystkich urządzeniach
- 🎨 **Piękny interfejs** - nowoczesny design z animacjami
- 🇵🇱 **Wsparcie polskiego** - interfejs w języku polskim

## 🚀 Szybki start

### 1. Fork repozytorium

1. Kliknij przycisk **Fork** w prawym górnym rogu
2. Wybierz swoje konto GitHub
3. Poczekaj na skopiowanie repozytorium

### 2. Pobierz klucz API OpenWeatherMap

1. Idź na [OpenWeatherMap](https://openweathermap.org/api)
2. Zarejestruj się (darmowe konto)
3. Przejdź do [API Keys](https://home.openweathermap.org/api_keys)
4. Skopiuj swój klucz API

### 3. Dodaj klucz API do GitHub Secrets

1. W swoim forku przejdź do **Settings** → **Secrets and variables** → **Actions**
2. Kliknij **New repository secret**
3. Nazwa: `OPENWEATHER_API_KEY`
4. Wartość: Twój klucz API z OpenWeatherMap
5. Kliknij **Add secret**

### 4. Włącz GitHub Pages

1. Przejdź do **Settings** → **Pages**
2. W sekcji **Source** wybierz **Deploy from a branch**
3. Wybierz branch **main** i folder **/ (root)**
4. Kliknij **Save**

### 5. Uruchom pierwszy update

1. Przejdź do **Actions** → **Update Weather Data**
2. Kliknij **Run workflow** → **Run workflow**
3. Poczekaj na zakończenie (około 1-2 minuty)

### 6. Sprawdź czy działa

Twój widget będzie dostępny pod adresem:
```
https://TWOJA-NAZWA.github.io/NAZWA-REPO/
```

Przykład:
```
https://jankowalski.github.io/notion-weather-widget/
```

## 🔗 Integracja z Notion

### Krok 1: Przygotuj bazę danych

W swojej bazie danych "My Trips" dodaj pola:
- **Location** (Text) - nazwa miasta
- **Weather Widget** (URL) - automatycznie generowany link

### Krok 2: Dodaj formułę

W polu "Weather Widget" użyj formuły:

```notion
if(prop("Location") != "", 
   "https://TWOJA-NAZWA.github.io/NAZWA-REPO/weather-widget.html?city=" + prop("Location"),
   "Ustaw lokalizację"
)
```

**Zamień:**
- `TWOJA-NAZWA` na swoją nazwę użytkownika GitHub
- `NAZWA-REPO` na nazwę swojego repozytorium

### Krok 3: Osadź widget

1. W szablonie strony dodaj blok **Embed**
2. Jako URL użyj wartości z pola "Weather Widget"
3. Widget automatycznie wyświetli pogodę dla wybranego miasta

## 🌍 Obsługiwane miasta

Widget obsługuje następujące miasta (lista automatycznie aktualizowana):

**Polska:** Warsaw, Krakow, Gdansk, Wroclaw, Poznan

**Europa:** London, Paris, Berlin, Rome, Madrid, Amsterdam, Vienna, Prague, Budapest, Stockholm

**Ameryka Północna:** New York, Los Angeles, Chicago, Miami, San Francisco, Toronto, Vancouver, Montreal

**Azja:** Tokyo, Seoul, Beijing, Shanghai, Hong Kong, Singapore

**Oceania:** Sydney, Melbourne

**Bliski Wschód:** Dubai

### Dodawanie nowych miast

Aby dodać nowe miasto, edytuj plik `update-weather.js` i dodaj miasto do tablicy `cities`:

```javascript
const cities = [
    // ... istniejące miasta
    'Twoje Nowe Miasto'
];
```

## ⚙️ Konfiguracja

### Struktura plików

```
├── index.html              # Strona główna z demo
├── weather-widget.html     # Główny widget pogodowy
├── demo.html              # Strona demonstracyjna
├── update-weather.js      # Skrypt aktualizacji danych
├── package.json           # Zależności Node.js
├── data/
│   └── weather.json       # Cache danych pogodowych
├── .github/
│   └── workflows/
│       └── update-weather.yml  # GitHub Actions workflow
└── README.md              # Ta dokumentacja
```

### Personalizacja

#### Zmiana częstotliwości aktualizacji

W pliku `.github/workflows/update-weather.yml` zmień linię:

```yaml
# Co godzinę
- cron: '0 * * * *'

# Co 30 minut
- cron: '*/30 * * * *'

# Co 6 godzin
- cron: '0 */6 * * *'
```

#### Dostosowanie wyglądu

Edytuj plik `weather-widget.html` - wszystkie style CSS są wbudowane w plik.

#### Zmiana języka

W pliku `weather-widget.html` znajdź sekcję z tłumaczeniami i dostosuj teksty.

## 🔧 Rozwiązywanie problemów

### Widget nie ładuje się

1. **Sprawdź GitHub Pages:**
   - Settings → Pages → sprawdź czy jest włączone
   - Sprawdź czy deployment się udał w zakładce Actions

2. **Sprawdź klucz API:**
   - Settings → Secrets → sprawdź czy `OPENWEATHER_API_KEY` istnieje
   - Sprawdź czy klucz jest aktywny na OpenWeatherMap

3. **Sprawdź dane:**
   - Czy plik `data/weather.json` istnieje?
   - Czy GitHub Actions się wykonuje?

### Miasto nie jest obsługiwane

1. Dodaj miasto do pliku `update-weather.js`
2. Uruchom workflow ręcznie: Actions → Update Weather Data → Run workflow
3. Sprawdź logi czy miasto zostało poprawnie pobrane

### Błędy w GitHub Actions

1. **API Limit Exceeded:**
   - Zmniejsz częstotliwość aktualizacji
   - Sprawdź czy nie masz innych projektów używających tego samego klucza

2. **Invalid API Key:**
   - Sprawdź czy klucz w Secrets jest poprawny
   - Sprawdź czy klucz jest aktywny (może potrwać do 2h po rejestracji)

3. **Network Errors:**
   - Uruchom workflow ponownie - czasami to przejściowe problemy

## 🔄 Aktualizacje

### Automatyczne aktualizacje

- **Dane pogodowe:** Co godzinę przez GitHub Actions
- **Kod:** Ręcznie przez git pull z głównego repozytorium

### Ręczna aktualizacja danych

1. Przejdź do **Actions** → **Update Weather Data**
2. Kliknij **Run workflow**
3. Opcjonalnie podaj miasto do testowania
4. Kliknij **Run workflow**

### Aktualizacja kodu

Aby pobrać najnowsze zmiany z głównego repozytorium:

```bash
git remote add upstream https://github.com/ORIGINAL-OWNER/notion-weather-widget.git
git fetch upstream
git merge upstream/main
git push origin main
```

## 📊 Monitoring

### GitHub Actions

- **Actions** → **Update Weather Data** - historia aktualizacji
- Każdy run pokazuje podsumowanie: ile miast zaktualizowano, które się nie udały

### Logi

- W każdym workflow run znajdziesz szczegółowe logi
- Błędy API są logowane z kodami błędów
- Statystyki aktualizacji w sekcji Summary

## 🤝 Wsparcie

### Problemy

Jeśli napotkasz problemy:

1. Sprawdź [Issues](https://github.com/YOUR-USERNAME/notion-weather-widget/issues)
2. Przeczytaj sekcję "Rozwiązywanie problemów"
3. Utwórz nowy Issue z opisem problemu

### Funkcje

Masz pomysł na nową funkcję? Utwórz Issue z tagiem "enhancement".

## 📄 Licencja

MIT License - możesz swobodnie używać, modyfikować i dystrybuować.

## 🙏 Podziękowania

- [OpenWeatherMap](https://openweathermap.org/) - za darmowe API pogodowe
- [GitHub Pages](https://pages.github.com/) - za darmowy hosting
- [GitHub Actions](https://github.com/features/actions) - za automatyzację

---

**Utworzono z ❤️ dla społeczności Notion**

🌤️ **Miłej pogody w Twoich podróżach!** ✈️