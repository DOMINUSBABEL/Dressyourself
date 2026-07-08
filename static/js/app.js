/**
 * Dress Yourself - Client Interactive Engine
 * Handles asynchronous API connections, state management, vision scanning, 
 * interactive fitting room, Aria's styles/personalities, silhouette hover highlight,
 * real-time community fashion tags, and personalized Outfit Builder.
 */

// App State Configuration
const STATE = {
    currentTab: 'clima',
    weather: null,
    closetItems: [],
    boutiqueItems: [],
    fittingSlots: {
        closet: null,
        boutique: null
    },
    ariaLook: 'base',
    ariaPersonality: 'classy',
    currentOrder: {
        id: 'DY-74692',
        status: 'Procesado', // Procesado, Enviado, En Camino, Entregado
        progress: 10,
        logs: [
            { time: '14:32', text: 'Orden recibida en Dress Yourself Atelier.' },
            { time: '15:10', text: 'Prendas curadas y preparadas en el empaque de seda.' }
        ]
    },
    trackingInterval: null,
    
    // Outfit Builder State
    builderSlots: {
        superior: null,
        inferior: null,
        calzado: null,
        abrigo: null,
        accesorio: null
    },
    activeBuilderSlot: null,
    savedCombinations: [],
    
    // Custom Redesign Features State
    userProfile: null,
    weatherClicks: 0,
    favorites: [],
    selectedCanvasItem: null,
    gpsCoords: null,
    canvasSource: 'closet'
};

// Look image map for Aria
const ARIA_LOOK_IMAGES = {
    base: 'static/proposals/Propuestas%20de%20Asistente%20Personal/Propuesta%20(Animada%20)/Propuesta%20Animada.png',
    castano_corto: 'static/proposals/Propuestas%20de%20Asistente%20Personal/Propuesta%20(Animada%20)/Versiones%20del%20personaje/Pelo%20Casta%C3%B1o%20Corto.jpeg',
    rojo_corto: 'static/proposals/Propuestas%20de%20Asistente%20Personal/Propuesta%20(Animada%20)/Versiones%20del%20personaje/Pelo%20Rojo%20corto.jpeg',
    rojo_largo: 'static/proposals/Propuestas%20de%20Asistente%20Personal/Propuesta%20(Animada%20)/Versiones%20del%20personaje/Pelo%20Rojo%20largo.jpeg',
    castano_gafas: 'static/proposals/Propuestas%20de%20Asistente%20Personal/Propuesta%20(Animada%20)/Versiones%20del%20personaje/Pelo%20casta%C3%B1o%20medio%20con%20gafas.jpeg',
    castano_medio: 'static/proposals/Propuestas%20de%20Asistente%20Personal/Propuesta%20(Animada%20)/Versiones%20del%20personaje/Pelo%20casta%C3%B1o%20medio.jpeg'
};

