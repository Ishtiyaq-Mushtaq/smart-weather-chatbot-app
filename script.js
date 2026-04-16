const apiKey = "5de3350123c2ad40a8fba42586d30797";

let savedCities = [];
let currentWeather = null;

/* ---------------- ENTER KEY (SEARCH + CHAT FIX) ---------------- */

document.addEventListener("keydown", function (event) {

    const chatInput = document.getElementById("chatInput");

    // If chatbot is focused → send chat
    if (document.activeElement === chatInput && event.key === "Enter") {
        sendChat();
        return;
    }

    // If main input is focused → search weather
    const cityInput = document.getElementById("city");

    if (document.activeElement === cityInput && event.key === "Enter") {
        getWeather();
    }
});

/* ---------------- WEATHER SEARCH ---------------- */

async function getWeather() {

    const city = document.getElementById("city").value.trim();
    if (!city) return alert("Enter location");

    fetchWeather(city);
}

/* ---------------- FIFI (MAX 3 SAVED CITIES) ---------------- */

function saveLocation(city) {

    if (!savedCities.includes(city)) {

        if (savedCities.length >= 3) {
            savedCities.shift();
        }

        savedCities.push(city);
        displaySavedLocations();
    }
}

function displaySavedLocations() {

    const box = document.getElementById("savedLocations");
    box.innerHTML = "";

    savedCities.forEach(city => {
        const btn = document.createElement("button");
        btn.innerText = "Swap: " + city;
        btn.onclick = () => fetchWeather(city);
        box.appendChild(btn);
    });
}

/* ---------------- SMART GEO SEARCH ---------------- */

async function fetchWeather(city) {

    const queries = [
        city,
        city + " sopore",
        city + " baramulla",
        city + " jammu and kashmir",
        city + " india"
    ];

    let geo = null;

    for (let q of queries) {

        const url =
            `https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=1&appid=${apiKey}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.length) {
            geo = data[0];
            break;
        }
    }

    if (!geo) {
        alert("Location not found");
        return;
    }

    const lat = geo.lat;
    const lon = geo.lon;

    const weatherUrl =
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const res = await fetch(weatherUrl);
    const data = await res.json();

    currentWeather = data;

    updateUI(data);
    getForecast(lat, lon);

    saveLocation(geo.name);
}

/* ---------------- UI ---------------- */

function updateUI(data) {

    document.getElementById("cityName").innerText = data.name;
    document.getElementById("temperature").innerText = "Temp: " + data.main.temp + "°C";
    document.getElementById("humidity").innerText = "Humidity: " + data.main.humidity + "%";
    document.getElementById("wind").innerText = "Wind: " + data.wind.speed + " m/s";

    document.getElementById("icon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    document.getElementById("description").innerText =
        data.weather[0].description + " | " + getOutfit(data.main.temp);
}

/* ---------------- OUTFIT ---------------- */

function getOutfit(temp) {
    if (temp <= 5) return "🧥 Heavy jacket";
    if (temp <= 15) return "🧥 Hoodie";
    if (temp <= 25) return "👕 Light clothes";
    return "☀️ Cotton clothes";
}

/* ---------------- FORECAST ---------------- */

async function getForecast(lat, lon) {

    const url =
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    const box = document.getElementById("forecast");
    box.innerHTML = "";

    const days = {};

    data.list.forEach(item => {
        const d = item.dt_txt.split(" ")[0];
        if (!days[d]) days[d] = item;
    });

    Object.keys(days).slice(0, 5).forEach(date => {

        const item = days[date];
        const w = item.weather[0].main.toLowerCase();

        let bg = "#2f80ed";
        let label = "Weather";

        if (w.includes("rain")) { bg = "#4e54c8"; label = "🌧 Rainy"; }
        else if (w.includes("cloud")) { bg = "#8e9eab"; label = "☁️ Cloudy"; }
        else if (w.includes("clear")) { bg = "#ffd200"; label = "☀️ Sunny"; }

        box.innerHTML += `
            <div class="forecast-card" style="background:${bg}">
                <p>${new Date(date).toDateString()}</p>
                <p>${label}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png">
                <p>${item.main.temp}°C</p>
            </div>
        `;
    });
}

/* ---------------- CHATBOT ---------------- */

function sendChat() {

    const input = document.getElementById("chatInput");
    const msg = input.value.trim().toLowerCase();

    if (!msg) return;

    addMsg("You: " + msg);

    if (!currentWeather) {
        addMsg("Bot: Search a location first 🌍");
        return;
    }

    const temp = currentWeather.main.temp;
    const weather = currentWeather.weather[0].main.toLowerCase();

    let reply = "Ask: wear / rain / hot / temp";

    if (msg.includes("wear")) reply = getOutfit(temp);
    else if (msg.includes("rain")) reply = weather.includes("rain") ? "Yes 🌧" : "No ☀️";
    else if (msg.includes("hot")) reply = temp > 30 ? "Yes 🔥" : "Normal";
    else if (msg.includes("temp")) reply = temp + "°C";

    addMsg("Bot: " + reply);

    input.value = "";
}

/* ---------------- CHAT HISTORY LIMIT (LAST 3 ONLY) ---------------- */

function addMsg(text) {

    const box = document.getElementById("chatMessages");

    box.innerHTML += "<div>" + text + "</div>";

    let messages = box.querySelectorAll("div");

    if (messages.length > 6) {
        // 3 user + 3 bot messages = 6 lines max
        box.removeChild(messages[0]);
        box.removeChild(messages[1]);
    }

    box.scrollTop = box.scrollHeight;
}

/* ---------------- LOCATION ---------------- */

function getLocationWeather() {

    navigator.geolocation.getCurrentPosition(async pos => {

        const url =
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${apiKey}&units=metric`;

        const res = await fetch(url);
        const data = await res.json();

        currentWeather = data;

        updateUI(data);
        getForecast(pos.coords.latitude, pos.coords.longitude);
    });
}