// Mock Databases (Fallback when Backend is offline)
const MOCK_DATA = {
    weather: {
        city: 'Bogotá, Colombia',
        temp: '17°C',
        desc: 'Llovizna ligera y niebla matutina',
        details: [
            { label: 'Humedad', value: '82%' },
            { label: 'Viento', value: '14 km/h' },
            { label: 'UV Index', value: 'Bajo' }
        ]
    },
    climaRecommendation: [
        {
            type: 'Abrigo',
            name: 'Abrigo Trench Impermeable Camel',
            part: 'mannequin-abrigo',
            why: 'Ideal para resguardarte de la llovizna sin perder el corte estructurado clásico.',
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
            badge: 'Clima Húmedo'
        },
        {
            type: 'Superior',
            name: 'Suéter de Cashmere Off-White',
            part: 'mannequin-superior',
            why: 'Aislamiento premium de tacto suave para mantener el confort térmico hoy.',
            image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop',
            badge: 'Térmico'
        },
        {
            type: 'Calzado',
            name: 'Botines Chelsea de Cuero Negro',
            part: 'mannequin-calzado',
            why: 'Suela antideslizante con acabado repelente al agua para caminar seguro en la pasarela urbana.',
            image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600&auto=format&fit=crop',
            badge: 'Protección'
        }
    ],
    closet: [
        { id: 'c1', cat: 'superior', name: 'Camisa Seda Champagne', style: 'Minimalist Luxury', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=500&auto=format&fit=crop' },
        { id: 'c2', cat: 'inferior', name: 'Pantalón Sastrero Crema', style: 'Modern Editorial', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=500&auto=format&fit=crop' },
        { id: 'c3', cat: 'abrigo', name: 'Blazer Negro Estructurado', style: 'Modern Classic', image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=500&auto=format&fit=crop' },
        { id: 'c4', cat: 'calzado', name: 'Mocasines de Cuero Miel', style: 'Heritage Classic', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=500&auto=format&fit=crop' },
        { id: 'c5', cat: 'superior', name: 'Body Knit Cuello Tortuga', style: 'Minimalist', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=500&auto=format&fit=crop' },
        { id: 'c6', cat: 'accesorio', name: 'Gafas de Sol Gold Style', style: 'High-Fashion Accent', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=500&auto=format&fit=crop' },
        { id: 'c7', cat: 'accesorio', name: 'Bolso Atelier de Cuero', style: 'Classic Editorial', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=500&auto=format&fit=crop' }
    ],
    boutique: [
        { id: 'b1', cat: 'superior', brand: 'VALENTINO', name: 'Vestido Golden Glow Lurex', price: '$450', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop' },
        { id: 'b2', cat: 'abrigo', brand: 'BALMAIN', name: 'Blazer Lino Sandstone', price: '$290', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500&auto=format&fit=crop' },
        { id: 'b3', cat: 'inferior', brand: 'CHANEL', name: 'Falda Plisada Champagne Satin', price: '$190', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=500&auto=format&fit=crop' },
        { id: 'b4', cat: 'calzado', brand: 'PRADA', name: 'Tacones Velvet Emerald', price: '$340', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500&auto=format&fit=crop' },
        { id: 'b5', cat: 'superior', brand: 'JIL SANDER', name: 'Camisa Oversize Silk Sage', price: '$160', image: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=500&auto=format&fit=crop' }
    ],
    isaQuotes: {
        classy: [
            "La sencillez es la clave de la verdadera elegancia, querido.",
            "Una silueta limpia nunca pasa de moda. Agrega textura antes que logos.",
            "Vístete como si fueras a encontrarte con tu peor enemigo hoy.",
            "La moda se compra, el estilo se posee. Busca armonía estructural."
        ],
        diva: [
            "¡Cariño! Ese look grita ordinario. ¡Necesitamos DRAMA! ¡Más volumen!",
            "¿Sin accesorios dorados? ¿Estamos de luto o simplemente no tenemos presupuesto?",
            "Si no se voltean a mirarte al entrar, el outfit fue un fracaso absoluto.",
            "Brillar no es una opción, es tu obligación moral. ¡Añade esa pieza de boutique ahora!"
        ],
        sarcastic: [
            "Veo que elegiste vestirte a oscuras hoy. Interesante declaración artística.",
            "Esa combinación es sumamente... 'valiente'. Ojalá nadie te pida fotos hoy.",
            "Oh, un blazer negro con jeans. Qué innovador. Estremecedor.",
            "¿Tu closet es un museo del aburrimiento o solo compraste todo en oferta?"
        ],
        nervous: [
            "¡Dios mío! ¿Crees que combina? Siento que la policía de la moda nos va a arrestar...",
            "Espera, ¿no crees que ese color choca demasiado? Por favor, miremos el espejo de nuevo.",
            "Espero que no llueva, esa gamuza se va a arruinar en un segundo... ¡Qué estrés!",
            "¿Estará bien? Quizás deberíamos ir 100% de negro y pasar desapercibidos..."
        ]
    },
    scanResults: {
        tipo: "Blazer Cruzado Sastrero",
        estilo: "Quiet Luxury / Neo-Sartorial",
        colores: ["#d4af37", "#1e1e1e", "#f5f5f5", "#a28325"],
        confianza: 98,
        consejo: "Este blazer cuenta con hombreras estructuradas y un solapado impecable. Combínalo con pantalones crema ligeros de seda o jeans oscuros de corte recto para un look semi-formal sofisticado. Agrega joyería champaña sutil."
    },
    posts: [
<<<<<<< HEAD
        { id: 1, user: 'Alessia V.', initials: 'AV', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop', desc: 'Tarde de lino y champaña con un blazer clásico.', votes: { aesthetic: 42, streetwear: 5, minimalist: 24, classic: 53, oversize: 8 }, userVoted: {} },
        { id: 2, user: 'Mateo Garces', initials: 'MG', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600&auto=format&fit=crop', desc: 'Quiet luxury en la ciudad. Paletas crema y botas altas.', votes: { aesthetic: 18, streetwear: 35, minimalist: 62, classic: 41, oversize: 27 }, userVoted: {} },
        { id: 3, user: 'Sophia Atelier', initials: 'SA', img: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=600&auto=format&fit=crop', desc: 'Probando el Vestidor de Isa. Combinación aprobada al 92%.', votes: { aesthetic: 75, streetwear: 12, minimalist: 19, classic: 25, oversize: 33 }, userVoted: {} }
=======
        { id: 'mock_1', user: 'Alessia V.', initials: 'AV', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop', desc: 'Tarde de lino y champaña con un blazer clásico.', rating: 4.8, rating_count: 53, userRating: 0 },
        { id: 'mock_2', user: 'Mateo Garces', initials: 'MG', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600&auto=format&fit=crop', desc: 'Quiet luxury en la ciudad. Paletas crema y botas altas.', rating: 4.2, rating_count: 41, userRating: 0 },
        { id: 'mock_3', user: 'Sophia Atelier', initials: 'SA', img: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=600&auto=format&fit=crop', desc: 'Probando el Vestidor de Aria. Combinación aprobada al 92%.', rating: 4.6, rating_count: 28, userRating: 0 }
>>>>>>> main
    ],
    initialOutfits: [
        {
            id: 'o1',
            name: 'Atelier Minimal Crema',
            occasion: 'Formal',
            items: [
                { cat: 'superior', name: 'Camisa Seda Champagne', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=150&auto=format&fit=crop' },
                { cat: 'inferior', name: 'Pantalón Sastrero Crema', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=150&auto=format&fit=crop' },
                { cat: 'abrigo', name: 'Blazer Negro Estructurado', image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=150&auto=format&fit=crop' },
                { cat: 'calzado', name: 'Mocasines de Cuero Miel', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=150&auto=format&fit=crop' }
            ]
        },
        {
            id: 'o2',
            name: 'Paseo de Otoño',
            occasion: 'Casual',
            items: [
                { cat: 'superior', name: 'Body Knit Cuello Tortuga', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=150&auto=format&fit=crop' },
                { cat: 'inferior', name: 'Pantalón Sastrero Crema', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=150&auto=format&fit=crop' },
                { cat: 'calzado', name: 'Mocasines de Cuero Miel', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=150&auto=format&fit=crop' },
                { cat: 'accesorio', name: 'Bolso Atelier de Cuero', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=150&auto=format&fit=crop' }
            ]
        }
    ]
};

// Document Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
    initNavigation();
    initWeather();
    initCloset();
    initBoutique();
    initAria();
    initScanner();
    initFittingRoom();
    initComunidad();
    initTracking();
    initOutfitBuilder();
    initLienzoLibre();
    initMaletaViaje();
    initGamification();
    initPriceTracker();
});

// 1. Dynamic Tab Navigation (Responsive support)
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn, .bottom-nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    if (!tabName) return;
    STATE.currentTab = tabName;
    
    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });

    const activeSection = document.getElementById(tabName);
    if (activeSection) {
        activeSection.classList.add('active');
        document.querySelector('.main-content').scrollTop = 0;
    }
    
    if (tabName === 'pedidos') {
        startTrackingSimulation();
    } else {
        stopTrackingSimulation();
    }
}

<<<<<<< HEAD
// 2. Weather & Daily Recommendations Integration (with interactive mannequin highlights)
let weatherSelectorsBound = false;

async function initWeather() {
    const city = STATE.userProfile ? STATE.userProfile.city : 'Bogotá, Colombia';
    const occasionBtn = document.querySelector('.context-btn.active');
    const occasion = occasionBtn ? occasionBtn.getAttribute('data-context') : 'Casual';
    
    // Bind context selectors once
    if (!weatherSelectorsBound) {
        setupWeatherContextSelectors();
        weatherSelectorsBound = true;
    }

    try {
        let weatherUrl = `/api/weather/live?city=${encodeURIComponent(city)}`;
        if (STATE.gpsCoords) {
            weatherUrl = `/api/weather/live?lat=${STATE.gpsCoords.lat}&lon=${STATE.gpsCoords.lon}&city_name=Ubicación GPS`;
        }
        const response = await fetch(weatherUrl);
        if (!response.ok) throw new Error("Fallback to mock");
        const data = await response.json();
        renderWeather(data);
        
        // Fetch recommendations from API based on location/context
        const recResponse = await fetch(`/api/recommend?city_index=0&occasion=${encodeURIComponent(occasion)}`);
        if (recResponse.ok) {
            const recData = await recResponse.json();
            const recommended = [];
            if (recData.recommended_clothes) {
                const catMap = { 'Top': 'mannequin-superior', 'Bottom': 'mannequin-inferior', 'Outerwear': 'mannequin-abrigo', 'Footwear': 'mannequin-calzado' };
                recData.recommended_clothes.forEach(rc => {
                    recommended.push({
                        type: rc.category,
                        name: rc.name,
                        part: catMap[rc.category] || 'mannequin-superior',
                        why: recData.justification || 'Prenda seleccionada especialmente por Isa.',
                        image: rc.image_url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200',
                        badge: rc.style || 'Isa Choice'
                    });
                });
            }
            renderRecommendations(recommended.length ? recommended : MOCK_DATA.climaRecommendation);
        } else {
            renderRecommendations(MOCK_DATA.climaRecommendation);
        }
=======
// 2. Weather & Daily Recommendations Integration (with GPS geolocation, Nominatim reverse geocoding & location picker)
async function initWeather() {
    initLocationModal();

    // Check if user manually saved a location previously
    const savedCityIndex = localStorage.getItem('dy_selected_city_index');
    if (savedCityIndex !== null && localStorage.getItem('dy_use_gps') !== 'true') {
        await loadWeatherByCityIndex(parseInt(savedCityIndex));
        return;
    }

    // Try to get real GPS coordinates
    let geoCoords = null;
    try {
        geoCoords = await getDeviceLocation();
    } catch (geoErr) {
        console.log("GPS not available, using default weather:", geoErr.message);
    }

    if (geoCoords) {
        await loadWeatherByGPS(geoCoords.latitude, geoCoords.longitude);
    } else {
        // Fallback to default city (Bogota, index 0)
        await loadWeatherByCityIndex(0);
    }
}

// Get device GPS location
function getDeviceLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation API no soportada"));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    });
}

// Reverse geocode via Nominatim OSM or fallback to nearest Colombian city
async function getReverseGeocoding(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`, {
            headers: { 'Accept-Language': 'es' }
        });
        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state;
            return cityName ? `📍 ${cityName}` : null;
        }
    } catch (e) {
        console.warn("Nominatim reverse geocoding failed, using fallback:", e);
    }
    
    // Fallback: nearest city name in JS
    const nearest = getNearestColombianCity(lat, lon);
    return `📍 ${nearest.name} (Aprox.)`;
}

// Nearest Colombian city helper
function getNearestColombianCity(lat, lon) {
    const cities = [
        { index: 0, name: "Bogotá", lat: 4.7110, lon: -74.0721 },
        { index: 1, name: "Medellín", lat: 6.2442, lon: -75.5812 },
        { index: 2, name: "Cali", lat: 3.4516, lon: -76.5320 },
        { index: 3, name: "Barranquilla", lat: 10.9685, lon: -74.7813 },
        { index: 4, name: "Cartagena", lat: 10.3910, lon: -75.5144 },
        { index: 5, name: "Bucaramanga", lat: 7.1254, lon: -73.1198 },
        { index: 6, name: "Pereira", lat: 4.8087, lon: -75.6906 },
        { index: 7, name: "Santa Marta", lat: 11.2408, lon: -74.1990 },
        { index: 8, name: "Manizales", lat: 5.0689, lon: -75.5174 },
        { index: 9, name: "Ibagué", lat: 4.4389, lon: -75.2322 }
    ];
    let bestDist = Infinity;
    let bestCity = cities[0];
    for (const city of cities) {
        const dist = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2));
        if (dist < bestDist) {
            bestDist = dist;
            bestCity = city;
        }
    }
    return bestCity;
}

// Load weather based on city index
async function loadWeatherByCityIndex(cityIndex) {
    try {
        const response = await fetch(`/api/clima?city_index=${cityIndex}`);
        if (!response.ok) throw new Error("API Clima Fallback");
        const data = await response.json();
        renderWeather(data);
        await loadRecommendations();
>>>>>>> main
    } catch (e) {
        // Mock fallback matching the index
        const cities = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta", "Manizales", "Ibagué"];
        const mock = { ...MOCK_DATA.weather, city: cities[cityIndex] || "Bogotá" };
        renderWeather(mock);
        renderRecommendations(MOCK_DATA.climaRecommendation);
    }
}

<<<<<<< HEAD
function setupWeatherContextSelectors() {
    const ctxButtons = document.querySelectorAll('.context-btn');
    ctxButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            ctxButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Increment clicks for gamification
            STATE.weatherClicks++;
            checkGamificationMilestones();
            
            initWeather();
        });
    });
    
    const recalculateBtn = document.getElementById('btn-recalculate-ootd');
    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', () => {
            STATE.weatherClicks++;
            checkGamificationMilestones();
            initWeather();
            showToast("Outfit recalculado para el clima de hoy.");
        });
    }

    const gpsBtn = document.getElementById('btn-gps');
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                gpsBtn.disabled = true;
                gpsBtn.textContent = "📍 Buscando...";
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        STATE.gpsCoords = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        gpsBtn.disabled = false;
                        gpsBtn.textContent = "📍 Usar GPS";
                        initWeather();
                        showToast("Ubicación GPS sincronizada correctamente.", "success");
                    },
                    (error) => {
                        gpsBtn.disabled = false;
                        gpsBtn.textContent = "📍 Usar GPS";
                        showToast("Error de geolocalización: " + error.message, "error");
                    }
                );
            } else {
                showToast("Geolocalización no soportada por este navegador.", "error");
            }
        });
    }
}

=======
// Load weather based on coordinates
async function loadWeatherByGPS(lat, lon) {
    const nearestCity = getNearestColombianCity(lat, lon);
    const resolvedName = await getReverseGeocoding(lat, lon);

    try {
        const response = await fetch(`/api/clima?lat=${lat}&lon=${lon}`);
        if (!response.ok) throw new Error("API GPS Fallback");
        const data = await response.json();
        if (resolvedName) data.city = resolvedName;
        renderWeather(data);
        await loadRecommendations();
    } catch (e) {
        // Offline / Fallback
        const mock = {
            city: resolvedName || `📍 ${nearestCity.name} (Aprox.)`,
            temp: "17°C",
            desc: "Nublado con ráfagas suaves (GPS activo, sin servidor)",
            details: [
                { label: "Condición", value: "Nublado" },
                { label: "GPS", value: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` },
                { label: "Ciudad Cercana", value: nearestCity.name }
            ]
        };
        renderWeather(mock);
        renderRecommendations(MOCK_DATA.climaRecommendation);
    }
}

// Helper to fetch recommendations
async function loadRecommendations() {
    try {
        const recResponse = await fetch('/api/recommend');
        if (recResponse.ok) {
            const recData = await recResponse.json();
            renderRecommendations(recData.items || MOCK_DATA.climaRecommendation);
        } else {
            renderRecommendations(MOCK_DATA.climaRecommendation);
        }
    } catch (recErr) {
        renderRecommendations(MOCK_DATA.climaRecommendation);
    }
}

// Location Modal Event Handlers
function initLocationModal() {
    const btnChange = document.getElementById('btn-change-location');
    const modal = document.getElementById('location-modal');
    const btnClose = document.getElementById('btn-close-location');
    const btnUseGps = document.getElementById('btn-use-gps');
    const btnSave = document.getElementById('btn-save-location');
    const select = document.getElementById('location-select');

    if (!btnChange || !modal) return;

    btnChange.onclick = () => {
        modal.style.display = 'flex';
        const savedIndex = localStorage.getItem('dy_selected_city_index');
        if (savedIndex !== null) select.value = savedIndex;
    };

    btnClose.onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    btnUseGps.onclick = async () => {
        btnUseGps.setAttribute('disabled', 'true');
        btnUseGps.querySelector('span').textContent = "Buscando satélites...";
        localStorage.setItem('dy_use_gps', 'true');

        try {
            const coords = await getDeviceLocation();
            await loadWeatherByGPS(coords.latitude, coords.longitude);
            showToast("Ubicación actualizada con éxito por GPS.");
            modal.style.display = 'none';
        } catch (err) {
            showToast("No se pudo obtener la ubicación GPS.", "error");
        } finally {
            btnUseGps.removeAttribute('disabled');
            btnUseGps.querySelector('span').textContent = "🛰️ Usar ubicación GPS actual";
        }
    };

    btnSave.onclick = async () => {
        const index = select.value;
        localStorage.setItem('dy_use_gps', 'false');
        localStorage.setItem('dy_selected_city_index', index);
        
        await loadWeatherByCityIndex(parseInt(index));
        showToast("Ubicación cambiada manualmente.");
        modal.style.display = 'none';
    };
}


>>>>>>> main
function renderWeather(data) {
    document.getElementById('weather-city').textContent = data.city;
    document.getElementById('weather-temp').textContent = data.temp;
    document.getElementById('weather-desc').textContent = data.desc;
    
    const detailsEl = document.getElementById('weather-details');
    detailsEl.innerHTML = '';
    
    if (data.details && data.details.length) {
        data.details.forEach(detail => {
            const item = document.createElement('div');
            item.className = 'weather-extra-item';
            item.innerHTML = `
                <span class="weather-extra-label">${detail.label}</span>
                <span class="weather-extra-value">${detail.value}</span>
            `;
            detailsEl.appendChild(item);
        });
    }
}

function renderRecommendations(items) {
    const recShowcaseEl = document.getElementById('clima-recommendation');
    if (recShowcaseEl) recShowcaseEl.innerHTML = '';
    
    const flatlayCollage = document.getElementById('clima-flatlay-collage');
    if (flatlayCollage) flatlayCollage.innerHTML = '';

    items.forEach((item, index) => {
        // 1. Create Showcase card (Right Panel)
        const card = document.createElement('div');
        card.className = 'rec-card';
        card.setAttribute('data-part', item.part);
        card.setAttribute('data-idx', index);
        card.innerHTML = `
            <div class="rec-img-wrapper">
                <span class="rec-badge">${item.badge}</span>
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
            </div>
            <div class="rec-details">
                <span class="rec-type">${item.type}</span>
                <h4 class="rec-name">${item.name}</h4>
                <p class="rec-why">"${item.why}"</p>
            </div>
        `;

        // 2. Create Flat Lay Polaroid Item for the Canvas
        if (flatlayCollage) {
            const rotation = [4, -5, 3, -6, 2][index % 5];
            const polaroid = document.createElement('div');
            polaroid.id = `clima-polaroid-${index}`;
            polaroid.style.width = '75px';
            polaroid.style.height = '75px';
            polaroid.style.borderRadius = '6px';
            polaroid.style.border = '1.5px solid var(--border-gold)';
            polaroid.style.background = '#111';
            polaroid.style.overflow = 'hidden';
            polaroid.style.transform = `rotate(${rotation}deg)`;
            polaroid.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.3)';
            polaroid.style.position = 'relative';
            polaroid.style.transition = 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)';
            polaroid.style.cursor = 'pointer';
            polaroid.innerHTML = `
                <img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%23222%27 width=%27100%27 height=%27100%27/%3E%3C/svg%3E';">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(212,175,55,0); transition: background 0.2s;"></div>
            `;

            // Hover sync from Polaroid to Card
            polaroid.addEventListener('mouseenter', () => {
                polaroid.style.transform = 'scale(1.2) rotate(0deg)';
                polaroid.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
                polaroid.style.borderColor = '#00ff88';
                card.classList.add('highlighted-card');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            polaroid.addEventListener('mouseleave', () => {
                polaroid.style.transform = `rotate(${rotation}deg)`;
                polaroid.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.3)';
                polaroid.style.borderColor = 'var(--border-gold)';
                card.classList.remove('highlighted-card');
            });

            flatlayCollage.appendChild(polaroid);
        }

        // Hover sync from Card to Polaroid
        card.addEventListener('mouseenter', () => {
            const polaroid = document.getElementById(`clima-polaroid-${index}`);
            if (polaroid) {
                polaroid.style.transform = 'scale(1.2) rotate(0deg)';
                polaroid.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
                polaroid.style.borderColor = '#00ff88';
            }
        });

        card.addEventListener('mouseleave', () => {
            const polaroid = document.getElementById(`clima-polaroid-${index}`);
            const rotation = [4, -5, 3, -6, 2][index % 5];
            if (polaroid) {
                polaroid.style.transform = `rotate(${rotation}deg)`;
                polaroid.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.3)';
                polaroid.style.borderColor = 'var(--border-gold)';
            }
        });

        if (recShowcaseEl) recShowcaseEl.appendChild(card);
    });
}

// 3. Virtual Closet Manager
async function initCloset() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    await loadClosetItems();
    await loadSavedOutfits();

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-filter');
            renderCloset(category);
        });
    });
}

// Map backend category names to frontend category keys
function mapCategory(backendCat) {
    const map = {
        'Top': 'superior',
        'Bottom': 'inferior',
        'Footwear': 'calzado',
        'Outerwear': 'abrigo',
        'Accessory': 'accesorio'
    };
    return map[backendCat] || backendCat;
}

async function loadClosetItems() {
    try {
        const response = await fetch('/api/clothes?owned=true');
        if (!response.ok) throw new Error("Fallback");
        const data = await response.json();
        // Map backend field names to frontend expected shape
        STATE.closetItems = data.map(item => ({
            id: item.id,
            cat: mapCategory(item.category),
            name: item.name,
            style: item.pattern || 'Classic',
            image: item.image_url
        }));
    } catch (e) {
        STATE.closetItems = [...MOCK_DATA.closet];
    }
    renderCloset('all');
}

function renderCloset(category) {
    const closetGrid = document.getElementById('closet-grid');
    closetGrid.innerHTML = '';

    const filtered = category === 'all' 
        ? STATE.closetItems 
        : STATE.closetItems.filter(item => item.cat === category);

    if (filtered.length === 0) {
        closetGrid.innerHTML = `
            <div class="loading-spinner-container">
                <p>No tienes prendas registradas en esta categoría.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'closet-card';
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'closet', item }));
        });
        
        card.addEventListener('click', () => {
            selectForFitting('closet', item);
        });

        card.innerHTML = `
            <div class="closet-img-wrapper">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.style.objectFit='contain'; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 250%22><rect fill=%22%23171717%22 width=%22200%22 height=%22250%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23646464%22 font-size=%2214%22 text-anchor=%22middle%22 dy=%22.3em%22>Imagen no disponible</text></svg>';">
                <span class="closet-style-tag">${item.style || ''}</span>
            </div>
            <div class="closet-info">
                <span class="closet-cat">${item.cat}</span>
                <div class="closet-name">${item.name}</div>
            </div>
        `;
        closetGrid.appendChild(card);
    });
}

// Saved combinations loaders
async function loadSavedOutfits() {
    try {
        const response = await fetch('/api/outfits');
        if (!response.ok) throw new Error("Fallback");
        const data = await response.json();
        // Transform backend flat structure to frontend items-array structure
        STATE.savedCombinations = data.map(outfit => {
            const items = [];
            if (outfit.top_image) items.push({ cat: 'superior', name: outfit.top_name, image: outfit.top_image });
            if (outfit.bottom_image) items.push({ cat: 'inferior', name: outfit.bottom_name, image: outfit.bottom_image });
            if (outfit.footwear_image) items.push({ cat: 'calzado', name: outfit.footwear_name, image: outfit.footwear_image });
            if (outfit.outerwear_image) items.push({ cat: 'abrigo', name: outfit.outerwear_name, image: outfit.outerwear_image });
            if (outfit.accessory_image) items.push({ cat: 'accesorio', name: outfit.accessory_name, image: outfit.accessory_image });
            return {
                id: outfit.id,
                name: outfit.name,
                occasion: outfit.justification ? 'Curado' : 'Casual',
                items: items
            };
        });
    } catch (e) {
        STATE.savedCombinations = [...MOCK_DATA.initialOutfits];
    }
    renderSavedCombinations();
}

function renderSavedCombinations() {
    const grid = document.getElementById('combinations-grid');
    grid.innerHTML = '';

    if (STATE.savedCombinations.length === 0) {
        grid.innerHTML = `
            <div class="loading-spinner-container" style="grid-column: 1 / -1; padding: 30px;">
                <p style="font-size:0.9rem; color:var(--text-muted);">Aún no has diseñado ninguna combinación. ¡Haz clic arriba en "Diseñar Outfit" para comenzar!</p>
            </div>
        `;
        return;
    }

    STATE.savedCombinations.forEach(combo => {
        const card = document.createElement('div');
        card.className = 'combination-card animate-fade-in';
        
        // Build items HTML thumbnails
        let thumbsHTML = '';
        combo.items.forEach(itm => {
            if (itm && itm.image) {
                thumbsHTML += `
                    <div class="combo-item-thumb" title="${itm.name}">
                        <img src="${itm.image}" alt="${itm.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
                    </div>
                `;
            }
        });

        card.innerHTML = `
            <div class="combo-header">
                <h4 class="combo-name">${combo.name}</h4>
                <span class="combo-occasion">${combo.occasion}</span>
            </div>
            <div class="combo-elements-previews">
                ${thumbsHTML}
            </div>
            <div class="combo-actions">
                <button class="combo-tryon-btn" data-id="${combo.id}">Probar Outfit</button>
                <button class="delete-combo-btn" data-id="${combo.id}">&times;</button>
            </div>
        `;

        // Click on "Probar Outfit" places top/bottom in fitting slots automatically
        card.querySelector('.combo-tryon-btn').addEventListener('click', () => {
            const top = combo.items.find(i => i.cat === 'superior');
            const bottom = combo.items.find(i => i.cat === 'inferior');

            if (top) selectForFitting('closet', top);
            
            // For Boutique slot, let's load a random matching boutique item to keep fitting room full
            if (MOCK_DATA.boutique.length) {
                selectForFitting('boutique', MOCK_DATA.boutique[Math.floor(Math.random() * MOCK_DATA.boutique.length)]);
            }

            switchTab('probador');
            showToast("Prendas cargadas en el probador interactivo.");
        });

        // Delete button
        card.querySelector('.delete-combo-btn').addEventListener('click', async () => {
            if (!confirm(`¿Eliminar la combinación "${combo.name}"?`)) return;

            try {
                await fetch(`/api/outfits/${combo.id}`, { method: 'DELETE' });
            } catch (err) {
                // fall through
            }

            STATE.savedCombinations = STATE.savedCombinations.filter(c => c.id !== combo.id);
            renderSavedCombinations();
            showToast("Combinación eliminada con éxito.");
        });

        grid.appendChild(card);
    });
}

// 4. Isa Assistant Engine
function initAria() {
    const lookSelector = document.getElementById('aria-look');
    const personalitySelector = document.getElementById('personality');
    const portraitImg = document.getElementById('aria-portrait');
    const sendBtn = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');

    lookSelector.addEventListener('change', (e) => {
        const lookKey = e.target.value;
        STATE.ariaLook = lookKey;
        
        portraitImg.style.opacity = '0';
        setTimeout(() => {
            portraitImg.src = ARIA_LOOK_IMAGES[lookKey] || ARIA_LOOK_IMAGES.base;
            portraitImg.style.opacity = '1';
        }, 300);

        triggerAriaSpeech(`He cambiado mi apariencia a ${e.target.options[e.target.selectedIndex].text}. ¿Qué tal me queda?`);
    });

    personalitySelector.addEventListener('change', (e) => {
        STATE.ariaPersonality = e.target.value;
        triggerAriaSpeech(getRandomQuote());
    });

    portraitImg.addEventListener('click', () => {
        triggerAriaSpeech(getRandomQuote());
    });

    sendBtn.addEventListener('click', handleUserMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });
}

function getRandomQuote() {
    const quotes = MOCK_DATA.isaQuotes[STATE.ariaPersonality] || MOCK_DATA.isaQuotes.classy;
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function triggerAriaSpeech(text) {
    const speechEl = document.getElementById('aria-speech');
    const pulseRing = document.querySelector('.aria-pulse-ring');
    
    speechEl.style.opacity = '0';
    
    if (pulseRing) {
        pulseRing.classList.add('talking');
        setTimeout(() => {
            pulseRing.classList.remove('talking');
        }, 2500);
    }

    setTimeout(() => {
        speechEl.textContent = text;
        speechEl.style.opacity = '1';
    }, 200);
}

async function handleUserMessage() {
    const chatInput = document.getElementById('chat-input');
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    appendChatMessage('user', text);

    try {
        const response = await fetch(`/api/ganchito/quote?personality=${STATE.ariaPersonality}&q=${encodeURIComponent(text)}`);
        if (!response.ok) throw new Error("Fallback");
        const data = await response.json();
        
        // Check if query contained a shop URL resulting in a scraped item
        if (data.scraped_item) {
            appendChatMessage('bot', data.response, data.scraped_item);
        } else {
            appendChatMessage('bot', data.response);
        }
        triggerAriaSpeech(data.response);
    } catch (e) {
        setTimeout(() => {
            const botReplies = {
                classy: `Como asesora de tu closet, considero que "${text}" queda excelente con un blazer sastrero clásico. Menos es siempre más.`,
                diva: `¡Ay, cariño! Sobre "${text}"... Si no te hace resaltar bajo los reflectores de la pasarela, ¡siguiente prenda!`,
                sarcastic: `¿En serio me preguntas por "${text}"? Isa te aconseja que revisemos esa decisión antes de salir al público.`,
                nervous: `¡Ay no sé! Sobre "${text}"... espero que no llame demasiado la atención de forma incorrecta. ¿Qué tal un total black?`
            };
            const reply = botReplies[STATE.ariaPersonality] || botReplies.classy;
            appendChatMessage('bot', reply);
            triggerAriaSpeech(reply);
        }, 1000);
    }
}

function appendChatMessage(sender, text, scrapedItem = null) {
    const history = document.getElementById('chat-history');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.textContent = text;
    
    if (scrapedItem) {
        const card = document.createElement('div');
        card.style.marginTop = '10px';
        card.style.padding = '12px';
        card.style.background = 'rgba(255,255,255,0.04)';
        card.style.border = '1px solid var(--border-gold)';
        card.style.borderRadius = '8px';
        card.style.display = 'flex';
        card.style.gap = '10px';
        card.style.alignItems = 'center';
        
        // Escape single quotes for HTML attribute JSON
        const escapedItem = JSON.stringify(scrapedItem).replace(/'/g, "&apos;");
        
        card.innerHTML = `
            <img src="${scrapedItem.image}" alt="${scrapedItem.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(212,175,55,0.2);">
            <div style="flex-grow: 1; display: flex; flex-direction: column; text-align: left;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${scrapedItem.brand}</span>
                <span style="font-size: 0.85rem; font-weight: bold; color: var(--text-primary); max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${scrapedItem.name}</span>
                <span style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 600;">${scrapedItem.price}</span>
            </div>
            <button class="gold-btn" style="padding: 6px 10px; font-size: 0.7rem; text-transform: none; letter-spacing: 0;" onclick='loadScrapedToFitting(${escapedItem})'>
                Probar
            </button>
        `;
        msg.appendChild(card);
    }
    
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
}

// 5. Vision Scanner & AI Cataloging (With mandatory 2-second scan delay)
// Helper: Analiza la imagen localmente usando Canvas para extraer color predominante y estimar categoría
function analyzeImageLocally(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 50, 50);
                
                let imgData;
                try {
                    imgData = ctx.getImageData(0, 0, 50, 50).data;
                } catch (err) {
                    // Fallback if canvas tainted
                    resolve({
                        tipo: "Prenda Casual",
                        estilo: "Liso",
                        colores: ["#708090"],
                        confianza: 85,
                        consejo: "Análisis básico completado. Combina con neutros."
                    });
                    return;
                }

                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                for (let i = 0; i < imgData.length; i += 4) {
                    const r = imgData[i];
                    const g = imgData[i+1];
                    const b = imgData[i+2];
                    const a = imgData[i+3];
                    if (a > 150) {
                        const isWhite = r > 235 && g > 235 && b > 235;
                        const isBlack = r < 25 && g < 25 && b < 25;
                        if (!isWhite && !isBlack) {
                            rSum += r; gSum += g; bSum += b; count++;
                        }
                    }
                }
                
                if (count === 0) {
                    for (let i = 0; i < imgData.length; i += 4) {
                        rSum += imgData[i]; gSum += imgData[i+1]; bSum += imgData[i+2]; count++;
                    }
                }
                
                const r = Math.round(rSum / count);
                const g = Math.round(gSum / count);
                const b = Math.round(bSum / count);
                
                // Map color name in Spanish
                const colorMap = {
                    "Blanco": [245, 245, 245],
                    "Negro": [25, 25, 25],
                    "Gris": [128, 128, 128],
                    "Azul Marino": [15, 32, 67],
                    "Azul Celeste": [135, 206, 250],
                    "Verde Oliva": [85, 107, 47],
                    "Verde Esmeralda": [0, 201, 87],
                    "Rojo": [200, 20, 30],
                    "Marrón": [139, 69, 19],
                    "Beige": [245, 245, 220],
                    "Amarillo": [218, 165, 32],
                    "Naranja": [210, 105, 30],
                    "Rosa": [255, 192, 203],
                    "Morado": [128, 0, 128]
                };
                
                let color_name = "Gris";
                let min_d = Infinity;
                for (const [name, rgb] of Object.entries(colorMap)) {
                    const dist = Math.sqrt((r - rgb[0])**2 + (g - rgb[1])**2 + (b - rgb[2])**2);
                    if (dist < min_d) {
                        min_d = dist; color_name = name;
                    }
                }
                
                const hexColor = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                
                // Categorize by file name heuristics
                const fname = (file.name || "").toLowerCase();
                let cat = "superior";
                let tipo = "Camiseta";
                
                if (fname.includes("pant") || fname.includes("jean") || fname.includes("short") || fname.includes("falda") || fname.includes("leggin")) {
                    cat = "inferior";
                    tipo = fname.includes("falda") ? "Falda" : (fname.includes("jean") ? "Jeans" : "Pantalón");
                } else if (fname.includes("shoe") || fname.includes("zapa") || fname.includes("bota") || fname.includes("tenis") || fname.includes("heel") || fname.includes("calzado")) {
                    cat = "calzado";
                    tipo = fname.includes("bota") ? "Botas" : (fname.includes("tenis") ? "Tenis" : "Zapatos");
                } else if (fname.includes("jacket") || fname.includes("coat") || fname.includes("abrigo") || fname.includes("saco") || fname.includes("blazer") || fname.includes("chaqueta")) {
                    cat = "abrigo";
                    tipo = fname.includes("blazer") ? "Blazer" : "Chaqueta / Abrigo";
                } else if (fname.includes("bag") || fname.includes("bols") || fname.includes("glass") || fname.includes("gafa") || fname.includes("belt") || fname.includes("accesorio")) {
                    cat = "accesorio";
                    tipo = fname.includes("gafa") ? "Gafas de Sol" : "Bolso / Accesorio";
                } else {
                    const cats = ["superior", "inferior", "calzado", "abrigo", "accesorio"];
                    cat = cats[Math.floor(Math.random() * cats.length)];
                    const types = {
                        superior: ["Camiseta", "Camisa de Seda", "Top Knit", "Blusa"],
                        inferior: ["Pantalón Sastrero", "Jeans Denim", "Falda Plisada"],
                        calzado: ["Tacones de Cuero", "Mocasines", "Tenis Deportivos"],
                        abrigo: ["Blazer Cruzado", "Chaqueta Denim", "Abrigo de Lana"],
                        accesorio: ["Bolso de Mano", "Bufanda de Seda", "Gafas de Sol"]
                    };
                    tipo = types[cat][Math.floor(Math.random() * types[cat].length)];
                }
                
                const estilos = ["Minimalista", "Quiet Luxury", "Streetwear", "Clásico", "Moderno"];
                const estilo = estilos[Math.floor(Math.random() * estilos.length)];
                const confianza = Math.round(75 + Math.random() * 23);
                
                resolve({
                    tipo: tipo,
                    estilo: estilo,
                    colores: [hexColor],
                    confianza: confianza,
                    consejo: `Prenda catalogada localmente (GPS/Offline). Tipo: ${tipo} (${color_name}). Estilo: ${estilo}. Combina excelente con tonos complementarios.`,
                    cat: cat,
                    offline: true
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 5. Vision Scanner & AI Cataloging (With multiple file and camera support)
function initScanner() {
    const dropZone = document.getElementById('scanner-drop-zone');
    const fileInput = document.getElementById('scanner-file-input');
    const btnScan = document.getElementById('btn-scan');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewWrapper = document.getElementById('scan-preview-wrapper');
    const previewImg = document.getElementById('scan-preview-img');
    const laser = document.getElementById('scan-laser');
    const resultsBox = document.getElementById('scan-results-box');
    const thumbsContainer = document.getElementById('scan-thumbnails-container');

    STATE.scanQueue = [];
    STATE.activeScanIndex = 0;

    dropZone.addEventListener('click', (e) => {
        // Prevent click trigger if clicking inside thumbnails container
        if (thumbsContainer.contains(e.target)) return;
        fileInput.click();
    });
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent-gold)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border-gold)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-gold)';
        if (e.dataTransfer.files.length) {
            handleSelectedFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleSelectedFiles(e.target.files);
        }
    });

    function handleSelectedFiles(fileList) {
        STATE.scanQueue = [];
        STATE.activeScanIndex = 0;
        thumbsContainer.innerHTML = '';
        resultsBox.style.display = 'none';

        const files = Array.from(fileList);
        let loadedCount = 0;

        files.forEach((file, index) => {
            const item = {
                file: file,
                base64: null,
                status: 'pending',
                result: null
            };
            STATE.scanQueue.push(item);

            const reader = new FileReader();
            reader.onload = (event) => {
                item.base64 = event.target.result;
                
                // Create thumbnail
                const thumb = document.createElement('div');
                thumb.className = `scan-thumb ${index === 0 ? 'active' : ''}`;
                thumb.id = `scan-thumb-${index}`;
                thumb.innerHTML = `
                    <img src="${event.target.result}" alt="Thumbnail">
                    <span class="scan-thumb-badge pending" id="scan-badge-${index}">⌛</span>
                `;
                
                thumb.onclick = (e) => {
                    e.stopPropagation();
                    selectQueueItem(index);
                };
                
                thumbsContainer.appendChild(thumb);

                loadedCount++;
                if (loadedCount === files.length) {
                    selectQueueItem(0);
                    uploadPlaceholder.style.display = 'none';
                    previewWrapper.style.display = 'flex';
                    btnScan.removeAttribute('disabled');
                    
                    if (files.length > 1) {
                        btnScan.querySelector('.btn-text').textContent = `Escanear prendas (${files.length})`;
                    } else {
                        btnScan.querySelector('.btn-text').textContent = 'Iniciar Escaneo';
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function selectQueueItem(index) {
        STATE.activeScanIndex = index;
        document.querySelectorAll('.scan-thumb').forEach(t => t.classList.remove('active'));
        
        const activeThumb = document.getElementById(`scan-thumb-${index}`);
        if (activeThumb) activeThumb.classList.add('active');

        const activeItem = STATE.scanQueue[index];
        if (activeItem) {
            previewImg.src = activeItem.base64;
            if (activeItem.status === 'completed' && activeItem.result) {
                showScanResults(activeItem.result);
            } else {
                resultsBox.style.display = 'none';
            }
        }
    }

    btnScan.addEventListener('click', async () => {
        btnScan.setAttribute('disabled', 'true');
        laser.classList.add('active');

        if (STATE.scanQueue.length === 1) {
            // SINGLE SCAN FLOW
            btnScan.querySelector('.btn-text').textContent = 'Escaneando prenda...';
            btnScan.querySelector('.spinner-small').style.display = 'block';
            
            const activeItem = STATE.scanQueue[0];
            const badge = document.getElementById('scan-badge-0');
            if (badge) badge.textContent = '⚙️';

            const startTime = Date.now();
            let result = null;

            const formData = new FormData();
            formData.append('image', activeItem.file);

            try {
                const response = await fetch('/api/scan', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    result = await response.json();
                }
            } catch (err) {
                console.log("Offline scan, using Canvas color analysis");
            }

            if (!result) {
                result = await analyzeImageLocally(activeItem.file);
            }

            const elapsed = Date.now() - startTime;
            const remainingDelay = Math.max(1500 - elapsed, 0);

            setTimeout(() => {
                laser.classList.remove('active');
                btnScan.removeAttribute('disabled');
                btnScan.querySelector('.btn-text').textContent = 'Iniciar Escaneo';
                btnScan.querySelector('.spinner-small').style.display = 'none';
                
                activeItem.status = 'completed';
                activeItem.result = result;
                if (badge) {
                    badge.className = 'scan-thumb-badge scanned';
                    badge.textContent = '✓';
                }
                showScanResults(result);
            }, remainingDelay);

        } else {
            // MULTIPLE SEQUENTIAL BATCH SCAN FLOW
            btnScan.querySelector('.spinner-small').style.display = 'block';
            
            const catMap = {
                'Camiseta': 'superior', 'Blusa': 'superior', 'Camisa': 'superior', 'Top Knit': 'superior',
                'Jeans': 'inferior', 'Pantalón de Vestir': 'inferior', 'Falda': 'inferior', 'Pantalón': 'inferior',
                'Tenis': 'calzado', 'Botas': 'calzado', 'Mocasines': 'calzado', 'Zapatos': 'calzado',
                'Abrigo': 'abrigo', 'Chaqueta': 'abrigo', 'Blazer': 'abrigo',
                'Gafas de Sol': 'accesorio', 'Bolso': 'accesorio'
            };

            for (let i = 0; i < STATE.scanQueue.length; i++) {
                selectQueueItem(i);
                btnScan.querySelector('.btn-text').textContent = `Escaneando prenda ${i+1}/${STATE.scanQueue.length}...`;
                
                const item = STATE.scanQueue[i];
                const badge = document.getElementById(`scan-badge-${i}`);
                if (badge) badge.textContent = '⚙️';

                let result = null;
                const formData = new FormData();
                formData.append('image', item.file);

                try {
                    const response = await fetch('/api/scan', {
                        method: 'POST',
                        body: formData
                    });
                    if (response.ok) result = await response.json();
                } catch (err) {}

                if (!result) {
                    result = await analyzeImageLocally(item.file);
                }

                // Save directly into the closet during batch scans
                const newGarment = {
                    id: 'c_scanned_' + Date.now() + '_' + i,
                    cat: result.cat || catMap[result.tipo] || 'superior',
                    name: result.tipo || 'Prenda Escaneada',
                    style: result.estilo || 'Classic',
                    image: item.base64
                };
                STATE.closetItems.unshift(newGarment);
                
                item.status = 'completed';
                item.result = result;
                if (badge) {
                    badge.className = 'scan-thumb-badge scanned';
                    badge.textContent = '✓';
                }

                // Small delay to let laser and visual changes be visible to user
                await new Promise(r => setTimeout(r, 1200));
            }

            // Finish batch
            laser.classList.remove('active');
            btnScan.removeAttribute('disabled');
            btnScan.querySelector('.btn-text').textContent = 'Iniciar Escaneo';
            btnScan.querySelector('.spinner-small').style.display = 'none';
            
            renderCloset('all');
            showToast(`¡Se escanearon y guardaron ${STATE.scanQueue.length} prendas con éxito!`);
            
            // Hide preview wrapper and reset
            uploadPlaceholder.style.display = 'flex';
            previewWrapper.style.display = 'none';
            STATE.scanQueue = [];
            
            // Switch to closet tab to see newly added garments
            switchTab('closet');
        }
    });

    document.getElementById('btn-save-scanned').addEventListener('click', () => {
        const scanCategory = document.getElementById('res-tipo').textContent;
        const catMap = {
            'Camiseta': 'superior', 'Blusa': 'superior', 'Camisa': 'superior', 'Top Knit': 'superior',
            'Jeans': 'inferior', 'Pantalón de Vestir': 'inferior', 'Falda': 'inferior', 'Pantalón': 'inferior',
            'Tenis': 'calzado', 'Botas': 'calzado', 'Mocasines': 'calzado', 'Zapatos': 'calzado',
            'Abrigo': 'abrigo', 'Chaqueta': 'abrigo', 'Blazer': 'abrigo',
            'Gafas de Sol': 'accesorio', 'Bolso': 'accesorio'
        };
        const activeItem = STATE.scanQueue[STATE.activeScanIndex];
        const newGarment = {
            id: 'c_scanned_' + Date.now(),
            cat: (activeItem && activeItem.result && activeItem.result.cat) || catMap[scanCategory] || 'superior',
            name: scanCategory || 'Prenda Escaneada',
            style: document.getElementById('res-estilo').textContent,
            image: previewImg.src
        };
        STATE.closetItems.unshift(newGarment);
        renderCloset('all');
        showToast("Prenda guardada exitosamente en tu Closet.");
        
        // Remove from queue or reset if single
        if (STATE.scanQueue.length <= 1) {
            uploadPlaceholder.style.display = 'flex';
            previewWrapper.style.display = 'none';
            STATE.scanQueue = [];
        }
        switchTab('closet');
    });
}


function showScanResults(results) {
    const resultsBox = document.getElementById('scan-results-box');
    
    // Support both backend API shape and mock data shape
    document.getElementById('res-tipo').textContent = results.tipo || results.subcategory || results.category || '--';
    document.getElementById('res-estilo').textContent = results.estilo || results.pattern || '--';
    document.getElementById('res-confianza').textContent = results.confianza || results.confidence || '--';
    document.getElementById('res-consejo').textContent = results.consejo || 
        (results.category ? `Prenda detectada: ${results.category} / ${results.subcategory}. Color principal: ${results.color_primary}. Patrón: ${results.pattern}.` : 'Sin datos.');
    
    const colorBox = document.getElementById('res-colores');
    colorBox.innerHTML = '';
    
    // Handle both hex array (mock) and color name strings (backend)
    const colores = results.colores || [];
    if (colores.length === 0 && results.color_primary) {
        // Show color name labels instead of swatches for backend data
        const label = document.createElement('span');
        label.style.cssText = 'font-size:0.9rem; color:var(--text-primary);';
        label.textContent = results.color_primary + (results.color_secondary && results.color_secondary !== 'N/A' ? ', ' + results.color_secondary : '');
        colorBox.appendChild(label);
    }
    colores.forEach(hex => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = hex;
        swatch.title = hex;
        colorBox.appendChild(swatch);
    });

    resultsBox.style.display = 'block';
    resultsBox.scrollIntoView({ behavior: 'smooth' });
}

// 6. Boutique Catalog Manager
async function initBoutique() {
    try {
        const response = await fetch('/api/clothes?owned=false');
        if (!response.ok) throw new Error("Fallback");
        const data = await response.json();
        STATE.boutiqueItems = data.map(item => ({
            id: item.id,
            cat: mapCategory(item.category),
            brand: item.store_name || 'DressYourself',
            name: item.name,
            price: item.price ? `$${item.price.toFixed(2)}` : '$0.00',
            image: item.image_url
        }));
    } catch (e) {
        STATE.boutiqueItems = [...MOCK_DATA.boutique];
    }
    renderBoutique();
}

function renderBoutique() {
    const boutiqueGrid = document.getElementById('boutique-grid');
    if (!boutiqueGrid) return;
    boutiqueGrid.innerHTML = '';

    STATE.boutiqueItems.forEach(item => {
        // Calculate dynamic wardrobe gap compatibility based on current closet inventory
        let matchingCount = 0;
        let unlockCount = 0;
        const tops = STATE.closetItems.filter(c => c.category === 'Top').length;
        const bottoms = STATE.closetItems.filter(c => c.category === 'Bottom').length;
        const footwear = STATE.closetItems.filter(c => c.category === 'Footwear').length;
        const outerwear = STATE.closetItems.filter(c => c.category === 'Outerwear').length;

        if (item.category === 'Top') {
            matchingCount = bottoms + outerwear;
            unlockCount = bottoms * Math.max(1, footwear);
        } else if (item.category === 'Bottom') {
            matchingCount = tops + footwear;
            unlockCount = tops * Math.max(1, footwear);
        } else if (item.category === 'Outerwear') {
            matchingCount = tops + bottoms;
            unlockCount = tops * bottoms;
        } else if (item.category === 'Footwear') {
            matchingCount = bottoms;
            unlockCount = bottoms * Math.max(1, tops);
        } else {
            matchingCount = tops;
            unlockCount = tops;
        }

        const card = document.createElement('div');
        card.className = 'boutique-card';
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'boutique', item }));
        });
        
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-fav-boutique')) return;
            selectForFitting('boutique', item);
        });

        const isFav = STATE.favorites.some(fav => fav.id === item.id);
        const favClass = isFav ? 'active' : '';

        card.innerHTML = `
            <button class="btn-fav-boutique ${favClass}" title="Rastrear Precio">♥</button>
            <div class="boutique-img-wrapper">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.style.objectFit='contain'; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 280%22><rect fill=%22%23171717%22 width=%22200%22 height=%22280%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23646464%22 font-size=%2214%22 text-anchor=%22middle%22 dy=%22.3em%22>Imagen no disponible</text></svg>';">
                <div class="boutique-card-overlay">
                    <button class="gold-btn btn-try-boutique">Probar en Vestidor</button>
                </div>
            </div>
            <div class="boutique-info">
                <div class="boutique-meta">
                    <div class="boutique-title-col">
                        <span class="boutique-brand">${item.brand}</span>
                        <h4 class="boutique-title">${item.name}</h4>
                    </div>
                    <span class="boutique-price">${item.price}</span>
                </div>
                <div class="boutique-compatibility" style="margin-top: 8px; font-size: 0.7rem; color: var(--accent-gold); display: flex; align-items: center; gap: 4px; border-top: 1px solid rgba(212,175,55,0.1); padding-top: 6px; font-family: 'Montserrat', sans-serif;">
                    <span>✨ Combina con <strong>${matchingCount}</strong> prendas y desbloquea <strong>${unlockCount}</strong> outfits</span>
                </div>
            </div>
        `;

        card.querySelector('.btn-fav-boutique').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavoriteBoutique(item);
        });

        boutiqueGrid.appendChild(card);
    });
}

// 7. Interactive Fitting Room (Touch & Mouse Support)
function initFittingRoom() {
    const sourceTabs = document.querySelectorAll('.source-tab');
    const slotCloset = document.getElementById('slot-closet');
    const slotBoutique = document.getElementById('slot-boutique');

    sourceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sourceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderFittingSource(tab.getAttribute('data-source'));
        });
    });

    [slotCloset, slotBoutique].forEach(slot => {
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.source && data.item) {
                selectForFitting(data.source, data.item);
            }
        });
    });

    renderFittingSource('closet');
}

function renderFittingSource(sourceType) {
    const scroller = document.getElementById('fitting-scroller');
    scroller.innerHTML = '';

    const list = sourceType === 'closet' ? STATE.closetItems : STATE.boutiqueItems;

    list.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'fitting-source-item';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
            <div class="fitting-source-item-meta">${item.name}</div>
        `;
        itemEl.addEventListener('click', () => {
            selectForFitting(sourceType, item);
        });
        scroller.appendChild(itemEl);
    });
}

function selectForFitting(type, item) {
    STATE.fittingSlots[type] = item;
    
    const slot = document.getElementById(`slot-${type}`);
    slot.setAttribute('data-empty', 'false');
    
    const content = slot.querySelector('.slot-content');
    content.innerHTML = `
        <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
        <div class="slot-item-info">
            <span class="slot-item-cat">${item.cat}</span>
            <h4 class="slot-item-name">${item.name}</h4>
        </div>
    `;

    evaluateFittingMatch();
}

window.clearFittingSlot = function(type) {
    STATE.fittingSlots[type] = null;
    const slot = document.getElementById(`slot-${type}`);
    slot.setAttribute('data-empty', 'true');
    slot.querySelector('.slot-content').innerHTML = '';
    
    document.getElementById('fitting-verdict').style.display = 'none';
};

window.loadScrapedToFitting = function(item) {
    selectForFitting('boutique', item);
    switchTab('probador');
    showToast(`¡Prenda de ${item.brand} cargada en el Probador!`);
};

async function evaluateFittingMatch() {
    const closetItem = STATE.fittingSlots.closet;
    const boutiqueItem = STATE.fittingSlots.boutique;

    if (!closetItem || !boutiqueItem) return;

    const scoreBar = document.getElementById('score-bar');
    const scorePct = document.getElementById('score-pct');
    const verdictText = document.getElementById('verdict-text');
    const btnPurchase = document.getElementById('btn-purchase-boutique');
    const verdictBox = document.getElementById('fitting-verdict');

    verdictBox.style.display = 'flex';
    
    const bdColor = document.getElementById('breakdown-color');
    const bdStyle = document.getElementById('breakdown-style');
    const bdPattern = document.getElementById('breakdown-pattern');
    const bdWeather = document.getElementById('breakdown-weather');

    try {
        const cityIndex = localStorage.getItem('dy_selected_city_index') || 0;
        const occasion = 'Casual';
        const url = `/api/recommend?city_index=${cityIndex}&occasion=${occasion}&closet_id=${closetItem.id}&boutique_id=${boutiqueItem.id}`;
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            
            scoreBar.style.width = `${data.total_score}%`;
            scorePct.textContent = `${data.total_score}%`;
            
            if (bdColor) bdColor.textContent = `${data.color_score}%`;
            if (bdStyle) bdStyle.textContent = `${data.style_score}%`;
            if (bdPattern) bdPattern.textContent = `${data.pattern_score}%`;
            if (bdWeather) bdWeather.textContent = `${data.weather_score}%`;
            
            const quoteResponse = await fetch(`/api/ganchito/quote?personality=${STATE.ariaPersonality}&closet_id=${closetItem.id}&boutique_id=${boutiqueItem.id}`);
            if (quoteResponse.ok) {
                const quoteData = await quoteResponse.json();
                verdictText.textContent = `"${quoteData.response}"`;
                
                const ariaSpeech = document.getElementById('aria-speech');
                if (ariaSpeech) {
                    ariaSpeech.textContent = `¡Bonjour! El ensamble califica en un ${data.total_score}%. ${data.advice}`;
                }
            } else {
                verdictText.textContent = `"${data.advice}"`;
            }
        }
    } catch (e) {
        console.error("Error evaluating fitting match:", e);
    }

    btnPurchase.style.display = 'block';
    btnPurchase.onclick = () => {
        triggerCheckout(boutiqueItem);
    };
}

function triggerCheckout(boutiqueItem) {
    const confirmBuy = confirm(`¿Deseas comprar "${boutiqueItem.name}" por ${boutiqueItem.price}?`);
    if (!confirmBuy) return;

    STATE.currentOrder = {
        id: 'DY-' + Math.floor(Math.random() * 90000 + 10000),
        status: 'Procesado',
        progress: 10,
        logs: [
            { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), text: `Orden de compra creada para ${boutiqueItem.name}.` },
            { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), text: 'Validación de pago aprobada.' }
        ]
    };

    alert("¡Compra exitosa! Sigue el camión de reparto en la sección de Rastreo de Pedidos.");
    switchTab('pedidos');
}

// 8. Editorial Social Community Feed (Style Valuations Tags)
function initComunidad() {
    renderComunidadFeed();
}

async function renderComunidadFeed() {
    const feedEl = document.getElementById('comunidad-feed');
    if (!feedEl) return;
    feedEl.innerHTML = '';

    let sharedOutfits = [];
    try {
        const response = await fetch('/api/outfits');
        if (response.ok) {
            const allOutfits = await response.json();
            sharedOutfits = allOutfits.filter(o => o.is_shared === 1);
        }
    } catch (e) {
        console.error("Error loading outfits for community feed:", e);
    }

    // Map database outfits to post format
    const dbPosts = sharedOutfits.map(o => {
        // Collect outfit garments
        const items = [];
        if (o.top_image) items.push({ cat: 'superior', name: o.top_name, image: o.top_image });
        if (o.bottom_image) items.push({ cat: 'inferior', name: o.bottom_name, image: o.bottom_image });
        if (o.outerwear_image) items.push({ cat: 'abrigo', name: o.outerwear_name, image: o.outerwear_image });
        if (o.footwear_image) items.push({ cat: 'calzado', name: o.footwear_name, image: o.footwear_image });
        if (o.accessory_image) items.push({ cat: 'accesorio', name: o.accessory_name, image: o.accessory_image });

        return {
            id: o.id,
            isDb: true,
            user: 'Diseñador Virtual',
            initials: 'DV',
            desc: o.name + '. ' + (o.justification || 'Estilo sastrero minimalista.'),
            rating: o.rating || 5.0,
            rating_count: o.rating_count || 0,
            userRating: parseInt(localStorage.getItem(`dy_rated_outfit_${o.id}`)) || 0,
            items: items
        };
    });

    // Combine mock posts with DB posts
    const allFeedPosts = [...dbPosts, ...MOCK_DATA.posts];

    if (allFeedPosts.length === 0) {
        feedEl.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 0; font-style: italic; width: 100%;">
                No hay combinaciones compartidas en la comunidad todavía. ¡Sé el primero en compartir la tuya!
            </div>
        `;
        return;
    }

    allFeedPosts.forEach((post) => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.style.marginBottom = '25px';

        // Check if DB post or mock post to render image vs flatlay collage
        let imageContent = '';
        if (post.isDb && post.items && post.items.length) {
            // Render Flat Lay collage for real DB outfits (unisex, Pinterest vibe)
            let itemsHtml = post.items.map((item, idx) => {
                const rotation = [5, -4, 3, -6, 2][idx % 5];
                return `
                    <div style="width: 75px; height: 75px; border-radius: 6px; border: 1.5px solid var(--border-gold); background: #111; overflow: hidden; transform: rotate(${rotation}deg); box-shadow: 2px 2px 8px rgba(0,0,0,0.4); flex-shrink: 0; position: relative; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.15) z-index(5)'" onmouseout="this.style.transform='scale(1) rotate(${rotation}deg)'">
                        <img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%23222%27 width=%27100%27 height=%27100%27/%3E%3C/svg%3E';">
                    </div>
                `;
            }).join('');

            imageContent = `
                <div style="background: radial-gradient(circle, #fcfbf9 0%, #f5f2e8 100%); border-radius: 8px; border: 1px solid var(--border-gold); padding: 20px 10px; display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; position: relative; overflow: hidden; min-height: 140px;">
                    <div style="position: absolute; inset: 0; background-image: radial-gradient(var(--border-gold) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.08; pointer-events: none;"></div>
                    ${itemsHtml}
                </div>
            `;
        } else {
            imageContent = `
                <div class="post-image-wrapper">
                    <img src="${post.img}" alt="Outfit post" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
                </div>
            `;
        }

        // Render 5-star rating widget
        const userRating = post.userRating || 0;
        let starsHtml = '';
        for (let star = 1; star <= 5; star++) {
            const activeClass = star <= userRating ? 'active-star' : '';
            starsHtml += `
                <span class="star-rating-icon ${activeClass}" data-value="${star}" style="cursor: pointer; font-size: 1.5rem; color: ${star <= userRating ? 'var(--accent-gold)' : 'var(--text-muted)'}; margin-right: 4px; transition: color 0.15s, transform 0.1s;">★</span>
            `;
        }

        card.innerHTML = `
            <div class="post-header" style="margin-bottom: 12px;">
                <div class="post-avatar" style="background: var(--border-gold); color: #000; font-weight: bold;">${post.initials}</div>
                <div class="post-user-info">
                    <span class="post-username" style="font-family: 'Outfit', sans-serif;">${post.user}</span>
                    <span class="post-time" style="font-size: 0.75rem; color: var(--text-muted);">Calificación de Estilo</span>
                </div>
            </div>
            
            ${imageContent}
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 5px; border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
                <div class="star-rating-widget" data-post-id="${post.id}" data-is-db="${post.isDb || false}">
                    ${starsHtml}
                </div>
                <span style="font-size: 0.85rem; color: var(--text-muted); font-family: 'Outfit', sans-serif;">
                    ⭐ <strong style="color: var(--text-primary);" class="rating-avg-display">${post.rating}</strong> / 5 (${post.rating_count || 0} votos)
                </span>
            </div>

            <div class="post-body" style="padding-top: 10px;">
                <p class="post-caption" style="font-size: 0.9rem; line-height: 1.4;"><strong>@${post.user.toLowerCase().replace(/\s/g, '')}</strong> ${post.desc}</p>
            </div>
        `;

        // Star rating click handlers
        card.querySelectorAll('.star-rating-icon').forEach(star => {
            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.getAttribute('data-value'));
                const siblings = star.parentNode.querySelectorAll('.star-rating-icon');
                siblings.forEach(s => {
                    const sVal = parseInt(s.getAttribute('data-value'));
                    s.style.color = sVal <= val ? 'var(--accent-gold)' : 'var(--text-muted)';
                    s.style.transform = sVal <= val ? 'scale(1.25)' : 'scale(1)';
                });
            });

            star.addEventListener('mouseleave', () => {
                const siblings = star.parentNode.querySelectorAll('.star-rating-icon');
                siblings.forEach(s => {
                    const sVal = parseInt(s.getAttribute('data-value'));
                    const isBookmarked = sVal <= userRating;
                    s.style.color = isBookmarked ? 'var(--accent-gold)' : 'var(--text-muted)';
                    s.style.transform = 'scale(1)';
                });
            });

            star.addEventListener('click', async () => {
                const val = parseInt(star.getAttribute('data-value'));
                const isDb = star.parentNode.getAttribute('data-is-db') === 'true';
                const postId = star.parentNode.getAttribute('data-post-id');

                // Save user rating locally to prevent double rating
                localStorage.setItem(`dy_rated_outfit_${postId}`, val);
                post.userRating = val;

                if (isDb) {
                    try {
                        const response = await fetch(`/api/outfits/${postId}/rate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rating: val })
                        });
                        if (response.ok) {
                            const result = await response.json();
                            post.rating = result.rating;
                            post.rating_count = result.rating_count;
                            showToast("¡Gracias por tu valoración de estilo!");
                        }
                    } catch (e) {
                        console.error("Error rating outfit:", e);
                    }
                } else {
                    // Update mock locally
                    const postItem = MOCK_DATA.posts.find(p => p.id === postId);
                    if (postItem) {
                        const oldSum = postItem.rating * postItem.rating_count;
                        postItem.rating_count++;
                        postItem.rating = parseFloat(((oldSum + val) / postItem.rating_count).toFixed(1));
                        postItem.userRating = val;
                    }
                    showToast("¡Valoración guardada localmente!");
                }

                // Animate and re-render
                star.style.transform = 'scale(1.6)';
                setTimeout(() => {
                    renderComunidadFeed();
                }, 150);
            });
        });

        feedEl.appendChild(card);
    });
}

// 9. Real-Time Order Tracking Logic (Fetch Polling & Simulations)
function initTracking() {
    const refreshBtn = document.getElementById('btn-refresh-tracking');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchOrderStatus(true);
        });
    }
    fetchOrderStatus(false);
}

async function fetchOrderStatus(isManual) {
    try {
        const response = await fetch('/api/pedido/status');
        if (!response.ok) throw new Error("Fallback to client logic");
        const data = await response.json();
        updateTrackingUI(data);
    } catch (e) {
        updateTrackingUI(STATE.currentOrder);
    }
}

function updateTrackingUI(order) {
    const orderIdEl = document.getElementById('track-order-id');
    if (!orderIdEl) return;
    
    orderIdEl.textContent = order.id;
    
    const progressBar = document.getElementById('track-progress-bar');
    const truckIcon = document.getElementById('truck-icon');
    
    progressBar.style.width = `${order.progress}%`;
    truckIcon.style.left = `${order.progress}%`;

    const statuses = ['Procesado', 'Enviado', 'En Camino', 'Entregado'];
    const currentIdx = statuses.indexOf(order.status);

    statuses.forEach((status, idx) => {
        const node = document.getElementById(`node-${idx}`);
        if (!node) return;

        if (idx < currentIdx) {
            node.className = 'step-node completed';
        } else if (idx === currentIdx) {
            node.className = 'step-node active';
        } else {
            node.className = 'step-node';
        }
    });

    const eventLog = document.getElementById('tracking-events');
    eventLog.innerHTML = '';

    order.logs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'tracking-event-item';
        li.innerHTML = `
            <span class="event-details">${log.text}</span>
            <span class="event-time">${log.time}</span>
        `;
        eventLog.appendChild(li);
    });
}

function startTrackingSimulation() {
    if (STATE.trackingInterval) return;

    STATE.trackingInterval = setInterval(() => {
        const statuses = ['Procesado', 'Enviado', 'En Camino', 'Entregado'];
        let currentIdx = statuses.indexOf(STATE.currentOrder.status);

        if (currentIdx < statuses.length - 1) {
            currentIdx++;
            STATE.currentOrder.status = statuses[currentIdx];
            
            const progressSteps = [10, 38, 68, 100];
            STATE.currentOrder.progress = progressSteps[currentIdx];
            
            const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const logTexts = [
                "Pago y orden validados por el sistema central.",
                "El repartidor ha recolectado el empaque en el Atelier.",
                "El vehículo de reparto se encuentra en tránsito hacia tu dirección.",
                "El paquete ha sido entregado exitosamente. ¡Disfruta tu estilo!"
            ];
            
            STATE.currentOrder.logs.unshift({
                time: now,
                text: logTexts[currentIdx]
            });

            updateTrackingUI(STATE.currentOrder);
        } else {
            stopTrackingSimulation();
        }
    }, 8000);
}

function stopTrackingSimulation() {
    if (STATE.trackingInterval) {
        clearInterval(STATE.trackingInterval);
        STATE.trackingInterval = null;
    }
}

// 10. Personalized Outfit Builder Engine
function initOutfitBuilder() {
    const btnOpen = document.getElementById('btn-open-outfit-builder');
    const btnClose = document.getElementById('btn-close-outfit-builder');
    const modal = document.getElementById('outfit-builder-modal');
    
    const slots = document.querySelectorAll('.builder-slot');
    const drawer = document.getElementById('garment-select-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const btnSave = document.getElementById('btn-save-outfit');

    if (!btnOpen) return;

    // Show / Hide Modal
    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        resetBuilder();
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Setup slot triggers
    slots.forEach(slot => {
        // Main slot selector click
        slot.querySelector('.bslot-selector-trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            const cat = slot.getAttribute('data-category');
            openGarmentDrawer(cat);
        });

        // Clear button listener for optional slots
        const clearBtn = slot.querySelector('.clear-bslot-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cat = slot.getAttribute('data-category');
                clearBuilderSlot(cat);
            });
        }
    });

    // Drawer Close rules
    btnCloseDrawer.addEventListener('click', () => {
        drawer.style.display = 'none';
    });
    drawer.addEventListener('click', (e) => {
        if (e.target === drawer) drawer.style.display = 'none';
    });

    // Save Action
    btnSave.addEventListener('click', saveCombination);
    document.getElementById('outfit-occasion')?.addEventListener('change', updateBuilderScore);
}

function openGarmentDrawer(category) {
    STATE.activeBuilderSlot = category;
    
    const drawer = document.getElementById('garment-select-drawer');
    const title = document.getElementById('drawer-title-category');
    const grid = document.getElementById('drawer-items-grid');

    const catLabels = {
        superior: 'Prenda Superior (Top)',
        inferior: 'Prenda Inferior (Bottom)',
        calzado: 'Calzado (Footwear)',
        abrigo: 'Abrigo (Outerwear)',
        accesorio: 'Accesorio (Accessory)'
    };

    title.textContent = `Selecciona tu ${catLabels[category] || 'Prenda'}`;
    grid.innerHTML = '';

    // Filter clothes by category
    const filtered = STATE.closetItems.filter(item => item.cat === category);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding: 30px; color: var(--text-muted);">
                No tienes prendas subidas en esta categoría.<br>
                <span class="gold-text" style="cursor:pointer;" onclick="document.getElementById('garment-select-drawer').style.display='none'; document.getElementById('outfit-builder-modal').style.display='none'; switchTab('innovaciones');">
                    Escanear prenda nueva &rarr;
                </span>
            </div>
        `;
        drawer.style.display = 'flex';
        return;
    }

    filtered.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'drawer-item-card animate-fade-in';
        itemCard.innerHTML = `
            <div class="drawer-item-img">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
            </div>
            <div class="drawer-item-name">${item.name}</div>
        `;
        itemCard.addEventListener('click', () => {
            selectGarmentForBuilder(category, item);
            drawer.style.display = 'none';
        });
        grid.appendChild(itemCard);
    });

    drawer.style.display = 'flex';
}

function selectGarmentForBuilder(category, item) {
    STATE.builderSlots[category] = item;

    const slot = document.getElementById(`bslot-${category}`);
    slot.setAttribute('data-empty', 'false');
    
    // Render info inside slot
    const preview = slot.querySelector('.selected-item-preview');
    preview.innerHTML = `
        <img class="preview-thumb" src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
        <span class="preview-name">${item.name}</span>
    `;

    // Show clear button if optional
    const clearBtn = slot.querySelector('.clear-bslot-btn');
    if (clearBtn) clearBtn.style.display = 'flex';

    // Highlight silhouette part in modal mannequin
    const mannequinPart = document.getElementById(`bmannequin-${category}`);
    if (mannequinPart) {
        mannequinPart.style.opacity = '0.85';
        mannequinPart.style.strokeWidth = '2px';
    }

    // Display image overlay on the mannequin
    const playerContainer = document.getElementById(`player-${category}`);
    if (playerContainer) {
        playerContainer.querySelector('img').src = item.image;
        playerContainer.style.display = 'flex';
        playerContainer.classList.add('animate-fade-in');
    }
    updateBuilderScore();
}

function clearBuilderSlot(category) {
    STATE.builderSlots[category] = null;

    const slot = document.getElementById(`bslot-${category}`);
    slot.setAttribute('data-empty', 'true');
    
    // Hide clear button
    const clearBtn = slot.querySelector('.clear-bslot-btn');
    if (clearBtn) clearBtn.style.display = 'none';

    // Reset mannequin vector highlight
    const mannequinPart = document.getElementById(`bmannequin-${category}`);
    if (mannequinPart) {
        mannequinPart.style.opacity = '0.2';
        mannequinPart.style.strokeWidth = '1.2px';
    }

    // Hide overlay layer image
    const playerContainer = document.getElementById(`player-${category}`);
    if (playerContainer) {
        playerContainer.style.display = 'none';
        playerContainer.querySelector('img').src = '';
    }
    updateBuilderScore();
}

async function updateBuilderScore() {
    const superior = STATE.builderSlots.superior;
    const inferior = STATE.builderSlots.inferior;
    const calzado = STATE.builderSlots.calzado;
    const abrigo = STATE.builderSlots.abrigo;
    const accesorio = STATE.builderSlots.accesorio;
    const occasion = document.getElementById('outfit-occasion')?.value || 'Casual';

    const container = document.getElementById('builder-score-container');
    const flatlayCollage = document.getElementById('builder-flatlay-collage');
    
    // Draw flat-lay collage dynamically
    if (flatlayCollage) {
        flatlayCollage.innerHTML = '';
        const slotsToDraw = [
            { cat: 'superior', label: 'Superior', item: superior, rot: 4 },
            { cat: 'inferior', label: 'Inferior', item: inferior, rot: -5 },
            { cat: 'abrigo', label: 'Abrigo', item: abrigo, rot: 3 },
            { cat: 'calzado', label: 'Calzado', item: calzado, rot: -3 },
            { cat: 'accesorio', label: 'Accesorio', item: accesorio, rot: 6 }
        ];

        let activeDrawings = 0;
        slotsToDraw.forEach(slot => {
            if (slot.item) {
                activeDrawings++;
                const card = document.createElement('div');
                card.style.width = '75px';
                card.style.height = '75px';
                card.style.borderRadius = '6px';
                card.style.border = '1.5px solid var(--border-gold)';
                card.style.background = '#111';
                card.style.overflow = 'hidden';
                card.style.transform = `rotate(${slot.rot}deg)`;
                card.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.3)';
                card.style.position = 'relative';
                card.style.transition = 'all 0.2s';
                card.innerHTML = `
                    <img src="${slot.item.image}" alt="${slot.item.name}" style="width:100%; height:100%; object-fit:cover;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); color: var(--accent-gold); font-size: 8px; text-align: center; padding: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${slot.label}
                    </div>
                `;
                flatlayCollage.appendChild(card);
            } else if (slot.cat === 'superior' || slot.cat === 'inferior' || slot.cat === 'calzado') {
                // Show elegant placeholder for mandatory items
                const placeholder = document.createElement('div');
                placeholder.style.width = '75px';
                placeholder.style.height = '75px';
                placeholder.style.borderRadius = '6px';
                placeholder.style.border = '1.5px dashed rgba(212,175,55,0.3)';
                placeholder.style.display = 'flex';
                placeholder.style.flexDirection = 'column';
                placeholder.style.justifyContent = 'center';
                placeholder.style.alignItems = 'center';
                placeholder.style.fontSize = '8px';
                placeholder.style.color = 'var(--text-muted)';
                placeholder.style.textAlign = 'center';
                placeholder.style.padding = '5px';
                placeholder.style.boxSizing = 'border-box';
                placeholder.style.transform = `rotate(${slot.rot}deg)`;
                placeholder.innerHTML = `
                    <span style="font-size: 1.1rem; margin-bottom: 2px;">+</span>
                    <span>${slot.label}</span>
                `;
                flatlayCollage.appendChild(placeholder);
            }
        });

        if (activeDrawings === 0) {
            flatlayCollage.innerHTML = `
                <div style="color: var(--text-muted); font-size: 0.9rem; text-align: center; font-style: italic; padding: 40px 0; width: 100%;">
                    Selecciona prendas en la izquierda para ver el lienzo de diseño flat-lay...
                </div>
            `;
        }
    }

    if (!superior || !inferior || !calzado) {
        if (container) container.style.display = 'none';
        return;
    }

    try {
        const cityIndex = localStorage.getItem('dy_selected_city_index') || 0;
        let url = `/api/recommend?city_index=${cityIndex}&occasion=${occasion}&top_id=${superior.id}&bottom_id=${inferior.id}&footwear_id=${calzado.id}`;
        if (abrigo) url += `&outerwear_id=${abrigo.id}`;
        if (accesorio) url += `&accessory_id=${accesorio.id}`;

        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (container) {
                container.style.display = 'block';
                document.getElementById('builder-score-pct').textContent = `${data.total_score}%`;
                document.getElementById('builder-score-bar').style.width = `${data.total_score}%`;
                document.getElementById('bbreakdown-color').textContent = `${data.color_score}%`;
                document.getElementById('bbreakdown-style').textContent = `${data.style_score}%`;
                document.getElementById('bbreakdown-pattern').textContent = `${data.pattern_score}%`;
                document.getElementById('bbreakdown-weather').textContent = `${data.weather_score}%`;
                document.getElementById('builder-advice-text').textContent = `"${data.advice}"`;
            }
        }
    } catch (e) {
        console.error("Error updating builder score:", e);
    }
}

function resetBuilder() {
    Object.keys(STATE.builderSlots).forEach(category => {
        clearBuilderSlot(category);
    });
    document.getElementById('outfit-name').value = '';
    document.getElementById('outfit-occasion').value = 'Casual';
}

async function saveCombination() {
    const nameInput = document.getElementById('outfit-name');
    const occasionSelect = document.getElementById('outfit-occasion');
    
    const name = nameInput.value.trim();
    const occasion = occasionSelect.value;

    // Validate mandatory categories
    if (!STATE.builderSlots.superior) {
        showToast("Por favor selecciona una prenda superior (Top).", "error");
        return;
    }
    if (!STATE.builderSlots.inferior) {
        showToast("Por favor selecciona una prenda inferior (Bottom).", "error");
        return;
    }
    if (!STATE.builderSlots.calzado) {
        showToast("Por favor selecciona el calzado (Footwear).", "error");
        return;
    }

    if (!name) {
        showToast("Por favor ingresa un nombre para el outfit.", "error");
        nameInput.focus();
        return;
    }

    // Format payload
    const payload = {
        name: name,
        occasion: occasion,
        top_id: STATE.builderSlots.superior.id,
        bottom_id: STATE.builderSlots.inferior.id,
        footwear_id: STATE.builderSlots.calzado.id,
        outerwear_id: STATE.builderSlots.abrigo ? STATE.builderSlots.abrigo.id : null,
        accessory_id: STATE.builderSlots.accesorio ? STATE.builderSlots.accesorio.id : null
    };

    // UI Loading state
    const btnSave = document.getElementById('btn-save-outfit');
    const oldHTML = btnSave.innerHTML;
    btnSave.setAttribute('disabled', 'true');
    btnSave.innerHTML = `<span>Guardando Combinación...</span>`;

    let success = false;
    let newOutfitObject = null;

    try {
        const response = await fetch('/api/outfits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            newOutfitObject = await response.json();
            success = true;
        }
    } catch (e) {
        console.log("Using fallback mock for outfit save.");
    }

    // Fallback Mock save
    if (!success) {
        // Collect selected items list for immediate rendering
        const selectedItems = [];
        Object.keys(STATE.builderSlots).forEach(key => {
            const item = STATE.builderSlots[key];
            if (item) {
                selectedItems.push({
                    cat: key,
                    name: item.name,
                    image: item.image
                });
            }
        });

        newOutfitObject = {
            id: 'o_saved_' + Date.now(),
            name: name,
            occasion: occasion,
            items: selectedItems
        };
        success = true;
    }

    // Wrap save operation
    setTimeout(() => {
        btnSave.removeAttribute('disabled');
        btnSave.innerHTML = oldHTML;

        if (success) {
            STATE.savedCombinations.unshift(newOutfitObject);
            renderSavedCombinations();
            
            // Close modal
            document.getElementById('outfit-builder-modal').style.display = 'none';
            
            // Show toast notification
            showToast(`¡Outfit "${name}" guardado exitosamente!`);
        } else {
            showToast("Hubo un error al guardar la combinación. Inténtalo de nuevo.", "error");
        }
    }, 1200);
}

// Toast Alert Helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    if (type === 'error') {
        toast.style.borderColor = '#e25c5c';
        toast.innerHTML = `
            <span style="color:#e25c5c; font-weight:bold;">✕</span>
            <span>${message}</span>
        `;
    } else {
        toast.innerHTML = `
            <span class="toast-success-icon">✓</span>
            <span>${message}</span>
        `;
    }

    // Fade out out after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 350);
    }, 3000);
}

// --- NEW REDESIGN FEATURES: ONBOARDING, LIENZO LIBRE, MALETA, GAMIFICATION & PRICE TRACKER ---

// 11. Onboarding & Profile Initialization
function initOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    const form = document.getElementById('onboarding-form');
    
    if (!modal || !form) return;

    // Check if profile exists in server or localStorage
    checkProfileExists().then(profile => {
        if (profile) {
            STATE.userProfile = profile;
            updateProfileUI();
            checkGamificationMilestones();
        } else {
            // Force onboarding splash screen modal
            modal.style.display = 'flex';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('onboarding-name').value.trim();
        const style = document.querySelector('input[name="onboarding-style"]:checked').value;
        const city = document.getElementById('onboarding-city').value.trim();

        if (!name || !city) return;

        const newProfile = {
            name: name,
            preferences: style,
            city: city,
            level: 'Novicia',
            xp: 20 // 20 XP initially for onboarding
        };

        // Save profile to server
        try {
            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProfile)
            });
        } catch (err) {
            console.log("Saving profile locally (fallback)");
        }

        localStorage.setItem('user_profile', JSON.stringify(newProfile));
        STATE.userProfile = newProfile;
        
        modal.style.display = 'none';
        updateProfileUI();
        
        // Unlock Onboarding medal
        unlockMedal('medal-onboarding');
        showToast("¡Bienvenida! Isa ha configurado tu perfil de estilo.");
        
        // Reload weather with user city
        initWeather();
    });
}

async function checkProfileExists() {
    try {
        const response = await fetch('/api/profile');
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        // fall through
    }
    
    // Local fallback
    const local = localStorage.getItem('user_profile');
    return local ? JSON.parse(local) : null;
}

function updateProfileUI() {
    if (!STATE.userProfile) return;
    
    // Header welcome greeting
    const greetingName = document.getElementById('header-user-name');
    if (greetingName) greetingName.textContent = STATE.userProfile.name;
    
    // Mini stats in top header bar
    const miniLevel = document.getElementById('mini-user-level');
    const miniXP = document.getElementById('mini-user-xp');
    if (miniLevel) miniLevel.textContent = STATE.userProfile.level;
    if (miniXP) miniXP.textContent = `XP: ${STATE.userProfile.xp} / ${getNextLevelXP()}`;

    // Full Profile modal dashboard
    const profName = document.getElementById('profile-user-name');
    const profLvl = document.getElementById('profile-user-level');
    const profXPText = document.getElementById('profile-xp-text');
    const profXPBar = document.getElementById('profile-xp-bar');

    if (profName) profName.textContent = STATE.userProfile.name;
    if (profLvl) profLvl.textContent = STATE.userProfile.level;
    if (profXPText) profXPText.textContent = `${STATE.userProfile.xp} / ${getNextLevelXP()} XP`;
    
    if (profXPBar) {
        const pct = Math.min((STATE.userProfile.xp / getNextLevelXP()) * 100, 100);
        profXPBar.style.width = `${pct}%`;
    }

    // Enable/Unlock Visual Themes based on level
    const optVelvet = document.getElementById('opt-theme-velvet');
    const optEsmeralda = document.getElementById('opt-theme-esmeralda');
    const xp = STATE.userProfile.xp;

    if (optVelvet) {
        if (xp >= 50) {
            optVelvet.removeAttribute('disabled');
            optVelvet.textContent = "🌟 Velvet Noir (Desbloqueado)";
        } else {
            optVelvet.setAttribute('disabled', 'true');
            optVelvet.textContent = "🔒 Velvet Noir (Nivel Estilista)";
        }
    }

    if (optEsmeralda) {
        if (xp >= 100) {
            optEsmeralda.removeAttribute('disabled');
            optEsmeralda.textContent = "🌟 Esmeralda Premium (Desbloqueado)";
        } else {
            optEsmeralda.setAttribute('disabled', 'true');
            optEsmeralda.textContent = "🔒 Esmeralda Premium (Nivel Trendsetter)";
        }
    }
}

function getNextLevelXP() {
    if (!STATE.userProfile) return 100;
    const lvl = STATE.userProfile.level;
    if (lvl === 'Novicia') return 50;
    if (lvl === 'Estilista') return 100;
    if (lvl === 'Trendsetter') return 150;
    return 300;
}

// 12. Gamification Achievements
function initGamification() {
    const openBtn = document.getElementById('btn-open-profile-modal');
    const closeBtn = document.getElementById('btn-close-profile-modal');
    const modal = document.getElementById('profile-modal');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            updateProfileUI();
            modal.style.display = 'flex';
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // Theme Select handler
    const themeSelect = document.getElementById('profile-theme-select');
    if (themeSelect) {
        // Load saved theme
        const savedTheme = localStorage.getItem('user_theme') || 'default';
        themeSelect.value = savedTheme;
        applySelectedTheme(savedTheme);

        themeSelect.addEventListener('change', (e) => {
            applySelectedTheme(e.target.value);
            showToast("Tema de interfaz actualizado.");
        });
    }

    // Initialize local favorites if any
    const savedFavs = localStorage.getItem('boutique_favorites');
    if (savedFavs) {
        STATE.favorites = JSON.parse(savedFavs);
    }
}

function applySelectedTheme(themeId) {
    const root = document.documentElement;
    const themes = {
        default: {
            '--bg-primary': '#0a0a0a',
            '--bg-secondary': '#121212',
            '--bg-tertiary': '#1e1e1e',
            '--accent-gold': '#d4af37',
            '--accent-gold-hover': '#e5c158',
            '--border-gold': 'rgba(212, 175, 55, 0.25)'
        },
        velvet: {
            '--bg-primary': '#0e0b16',
            '--bg-secondary': '#18122B',
            '--bg-tertiary': '#2B1B4D',
            '--accent-gold': '#A555EC',
            '--accent-gold-hover': '#D376FF',
            '--border-gold': 'rgba(165, 85, 236, 0.3)'
        },
        esmeralda: {
            '--bg-primary': '#051911',
            '--bg-secondary': '#0b291d',
            '--bg-tertiary': '#143d2d',
            '--accent-gold': '#cfb53b',
            '--accent-gold-hover': '#dfc54b',
            '--border-gold': 'rgba(207, 181, 59, 0.3)'
        }
    };

    const vars = themes[themeId] || themes.default;
    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
    }
    
    // Save theme selection in localStorage
    localStorage.setItem('user_theme', themeId);
}

function gainXP(amount) {
    if (!STATE.userProfile) return;
    STATE.userProfile.xp += amount;
    
    // Check level up
    let oldLevel = STATE.userProfile.level;
    let xp = STATE.userProfile.xp;
    let level = 'Novicia';
    
    if (xp >= 150) {
        level = 'Icono';
    } else if (xp >= 100) {
        level = 'Trendsetter';
    } else if (xp >= 50) {
        level = 'Estilista';
    }
    
    STATE.userProfile.level = level;
    
    if (level !== oldLevel) {
        showLevelUpToast(level);
    }
    
    // Save updated profile
    localStorage.setItem('user_profile', JSON.stringify(STATE.userProfile));
    updateProfileUI();
    
    fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(STATE.userProfile)
    }).catch(() => {});
}

function showLevelUpToast(newLevel) {
    const levelNames = {
        'Estilista': 'Estilista de Moda 🌟',
        'Trendsetter': 'Trendsetter de Vanguardia 🔥',
        'Icono': 'Ícono Eterno de la Pasarela 👑'
    };
    
    // Congratulate user with Isa popup speech
    setTimeout(() => {
        triggerAriaSpeech(`¡Felicidades, cariño! Has alcanzado el nivel de ${levelNames[newLevel] || newLevel}. Sigue refinando tu guardarropa.`);
    }, 1000);
    
    showToast(`¡Subiste de Nivel! Ahora eres ${levelNames[newLevel] || newLevel}.`, 'success');
}

function checkGamificationMilestones(forceBoutique = false) {
    if (!STATE.userProfile) return;
    
    // 1. Onboarding Visual
    if (STATE.userProfile.xp >= 20) {
        unlockMedal('medal-onboarding');
    }
    
    // 2. Fiel del Estilo: weather clicks >= 5
    if (STATE.weatherClicks >= 5) {
        unlockMedal('medal-fiel-estilo');
    }
    
    // 3. Boutique Premium: closet length > 15 OR boutique purchase
    if (STATE.closetItems.length > 15 || forceBoutique) {
        unlockMedal('medal-boutique-premium');
    }
}

function unlockMedal(medalId) {
    const card = document.getElementById(medalId);
    if (card && card.classList.contains('locked')) {
        card.classList.remove('locked');
        card.classList.add('unlocked');
        
        // Unlock corresponding coupon
        if (medalId === 'medal-fiel-estilo') {
            unlockCoupon('coupon-cashback');
            gainXP(30);
        } else if (medalId === 'medal-boutique-premium') {
            unlockCoupon('coupon-shipping');
            gainXP(50);
        }
        
        showToast("¡Medalla Desbloqueada y recompensas reclamadas!");
    }
}

function unlockCoupon(couponId) {
    const card = document.getElementById(couponId);
    if (card && card.classList.contains('locked')) {
        card.classList.remove('locked');
        card.classList.add('unlocked');
    }
}


// 13. Lienzo Libre (Lienzo de Vestidor)
function initLienzoLibre() {
    const scroller = document.getElementById('lienzo-garments-scroller');
    const canvas = document.getElementById('lienzo-canvas');
    
    if (!scroller || !canvas) return;

    // Load garments list to select from
    renderLienzoSidebar();

    // Bind source filter tabs
    const btnCloset = document.getElementById('btn-canvas-source-closet');
    const btnBoutique = document.getElementById('btn-canvas-source-boutique');
    if (btnCloset && btnBoutique) {
        btnCloset.addEventListener('click', () => {
            STATE.canvasSource = 'closet';
            btnCloset.classList.add('active');
            btnCloset.style.background = 'rgba(212,175,55,0.1)';
            btnCloset.style.color = '#fff';
            btnBoutique.classList.remove('active');
            btnBoutique.style.background = 'none';
            btnBoutique.style.color = '#aaa';
            renderLienzoSidebar();
        });
        btnBoutique.addEventListener('click', () => {
            STATE.canvasSource = 'boutique';
            btnBoutique.classList.add('active');
            btnBoutique.style.background = 'rgba(212,175,55,0.1)';
            btnBoutique.style.color = '#fff';
            btnCloset.classList.remove('active');
            btnCloset.style.background = 'none';
            btnCloset.style.color = '#aaa';
            renderLienzoSidebar();
        });
    }

    // Scale & rotate sliders
    const scaleSlider = document.getElementById('lienzo-scale');
    const rotateSlider = document.getElementById('lienzo-rotate');
    
    scaleSlider.addEventListener('input', (e) => {
        if (!STATE.selectedCanvasItem) return;
        const scaleVal = e.target.value;
        STATE.selectedCanvasItem.dataset.scale = scaleVal;
        updateCanvasItemTransform(STATE.selectedCanvasItem);
    });

    rotateSlider.addEventListener('input', (e) => {
        if (!STATE.selectedCanvasItem) return;
        const rotateVal = e.target.value;
        STATE.selectedCanvasItem.dataset.rotate = rotateVal;
        updateCanvasItemTransform(STATE.selectedCanvasItem);
    });

    // Layer orders (Z-index)
    document.getElementById('btn-lienzo-front').addEventListener('click', () => {
        if (!STATE.selectedCanvasItem) return;
        let z = parseInt(STATE.selectedCanvasItem.style.zIndex) || 10;
        STATE.selectedCanvasItem.style.zIndex = z + 1;
    });

    document.getElementById('btn-lienzo-back').addEventListener('click', () => {
        if (!STATE.selectedCanvasItem) return;
        let z = parseInt(STATE.selectedCanvasItem.style.zIndex) || 10;
        STATE.selectedCanvasItem.style.zIndex = Math.max(1, z - 1);
    });

    // Delete item
    document.getElementById('btn-lienzo-delete').addEventListener('click', () => {
        if (!STATE.selectedCanvasItem) return;
        STATE.selectedCanvasItem.remove();
        STATE.selectedCanvasItem = null;
        
        scaleSlider.value = 1;
        rotateSlider.value = 0;
    });

    // Canvas click clears selection
    canvas.addEventListener('click', (e) => {
        if (e.target === canvas || e.target.classList.contains('canvas-grid-lines') || e.target.classList.contains('canvas-placeholder')) {
            clearCanvasSelection();
        }
    });

    // Save look trigger
    document.getElementById('btn-save-lienzo-look').addEventListener('click', saveCanvasLook);
}

function renderLienzoSidebar() {
    const scroller = document.getElementById('lienzo-garments-scroller');
    if (!scroller) return;
    scroller.innerHTML = '';

    const list = STATE.canvasSource === 'closet' ? STATE.closetItems : STATE.boutiqueItems;

    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'lienzo-garment-item animate-fade-in';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="lienzo-garment-info">
                <span class="lienzo-garment-cat">${item.brand || item.cat || 'Prenda'}</span>
                <span class="lienzo-garment-name">${item.name}</span>
            </div>
        `;
        div.addEventListener('click', () => {
            addGarmentToCanvas(item);
        });
        scroller.appendChild(div);
    });
}

function addGarmentToCanvas(item) {
    const canvas = document.getElementById('lienzo-canvas');
    if (!canvas) return;

    // Remove placeholder if present
    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const canvasItem = document.createElement('div');
    canvasItem.className = 'canvas-item';
    canvasItem.style.width = '120px';
    canvasItem.style.height = '160px';
    canvasItem.style.left = '80px';
    canvasItem.style.top = '80px';
    canvasItem.style.zIndex = '10';
    
    canvasItem.dataset.id = item.id;
    canvasItem.dataset.scale = '1.0';
    canvasItem.dataset.rotate = '0';

    canvasItem.innerHTML = `<img src="${item.image}" alt="${item.name}">`;

    // Click to select
    canvasItem.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCanvasItem(canvasItem);
    });

    // Implement Drag & Drop with touch/mouse
    setupCanvasItemDrag(canvasItem, canvas);

    canvas.appendChild(canvasItem);
    selectCanvasItem(canvasItem);
}

function selectCanvasItem(el) {
    clearCanvasSelection();
    STATE.selectedCanvasItem = el;
    el.classList.add('selected');

    // Sync sliders
    document.getElementById('lienzo-scale').value = el.dataset.scale || 1.0;
    document.getElementById('lienzo-rotate').value = el.dataset.rotate || 0;
}

function clearCanvasSelection() {
    if (STATE.selectedCanvasItem) {
        STATE.selectedCanvasItem.classList.remove('selected');
    }
    STATE.selectedCanvasItem = null;
}

function updateCanvasItemTransform(el) {
    const scale = el.dataset.scale || 1.0;
    const rotate = el.dataset.rotate || 0;
    el.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
}

function setupCanvasItemDrag(el, container) {
    let isDragging = false;
    let startX, startY;
    let leftStart, topStart;

    const dragStart = (e) => {
        isDragging = true;
        
        // Handle touch vs mouse
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;

        leftStart = parseInt(el.style.left) || 0;
        topStart = parseInt(el.style.top) || 0;

        selectCanvasItem(el);
        
        e.preventDefault();
    };

    const dragMove = (e) => {
        if (!isDragging) return;

        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        // Boundaries check
        let newLeft = leftStart + dx;
        let newTop = topStart + dy;

        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
    };

    const dragEnd = () => {
        isDragging = false;
    };

    // Mouse listeners
    el.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);

    // Touch listeners
    el.addEventListener('touchstart', dragStart, { passive: false });
    window.addEventListener('touchmove', dragMove, { passive: false });
    window.addEventListener('touchend', dragEnd);
}

async function saveCanvasLook() {
    const lookName = document.getElementById('lienzo-look-name').value.trim();
    if (!lookName) {
        showToast("Ingresa un nombre para tu Look de lienzo.", "error");
        return;
    }

    const canvas = document.getElementById('lienzo-canvas');
    const items = [];
    
    canvas.querySelectorAll('.canvas-item').forEach(el => {
        items.push({
            clothing_id: el.dataset.id,
            left: el.style.left,
            top: el.style.top,
            scale: el.dataset.scale,
            rotate: el.dataset.rotate,
            zIndex: el.style.zIndex
        });
    });

    if (items.length === 0) {
        showToast("Añade al menos una prenda al lienzo antes de guardar.", "error");
        return;
    }

    const payload = {
        name: lookName,
        items: items
    };

    try {
        const response = await fetch('/api/canvas-looks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            showToast(`Look "${lookName}" guardado en el vestidor.`);
            document.getElementById('lienzo-look-name').value = '';
            
            // Add some XP for saving canvas designs!
            gainXP(25);
        } else {
            throw new Error("Save error");
        }
    } catch (e) {
        showToast(`Look "${lookName}" guardado en memoria local.`);
        // Fallback local save
        const savedLooks = JSON.parse(localStorage.getItem('canvas_looks') || '[]');
        savedLooks.push(payload);
        localStorage.setItem('canvas_looks', JSON.stringify(savedLooks));
        document.getElementById('lienzo-look-name').value = '';
        gainXP(25);
    }
}


// 14. Maleta de Viaje (Armario Cápsula Checklist)
function initMaletaViaje() {
    const form = document.getElementById('maleta-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const destino = document.getElementById('maleta-destino').value.trim();
        const dias = parseInt(document.getElementById('maleta-dias').value);
        const clima = document.getElementById('maleta-clima').value;
        const capacidad = document.getElementById('maleta-capacidad').value;

        if (!destino || !dias) return;

        const btnGen = document.getElementById('btn-generar-maleta');
        const oldText = btnGen.textContent;
        btnGen.setAttribute('disabled', 'true');
        btnGen.textContent = 'Creando Maleta Cápsula...';

        try {
            const response = await fetch('/api/travel-capsule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destino, dias, clima, capacidad })
            });

            if (response.ok) {
                const data = await response.json();
                renderMaletaChecklist(data);
            } else {
                throw new Error("Server error");
            }
        } catch (err) {
            // Mock capsule generation fallback
            generateMockTravelCapsule(destino, dias, clima, capacidad);
        } finally {
            btnGen.removeAttribute('disabled');
            btnGen.textContent = oldText;
        }
    });

    const printBtn = document.getElementById('btn-print-maleta');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

function renderMaletaChecklist(data) {
    const checklistContainer = document.getElementById('maleta-checklist');
    if (!checklistContainer) return;
    
    checklistContainer.innerHTML = '';

    const printBtn = document.getElementById('btn-print-maleta');
    if (printBtn) {
        printBtn.style.display = 'block';
    }
    
    const title = document.createElement('h4');
    title.className = 'gold-text';
    title.style.fontSize = '1.05rem';
    title.style.marginBottom = '10px';
    title.textContent = `Maleta para ${data.destino} (${data.dias} días - Clima ${data.clima})`;
    checklistContainer.appendChild(title);

    if (!data.items || data.items.length === 0) {
        checklistContainer.innerHTML += `<p style="color:var(--text-muted);">No hay suficientes prendas en el armario para la maleta.</p>`;
        return;
    }

    // Load packed states from localStorage
    const storageKey = `packed_${data.destino}_${data.dias}`;
    const packedList = JSON.parse(localStorage.getItem(storageKey) || '[]');

    data.items.forEach(item => {
        const itemEl = document.createElement('div');
        const isPacked = packedList.includes(item.id);
        
        itemEl.className = `checklist-item ${isPacked ? 'packed' : ''}`;
        itemEl.dataset.id = item.id;
        
        itemEl.innerHTML = `
            <div class="checklist-checkbox">${isPacked ? '✓' : ''}</div>
            <img class="checklist-thumb" src="${item.image}" alt="${item.name}">
            <div class="checklist-item-details">
                <span class="checklist-item-cat">${item.cat}</span>
                <span class="checklist-item-name">${item.name}</span>
            </div>
        `;

        itemEl.addEventListener('click', () => {
            const packed = togglePackedState(storageKey, item.id);
            if (packed) {
                itemEl.classList.add('packed');
                itemEl.querySelector('.checklist-checkbox').textContent = '✓';
            } else {
                itemEl.classList.remove('packed');
                itemEl.querySelector('.checklist-checkbox').textContent = '';
            }
        });

        checklistContainer.appendChild(itemEl);
    });

    gainXP(10); // Gain XP for travel planning!
    showToast("¡Maleta inteligente generada con éxito!");
}

function togglePackedState(key, itemId) {
    const packedList = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = packedList.indexOf(itemId);
    let packed = false;
    
    if (idx > -1) {
        packedList.splice(idx, 1);
    } else {
        packedList.push(itemId);
        packed = true;
    }
    
    localStorage.setItem(key, JSON.stringify(packedList));
    return packed;
}

function generateMockTravelCapsule(destino, dias, clima, capacidad) {
    // Generate intelligent capsule based on local state owned items
    const capsuleTops = STATE.closetItems.filter(i => i.cat === 'superior');
    const capsuleBottoms = STATE.closetItems.filter(i => i.cat === 'inferior');
    const capsuleFootwear = STATE.closetItems.filter(i => i.cat === 'calzado');
    const capsuleOuterwear = STATE.closetItems.filter(i => i.cat === 'abrigo');

    const selected = [];
    
    // Choose count based on days
    const topCount = Math.min(capsuleTops.length, maxItems(dias, 1.2));
    const bottomCount = Math.min(capsuleBottoms.length, maxItems(dias, 0.6));
    const shoeCount = Math.min(capsuleFootwear.length, 2);

    for (let i = 0; i < topCount; i++) selected.push(capsuleTops[i]);
    for (let i = 0; i < bottomCount; i++) selected.push(capsuleBottoms[i]);
    for (let i = 0; i < shoeCount; i++) selected.push(capsuleFootwear[i]);

    if (clima === 'Frío' || clima === 'Fresco' || clima === 'Lluvioso') {
        if (capsuleOuterwear.length) selected.push(capsuleOuterwear[0]);
    }

    const payload = {
        destino: destino,
        dias: dias,
        clima: clima,
        items: selected.map(s => ({
            id: s.id,
            name: s.name,
            cat: s.cat,
            image: s.image
        }))
    };

    renderMaletaChecklist(payload);
}

function maxItems(dias, factor) {
    return Math.max(1, Math.round(dias * factor));
}


// 15. Price Tracker Favorites and Fluctuations
function initPriceTracker() {
    renderPriceTracker();

    // Start interval loop to audit discount fluctuations every 18 seconds
    setInterval(simulatePriceTrackerFluctuations, 18000);
}

function renderPriceTracker() {
    const list = document.getElementById('tracker-items-list');
    if (!list) return;

    if (STATE.favorites.length === 0) {
        list.innerHTML = `<p class="empty-tracker">Haz clic en el corazón (♥) de cualquier prenda en la boutique para activar su rastreo de precio.</p>`;
        return;
    }

    list.innerHTML = '';
    
    STATE.favorites.forEach(item => {
        // Mock current price from item price string (e.g. "$450")
        const priceNum = parseFloat(item.price.replace('$', ''));
        
        // If simulated price is stored
        const currentPrice = item.currentPrice || priceNum;
        const isDiscounted = currentPrice < priceNum;
        const discountPct = isDiscounted ? Math.round(((priceNum - currentPrice) / priceNum) * 100) : 0;

        const trackerEl = document.createElement('div');
        trackerEl.className = `tracker-item ${isDiscounted ? 'alert-discount' : ''}`;
        
        trackerEl.innerHTML = `
            <img class="tracker-thumb" src="${item.image}" alt="${item.name}">
            <div class="tracker-info">
                <div class="tracker-name-brand">
                    <span class="tracker-brand">${item.brand}</span>
                    <span class="tracker-name">${item.name}</span>
                </div>
                ${isDiscounted ? `<span class="tracker-discount-badge">¡Alerta de Descuento!</span>` : ''}
            </div>
            <div class="tracker-prices">
                <span class="tracker-price-current">$${currentPrice}</span>
                ${isDiscounted ? `<span class="tracker-price-original">${item.price}</span>` : ''}
                ${isDiscounted ? `<span style="color:var(--accent-gold); font-size:0.75rem; font-weight:600;">-${discountPct}%</span>` : ''}
            </div>
        `;
        list.appendChild(trackerEl);
    });
}

function toggleFavoriteBoutique(item) {
    const idx = STATE.favorites.findIndex(fav => fav.id === item.id);
    
    if (idx > -1) {
        STATE.favorites.splice(idx, 1);
        showToast("Prenda quitada de favoritos.");
    } else {
        STATE.favorites.push(item);
        showToast("¡Prenda añadida a favoritos y Price Tracker activo!");
    }

    localStorage.setItem('boutique_favorites', JSON.stringify(STATE.favorites));
    
    // Rerender both lists
    renderBoutique();
    renderPriceTracker();
    
    // Gamification hook
    checkGamificationMilestones();
}

function simulatePriceTrackerFluctuations() {
    if (STATE.favorites.length === 0) return;

    // Pick a random favorite
    const randIdx = Math.floor(Math.random() * STATE.favorites.length);
    const item = STATE.favorites[randIdx];
    
    // Simulate drop or recovery
    const originalPrice = parseFloat(item.price.replace('$', ''));
    const isDiscounted = item.currentPrice && item.currentPrice < originalPrice;

    if (isDiscounted && Math.random() > 0.4) {
        // Recover original price
        item.currentPrice = originalPrice;
    } else {
        // Drop price by 10% - 30%
        const discount = Math.round(originalPrice * (0.10 + Math.random() * 0.20));
        item.currentPrice = originalPrice - discount;
        
        // Trigger Toast warning
        showDiscountToast(item, item.currentPrice, item.price);
    }

    // Save changes
    localStorage.setItem('boutique_favorites', JSON.stringify(STATE.favorites));
    renderPriceTracker();
}

function showDiscountToast(item, currentPrice, originalPrice) {
    showToast(`¡Alerta de Descuento! "${item.name}" de ${item.brand} bajó a $${currentPrice} (era ${originalPrice}).`, 'success');
}
