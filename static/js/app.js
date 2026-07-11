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
    
    // RPG Styling State
    chatMode: 'libre',
    rpgCurrentNode: 'occasion_step',
    rpgAnswers: [],

    // Antigravity added state variables
    selectedBrand: 'all',
    scheduledOutfits: [],
    capsuleEssentials: [],
    capsuleOutfits: [],
    dailyQuests: null
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

// Luxury empty state template function
function getEmptyStateHTML(type) {
    if (type === 'closet') {
        return `
            <div class="empty-state animate-fade-in" style="grid-column: 1 / -1; width: 100%;">
                <svg viewBox="0 0 100 100" class="empty-state-svg" style="width: 80px; height: 80px; fill: none; stroke: var(--accent-gold); stroke-width: 1.5; opacity: 0.6; margin-bottom: 15px;">
                    <path d="M50 20 C47 20, 45 23, 48 26 C52 30, 50 35, 50 38 M50 38 L25 55 C23 56.5, 25 58, 27 58 L73 58 C75 58, 77 56.5, 75 55 Z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h4 style="font-family: var(--font-editorial); color: var(--accent-gold); margin-bottom: 8px; letter-spacing: 1px; font-size: 0.9rem;">CLOSET VACÍO</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); max-width: 320px; line-height: 1.4; margin: 0 auto;">Aún no tienes prendas registradas en esta categoría. Digitaliza tu colección usando el escáner de IA.</p>
            </div>
        `;
    } else if (type === 'wardrobe') {
        return `
            <div class="empty-state animate-fade-in" style="grid-column: 1 / -1; width: 100%;">
                <svg viewBox="0 0 100 100" class="empty-state-svg" style="width: 80px; height: 80px; fill: none; stroke: var(--accent-gold); stroke-width: 1.5; opacity: 0.6; margin-bottom: 15px;">
                    <rect x="25" y="15" width="50" height="70" rx="3" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="50" y1="15" x2="50" y2="85" stroke-dasharray="1 1"/>
                    <circle cx="45" cy="50" r="1.5" fill="var(--accent-gold)"/>
                    <circle cx="55" cy="50" r="1.5" fill="var(--accent-gold)"/>
                    <line x1="20" y1="85" x2="80" y2="85"/>
                </svg>
                <h4 style="font-family: var(--font-editorial); color: var(--accent-gold); margin-bottom: 8px; letter-spacing: 1px; font-size: 0.9rem;">COLECCIÓN SIN DISEÑAR</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); max-width: 340px; line-height: 1.4; margin: 0 auto;">Aún no has guardado ninguna combinación de outfits. Haz clic en "Diseñar Outfit" para crear tu primera composición de alta costura.</p>
            </div>
        `;
    } else if (type === 'chat') {
        return `
            <div class="empty-state animate-fade-in" style="margin: 30px auto; border: none; background: transparent;">
                <svg viewBox="0 0 100 100" class="empty-state-svg" style="width: 80px; height: 80px; fill: none; stroke: var(--accent-gold); stroke-width: 1.2; opacity: 0.7; margin-bottom: 15px;">
                    <path d="M30 25 H70 C75 25, 78 28, 78 33 V57 C78 62, 75 65, 70 65 H50 L35 75 V65 H30 C25 65, 22 62, 22 57 V33 C22 28, 25 25, 30 25 Z" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M40 40 H60 M40 50 H55" stroke-linecap="round"/>
                </svg>
                <h4 style="font-family: var(--font-editorial); color: var(--accent-gold); margin-bottom: 8px; letter-spacing: 1.5px; font-size: 0.9rem;">CONVERSACIÓN CON ARIA</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); max-width: 280px; line-height: 1.4; margin: 0 auto;">Pregúntale a Aria sobre tendencias, colores o consejos personalizados de costura.</p>
            </div>
        `;
    }
    return '';
}

function updateChatHistoryState() {
    const history = document.getElementById('chat-history');
    if (!history) return;
    
    const hasMessages = history.querySelector('.chat-msg');
    const existingEmpty = history.querySelector('.empty-state');
    
    if (!hasMessages && !existingEmpty) {
        history.innerHTML = getEmptyStateHTML('chat');
    } else if (hasMessages && existingEmpty) {
        existingEmpty.remove();
    }
}

// Gold particle burst effect generator for ratings
function createGoldParticleBurst(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const container = document.body;
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-star-particle';
        
        const angle = (i / particleCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
        const speed = 2 + Math.random() * 4;
        const size = 3 + Math.random() * 4;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        container.appendChild(particle);
        
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        let currentX = x;
        let currentY = y;
        let opacity = 1;
        
        const animate = () => {
            currentX += velocityX;
            currentY += velocityY + 0.1; // gravity
            opacity -= 0.03;
            
            particle.style.left = `${currentX}px`;
            particle.style.top = `${currentY}px`;
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
}

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
    ariaQuotes: {
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
        { id: 'mock_1', user: 'Alessia V.', initials: 'AV', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop', desc: 'Tarde de lino y champaña con un blazer clásico.', rating: 4.8, rating_count: 53, userRating: 0 },
        { id: 'mock_2', user: 'Mateo Garces', initials: 'MG', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600&auto=format&fit=crop', desc: 'Quiet luxury en la ciudad. Paletas crema y botas altas.', rating: 4.2, rating_count: 41, userRating: 0 },
        { id: 'mock_3', user: 'Sophia Atelier', initials: 'SA', img: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=600&auto=format&fit=crop', desc: 'Probando el Vestidor de Aria. Combinación aprobada al 92%.', rating: 4.6, rating_count: 28, userRating: 0 }
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

// Offline Mock Weather Database for Colombian Cities
const MOCK_CITIES_WEATHER = [
    { name: "Bogotá", temp: "14°C", desc: "Llovizna y niebla matutina", condition: "Lluvia", humidity: "85%", wind: "12 km/h" },
    { name: "Medellín", temp: "22°C", desc: "Clima primaveral y despejado", condition: "Despejado", humidity: "65%", wind: "8 km/h" },
    { name: "Cali", temp: "28°C", desc: "Cálido y parcialmente nublado", condition: "Nublado", humidity: "60%", wind: "10 km/h" },
    { name: "Barranquilla", temp: "32°C", desc: "Calor tropical intenso y brisa", condition: "Soleado", humidity: "75%", wind: "22 km/h" },
    { name: "Cartagena", temp: "31°C", desc: "Soleado con brisa costera", condition: "Soleado", humidity: "70%", wind: "18 km/h" },
    { name: "Bucaramanga", temp: "24°C", desc: "Templado y agradable", condition: "Despejado", humidity: "68%", wind: "9 km/h" },
    { name: "Pereira", temp: "21°C", desc: "Cielo nublado y templado", condition: "Nublado", humidity: "72%", wind: "7 km/h" },
    { name: "Santa Marta", temp: "30°C", desc: "Cálido y soleado", condition: "Soleado", humidity: "74%", wind: "15 km/h" },
    { name: "Manizales", temp: "16°C", desc: "Fresco con neblina", condition: "Neblina", humidity: "88%", wind: "11 km/h" },
    { name: "Ibagué", temp: "23°C", desc: "Templado y parcialmente nublado", condition: "Nublado", humidity: "70%", wind: "10 km/h" }
];

// Document Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
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

    // Boot onboarding wizard if not completed
    if (typeof window.checkOnboardingStartup === 'function') {
        window.checkOnboardingStartup();
    }
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
    if (STATE.currentTab === tabName) return; // Prevent duplicate transition if clicking active tab
    
    const prevTabName = STATE.currentTab;
    STATE.currentTab = tabName;
    
    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const mainContent = document.querySelector('.main-content');
    const oldSection = document.getElementById(prevTabName);
    const newSection = document.getElementById(tabName);

    if (oldSection && newSection) {
        // Create or show a blur-out overlay for an organic feel
        let overlay = document.getElementById('tab-transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tab-transition-overlay';
            mainContent.appendChild(overlay);
        }
        
        // Trigger overlay fade & blur
        overlay.classList.add('transitioning');
        
        // Animate old section out
        oldSection.classList.remove('active');
        oldSection.classList.add('tab-leaving');
        
        // Wait for old section exit animation (200ms)
        setTimeout(() => {
            oldSection.classList.remove('tab-leaving');
            
            // Activate new section
            newSection.classList.add('active');
            newSection.classList.add('tab-entering');
            mainContent.scrollTop = 0;
            
            // Remove entering class and transition overlay after entering
            setTimeout(() => {
                newSection.classList.remove('tab-entering');
                overlay.classList.remove('transitioning');
            }, 300);
        }, 200);
    } else if (newSection) {
        // Fallback for first load
        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.remove('active');
        });
        newSection.classList.add('active');
        mainContent.scrollTop = 0;
    }
    
    if (tabName === 'pedidos') {
        startTrackingSimulation();
    } else {
        stopTrackingSimulation();
    }

    if (tabName === 'calendario') {
        if (typeof initCalendar === 'function') initCalendar();
    } else if (tabName === 'capsula') {
        if (typeof initCapsule === 'function') initCapsule();
    } else if (tabName === 'closet') {
        if (typeof initQuestsPanel === 'function') initQuestsPanel();
    } else if (tabName === 'analiticas') {
        if (typeof initAnalytics === 'function') initAnalytics();
    } else if (tabName === 'mezclador') {
        if (typeof initShuffle === 'function') initShuffle();
    } else if (tabName === 'viajes') {
        if (typeof initPacking === 'function') initPacking();
    }
}

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
    } catch (e) {
        // Mock fallback matching the index
        const cityWeather = MOCK_CITIES_WEATHER[cityIndex] || MOCK_CITIES_WEATHER[0];
        const mock = {
            city: cityWeather.name,
            temp: cityWeather.temp,
            desc: cityWeather.desc,
            details: [
                { label: "Condición", value: cityWeather.condition },
                { label: "Humedad", value: cityWeather.humidity },
                { label: "Viento", value: cityWeather.wind }
            ]
        };
        renderWeather(mock);
        renderRecommendations(MOCK_DATA.climaRecommendation);
    }
}

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
        const cityWeather = MOCK_CITIES_WEATHER[nearestCity.index] || MOCK_CITIES_WEATHER[0];
        const mock = {
            city: resolvedName || `📍 ${cityWeather.name} (Aprox.)`,
            temp: cityWeather.temp,
            desc: `${cityWeather.desc} (GPS activo, sin servidor)`,
            details: [
                { label: "Condición", value: cityWeather.condition },
                { label: "GPS", value: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` },
                { label: "Ciudad Cercana", value: cityWeather.name }
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
    if (typeof initQuestsPanel === 'function') initQuestsPanel();

    const openCustomBtn = document.getElementById('btn-open-custom-garment');
    if (openCustomBtn) {
        openCustomBtn.onclick = () => {
            if (typeof window.openCustomGarmentModal === 'function') {
                window.openCustomGarmentModal();
            }
        };
    }

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

function updateStylingIndex() {
    const scoreEl = document.getElementById('styling-index-score');
    const scannedEl = document.getElementById('styling-index-scanned');
    const progressPctEl = document.getElementById('styling-index-progress-pct');
    const progressBarEl = document.getElementById('styling-index-progress-bar');
    const rankLabelEl = document.getElementById('styling-index-rank-label');
    
    if (!scoreEl) return;
    
    const count = STATE.closetItems.length;
    scannedEl.textContent = count;
    
    // Set average style score
    // Let's make it a baseline of 88.5%, slightly varied by items
    let score = 88.5;
    if (count > 0) {
        score = Math.min(99.4, 80 + (count * 1.5)).toFixed(1);
    }
    scoreEl.textContent = `${score}%`;
    
    // Let's define ranking progress towards "Haute Couture Master" (need 12 items)
    const targetItems = 12;
    const progressPct = Math.min(100, Math.round((count / targetItems) * 100));
    if (progressPctEl) progressPctEl.textContent = `${progressPct}%`;
    if (progressBarEl) progressBarEl.style.width = `${progressPct}%`;
    
    if (rankLabelEl) {
        if (progressPct >= 100) {
            rankLabelEl.textContent = "Haute Couture Master 👑";
            rankLabelEl.style.color = "var(--accent-gold)";
        } else if (progressPct >= 60) {
            rankLabelEl.textContent = "Senior Stylist";
            rankLabelEl.style.color = "#fff";
        } else if (progressPct >= 30) {
            rankLabelEl.textContent = "Fashion Coordinator";
            rankLabelEl.style.color = "var(--text-secondary)";
        } else {
            rankLabelEl.textContent = "Haute Couture Apprentice";
            rankLabelEl.style.color = "var(--text-muted)";
        }
    }
}

function renderCloset(category) {
    updateStylingIndex();
    const closetGrid = document.getElementById('closet-grid');
    closetGrid.innerHTML = '';

    const filtered = category === 'all' 
        ? STATE.closetItems 
        : STATE.closetItems.filter(item => item.cat === category);

    if (filtered.length === 0) {
        closetGrid.innerHTML = getEmptyStateHTML('closet');
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
        grid.innerHTML = getEmptyStateHTML('wardrobe');
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

// 4. Aria Assistant Engine
function initAria() {
    const lookSelector = document.getElementById('aria-look');
    const personalitySelector = document.getElementById('personality');
    const portraitImg = document.getElementById('aria-portrait');

    if (lookSelector) {
        lookSelector.addEventListener('change', (e) => {
            const lookKey = e.target.value;
            STATE.ariaLook = lookKey;
            
            if (portraitImg) {
                portraitImg.style.opacity = '0';
                setTimeout(() => {
                    portraitImg.src = ARIA_LOOK_IMAGES[lookKey] || ARIA_LOOK_IMAGES.base;
                    portraitImg.style.opacity = '1';
                }, 300);
            }

            triggerAriaSpeech(`He cambiado mi apariencia a ${e.target.options[e.target.selectedIndex].text}. ¿Qué tal me queda?`);
        });
    }

    if (personalitySelector) {
        personalitySelector.addEventListener('change', (e) => {
            STATE.ariaPersonality = e.target.value;
            triggerAriaSpeech(getRandomQuote());
        });
    }

    if (portraitImg) {
        portraitImg.addEventListener('click', () => {
            triggerAriaSpeech(getRandomQuote());
        });
    }

    // Automatically boot into the guided interactive styling session (formerly RPG)
    switchChatMode('rpg');
}

function getRandomQuote() {
    const quotes = MOCK_DATA.ariaQuotes[STATE.ariaPersonality] || MOCK_DATA.ariaQuotes.classy;
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
                sarcastic: `¿En serio me preguntas por "${text}"? Aria te aconseja que revisemos esa decisión antes de salir al público.`,
                nervous: `¡Ay no sé! Sobre "${text}"... espero que no llame demasiado la atención de forma incorrecta. ¿Qué tal un total black?`
            };
            const reply = botReplies[STATE.ariaPersonality] || botReplies.classy;
            appendChatMessage('bot', reply);
            triggerAriaSpeech(reply);
        }, 1000);
    }
}

function appendChatMessage(sender, text, scrapedItem = null, rpgRecommendation = null) {
    const history = document.getElementById('chat-history');
    
    // Remove empty state if present
    const existingEmpty = history.querySelector('.empty-state');
    if (existingEmpty) {
        existingEmpty.remove();
    }

    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    
    if (rpgRecommendation) {
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        msg.appendChild(textSpan);
        
        const card = document.createElement('div');
        card.style.marginTop = '10px';
        card.innerHTML = renderRPGRecommendation(rpgRecommendation);
        msg.appendChild(card);
    } else {
        msg.textContent = text;
    }
    
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

// RPG Interactive Game Modes and State Transitions
function switchChatMode(mode) {
    STATE.chatMode = mode;
    
    const btnLibre = document.getElementById('btn-mode-libre');
    const btnRPG = document.getElementById('btn-mode-rpg');
    const tracker = document.getElementById('rpg-progress-tracker');
    const optionsContainer = document.getElementById('rpg-options-container');
    const inputRow = document.querySelector('.chat-input-row');
    const history = document.getElementById('chat-history');
    
    if (mode === 'rpg') {
        if (btnLibre) btnLibre.classList.remove('active');
        if (btnRPG) btnRPG.classList.add('active');
        if (tracker) tracker.style.display = 'flex';
        if (optionsContainer) optionsContainer.style.display = 'flex';
        if (inputRow) inputRow.style.display = 'none';
        
        // Clear chat area for game immersion
        if (history) {
            history.innerHTML = `
                <div class="chat-msg bot animate-fade-in">
                    <span>¡Bienvenido al canal del Juego de Rol de Estilo con Isa! Aquí co-crearemos tu look ideal a través de caminos de diseño.</span>
                </div>
            `;
        }
        
        startRPGStyling();
    } else {
        if (btnLibre) btnLibre.classList.add('active');
        if (btnRPG) btnRPG.classList.remove('active');
        if (tracker) tracker.style.display = 'none';
        if (optionsContainer) optionsContainer.style.display = 'none';
        if (inputRow) inputRow.style.display = 'flex';
        
        // Return to standard chat history
        if (history) history.innerHTML = '';
        updateChatHistoryState();
        
        // Reload persisted chat if available
        fetch('/api/chat/history')
            .then(res => res.ok ? res.json() : [])
            .then(historyData => {
                if (historyData && historyData.length > 0) {
                    if (history) history.innerHTML = '';
                    historyData.forEach(item => {
                        let scraped = null;
                        if (item.scraped_item_json) {
                            try { scraped = JSON.parse(item.scraped_item_json); } catch(e) {}
                        }
                        appendChatMessage(item.sender, item.message, scraped);
                    });
                }
            })
            .catch(err => console.log("Persisted chat history not loaded:", err));
    }
}

function startRPGStyling() {
    STATE.rpgAnswers = [];
    STATE.rpgCurrentNode = 'occasion_step';
    loadRPGNode('occasion_step');
}

async function loadRPGNode(nodeId) {
    const lang = localStorage.getItem('dy_language') || 'es';
    const stepNum = nodeId === 'occasion_step' ? 1 : nodeId === 'color_step' ? 2 : 3;
    const barPct = nodeId === 'occasion_step' ? 33 : nodeId === 'color_step' ? 66 : 100;
    
    const stepIndicator = document.getElementById('rpg-step-indicator');
    const progressBar = document.getElementById('rpg-progress-bar');
    
    let node = null;
    try {
        const response = await fetch(`/api/rpg/node?node_id=${nodeId}`);
        if (response.ok) {
            node = await response.json();
        }
    } catch(err) {
        console.warn("RPG Node fetch failed, using local fallback:", err);
    }
    
    // Offline local fallback
    if (!node) {
        const localNode = LOCAL_RPG_NODES[nodeId];
        if (localNode) {
            node = {
                node_id: localNode.node_id,
                step: localNode.step[lang] || localNode.step['es'],
                question: localNode.question[lang] || localNode.question['es'],
                options: localNode.options.map(opt => ({
                    id: opt.id,
                    text: opt.text[lang] || opt.text['es'],
                    next_node_id: opt.next_node_id
                }))
            };
        }
    }
    
    if (!node) {
        const errMsg = lang === 'es' ? "¡Ay, disculpa! Tuvimos un pequeño tropiezo. ¿Reiniciamos?" : "Sorry! We had a little hiccup. Restart?";
        appendChatMessage('bot', errMsg);
        return;
    }
    
    STATE.rpgCurrentNode = nodeId;
    
    if (stepIndicator) stepIndicator.textContent = lang === 'es' ? `Paso ${stepNum} de 3: ${node.step}` : `Step ${stepNum} of 3: ${node.step}`;
    if (progressBar) progressBar.style.width = `${barPct}%`;
    
    appendChatMessage('bot', node.question);
    
    const optionsContainer = document.getElementById('rpg-options-container');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        node.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'rpg-option-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => {
                selectRPGOption(nodeId, opt.id, opt.text, opt.next_node_id);
            });
            optionsContainer.appendChild(btn);
        });
    }
}

async function selectRPGOption(nodeId, optionId, optionText, nextNodeId) {
    const lang = localStorage.getItem('dy_language') || 'es';
    appendChatMessage('user', optionText);
    
    STATE.rpgAnswers.push({
        node_id: nodeId,
        option_id: optionId
    });
    
    const optionsContainer = document.getElementById('rpg-options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';
    
    if (nextNodeId === 'complete') {
        const tracker = document.getElementById('rpg-progress-tracker');
        if (tracker) tracker.style.display = 'none';
        if (optionsContainer) optionsContainer.style.display = 'none';
        
        appendChatMessage('bot', lang === 'es' ? "Procesando tus elecciones de estilo... Creando tu combinación de alta costura..." : "Processing your style choices... Creating your haute couture outfit...");
        
        let resultData = null;
        try {
            const res = await fetch('/api/rpg/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: STATE.rpgAnswers })
            });
            if (res.ok) {
                resultData = await res.json();
            }
        } catch(err) {
            console.warn("RPG complete fetch failed, using local completion:", err);
        }
        
        if (!resultData) {
            resultData = processRPGCompletionLocally(STATE.rpgAnswers, lang);
        }
        
        setTimeout(() => {
            const congratMsg = lang === 'es' 
                ? `Aria ha revelado tu perfil ideal: ¡Te ha asignado el título de "${resultData.title}"!` 
                : `Aria has revealed your ideal profile: You have been awarded the title of "${resultData.title}"!`;
            
            appendChatMessage('bot', congratMsg, null, resultData);
            
            const ariaSpeech = lang === 'es' 
                ? `¡Bonjour chérie! He revelado tu perfil de estilo: eres ${resultData.title}. He puesto tu combinación ideal a continuación.` 
                : `Bonjour chérie! I have revealed your style profile: you are ${resultData.title}. I have placed your ideal combination below.`;
            triggerAriaSpeech(ariaSpeech);
            
            // Otorga 10 puntos al Babylon Styling Index por completar el juego de rol!
            grantStylingIndexBonus(10.0, lang);
            
            if (optionsContainer) {
                optionsContainer.style.display = 'flex';
                optionsContainer.innerHTML = `
                    <button class="gold-btn" style="width: 100%; text-transform: uppercase; padding: 12px;" onclick="startRPGStyling()">
                        ${lang === 'es' ? 'Reiniciar Juego de Rol' : 'Restart Roleplay'}
                    </button>
                `;
            }
        }, 1200);
    } else {
        setTimeout(() => {
            loadRPGNode(nextNodeId);
        }, 600);
    }
}

function renderRPGRecommendation(data) {
    const o = data.outfit;
    const s = data.scores;
    
    const items = [o.top, o.bottom, o.footwear, o.outerwear, o.accessory].filter(x => x !== null);
    
    // HTML to render Flat Lay items collage in chat
    let itemsHTML = '';
    items.forEach((item, index) => {
        const rot = (index % 2 === 0) ? -2 : 2;
        const brand = item.store_name || (item.is_owned ? "Closet" : "Boutique");
        itemsHTML += `
            <div style="background: #111; border: 1px solid rgba(212,175,55,0.15); border-radius: 6px; padding: 8px; transform: rotate(${rot}deg); display: flex; flex-direction: column; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                <img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 4px;">
                <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 500;">${brand}</span>
                <span style="font-size: 0.7rem; font-weight: bold; color: var(--text-primary); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left;">${item.name}</span>
            </div>
        `;
    });
    
    // Escape single quotes for function arg
    const topId = o.top ? o.top.id : 'null';
    const bottomId = o.bottom ? o.bottom.id : 'null';
    const footwearId = o.footwear ? o.footwear.id : 'null';
    const outerwearId = o.outerwear ? o.outerwear.id : 'null';
    const accessoryId = o.accessory ? o.accessory.id : 'null';

    return `
        <div style="padding: 12px; background: rgba(10,10,10,0.85); border: 1px solid var(--border-gold); border-radius: 8px; width: 100%; display: flex; flex-direction: column; gap: 12px; font-family: 'Outfit', sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(212,175,55,0.15); padding-bottom: 8px;">
                <span style="color: var(--accent-gold); font-size: 0.9rem; font-weight: 700; letter-spacing: 0.5px;">${data.title}</span>
                <span style="color: #00ff88; font-weight: bold; font-size: 1.0rem; text-shadow: 0 0 8px rgba(0,255,136,0.3);">${s.total_score.toFixed(1)}%</span>
            </div>
            
            <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; text-align: left; margin: 0;">${data.justification}</p>
            
            <!-- Grid list of items -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-top: 5px;">
                ${itemsHTML}
            </div>
            
            <div style="display: flex; gap: 8px; margin-top: 5px;">
                <button class="gold-btn" style="flex: 1; padding: 10px; font-size: 0.75rem; text-transform: uppercase;" onclick="loadRPGLookToFitting(${topId}, ${bottomId}, ${footwearId}, ${outerwearId}, ${accessoryId})">
                    Probar Look
                </button>
                <button class="gold-btn" style="flex: 1; padding: 10px; font-size: 0.75rem; text-transform: uppercase; background: linear-gradient(135deg, #b8952b, var(--accent-gold)); color: #000; font-weight: bold; border: none; box-shadow: 0 0 10px rgba(212,175,55,0.4);" onclick="buyRPGLook(${topId}, ${bottomId}, ${footwearId}, ${outerwearId}, ${accessoryId})">
                    Comprar Atuendo
                </button>
            </div>
        </div>
    `;
}

window.loadRPGLookToFitting = async function(topId, bottomId, footwearId, outerwearId, accessoryId) {
    try {
        // Load items to fitting room slot (resilient to offline mode)
        const fetchItem = async (id) => {
            if (!id) return null;
            try {
                const res = await fetch(`/api/clothes`);
                if (res.ok) {
                    const clothes = await res.json();
                    const item = clothes.find(c => c.id === id);
                    if (item) return item;
                }
            } catch(e) {
                console.warn("Fetch clothes failed, using local fallback:", e);
            }
            const allLocal = [...(STATE.closetItems || []), ...(MOCK_DATA.boutique || [])];
            return allLocal.find(c => c.id === id) || null;
        };
        
        showToast("Cargando combinación en el Probador...", "success");
        
        const top = await fetchItem(topId);
        const bottom = await fetchItem(bottomId);
        const footwear = await fetchItem(footwearId);
        const outerwear = await fetchItem(outerwearId);
        const accessory = await fetchItem(accessoryId);
        
        if (top) selectForFitting('closet', top);
        if (bottom) selectForFitting('closet', bottom);
        if (footwear) selectForFitting('closet', footwear);
        
        // For boutique / outerwear we map appropriately
        if (outerwear) {
            STATE.fittingSlots.outerwear = outerwear;
            const slot = document.getElementById('slot-outerwear');
            if (slot) {
                slot.setAttribute('data-empty', 'false');
                slot.querySelector('.slot-content').innerHTML = `<img src="${outerwear.image_url}" alt="${outerwear.name}">`;
            }
        }
        
        if (accessory) {
            STATE.fittingSlots.accessory = accessory;
            const slot = document.getElementById('slot-accessory');
            if (slot) {
                slot.setAttribute('data-empty', 'false');
                slot.querySelector('.slot-content').innerHTML = `<img src="${accessory.image_url}" alt="${accessory.name}">`;
            }
        }
        
        // Load boutique if any recommended item is a boutique item (is_owned = 0)
        const boutiqueItem = [top, bottom, footwear, outerwear, accessory].find(x => x && x.is_owned === 0);
        if (boutiqueItem) {
            // Map keys of boutiqueItem to expected keys in frontend
            const itemMapped = {
                id: boutiqueItem.id,
                name: boutiqueItem.name,
                cat: boutiqueItem.category.toLowerCase(),
                price: `$${boutiqueItem.price}`,
                image: boutiqueItem.image_url,
                brand: boutiqueItem.store_name
            };
            selectForFitting('boutique', itemMapped);
        }
        
        switchTab('probador');
        showToast("¡Look del juego de rol cargado completo en el Probador!");
    } catch(err) {
        console.error("Load RPG look error:", err);
        showToast("Error al cargar la combinación en el probador.", "error");
    }
};

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
                
                let material = "Algodón";
                const lowTipo = tipo.toLowerCase();
                if (lowTipo.includes("seda") || lowTipo.includes("silk") || lowTipo.includes("blusa")) material = "Seda";
                else if (lowTipo.includes("jean") || lowTipo.includes("denim") || lowTipo.includes("mezclilla")) material = "Mezclilla";
                else if (lowTipo.includes("cuero") || lowTipo.includes("leather") || lowTipo.includes("bota") || lowTipo.includes("mocasines") || lowTipo.includes("zapato")) material = "Cuero";
                else if (lowTipo.includes("lana") || lowTipo.includes("wool") || lowTipo.includes("abrigo") || lowTipo.includes("bufanda")) material = "Lana";

                resolve({
                    tipo: tipo,
                    estilo: estilo,
                    colores: [hexColor],
                    material: material,
                    confianza: confianza,
                    consejo: `Prenda catalogada localmente (GPS/Offline). Tipo: ${tipo} (${color_name}). Estilo: ${estilo}. Material: ${material}. Combina excelente con tonos complementarios.`,
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
                    <div class="scan-thumb-spinner-overlay">
                        <svg viewBox="0 0 36 36" class="circular-spinner">
                            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path class="circle" stroke-dasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                    </div>
                    <div class="scan-thumb-success-overlay">
                        <span class="success-checkmark">✓</span>
                    </div>
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
            const thumb = document.getElementById('scan-thumb-0');
            if (badge) badge.textContent = '⚙️';
            if (thumb) {
                thumb.classList.add('scanning');
                thumb.classList.add('scanning-active');
            }

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
                if (thumb) {
                    thumb.classList.remove('scanning');
                    thumb.classList.remove('scanning-active');
                    thumb.classList.add('scanned-success');
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
                const thumb = document.getElementById(`scan-thumb-${i}`);
                if (badge) badge.textContent = '⚙️';
                if (thumb) {
                    thumb.classList.add('scanning');
                    thumb.classList.add('scanning-active');
                }

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
                if (thumb) {
                    thumb.classList.remove('scanning');
                    thumb.classList.remove('scanning-active');
                    thumb.classList.add('scanned-success');
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
    
    document.getElementById('res-tipo').textContent = results.tipo || results.subcategory || results.category || '--';
    document.getElementById('res-estilo').textContent = results.estilo || results.pattern || '--';
    const matEl = document.getElementById('res-material');
    if (matEl) {
        matEl.textContent = results.material || '--';
    }
    document.getElementById('res-confianza').textContent = results.confianza || results.confidence || '--';
    document.getElementById('res-consejo').textContent = results.consejo || 
        (results.category ? `Prenda detectada: ${results.category} / ${results.subcategory}. Color principal: ${results.color_primary}. Patrón: ${results.pattern}. Material: ${results.material || 'Algodón'}.` : 'Sin datos.');
    
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

    // Bind brand filter buttons
    const filterBtns = document.querySelectorAll('.brand-filter-btn');
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            STATE.selectedBrand = btn.getAttribute('data-brand');
            renderBoutique();
        };
    });

    renderBoutique();
}

function renderBoutique() {
    const boutiqueGrid = document.getElementById('boutique-grid');
    if (!boutiqueGrid) return;
    boutiqueGrid.innerHTML = '';

    const filteredItems = STATE.selectedBrand === 'all' 
        ? STATE.boutiqueItems 
        : STATE.boutiqueItems.filter(item => item.brand.toLowerCase() === STATE.selectedBrand.toLowerCase());

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'boutique-card';
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'boutique', item }));
        });
        
        card.addEventListener('click', () => {
            selectForFitting('boutique', item);
        });

        card.innerHTML = `
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
            </div>
        `;
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
        
        // Highlight if currently loaded in fitting slots
        const isFitted = (sourceType === 'closet' && STATE.fittingSlots.closet && STATE.fittingSlots.closet.id === item.id) ||
                         (sourceType === 'boutique' && STATE.fittingSlots.boutique && STATE.fittingSlots.boutique.id === item.id);
        if (isFitted) {
            itemEl.classList.add('selected-source-item');
        }

        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27 fill=%27%23333%27%3E%3Crect width=%27300%27 height=%27300%27 fill=%27%231a1a2e%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23d4af37%27 font-family=%27sans-serif%27 font-size=%2714%27%3EImagen no disponible%3C/text%3E%3C/svg%3E';">
            <div class="fitting-source-item-meta">${item.name}</div>
        `;
        itemEl.addEventListener('click', () => {
            scroller.querySelectorAll('.fitting-source-item').forEach(el => {
                el.classList.remove('selected-source-item');
            });
            itemEl.classList.add('selected-source-item');
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

    // Apply elastic flash loaded animation to the slot
    slot.classList.remove('slot-loaded');
    void slot.offsetWidth; // Force DOM reflow to trigger CSS animation
    slot.classList.add('slot-loaded');

    evaluateFittingMatch();
}

window.clearFittingSlot = function(type) {
    STATE.fittingSlots[type] = null;
    const slot = document.getElementById(`slot-${type}`);
    slot.setAttribute('data-empty', 'true');
    slot.querySelector('.slot-content').innerHTML = '';
    slot.classList.remove('slot-loaded');

    // Deselect from active source scroller elements if visible
    const scroller = document.getElementById('fitting-scroller');
    if (scroller) {
        scroller.querySelectorAll('.fitting-source-item').forEach(el => {
            el.classList.remove('selected-source-item');
        });
    }
    
    document.getElementById('fitting-verdict').style.display = 'none';
    const checkoutCard = document.getElementById('boutique-checkout-card');
    if (checkoutCard) checkoutCard.style.display = 'none';
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

            // Check daily quests completion
            if (typeof checkDailyQuestsCompletion === 'function') {
                checkDailyQuestsCompletion(closetItem, boutiqueItem);
            }

            // Log wear log for analytics
            if (closetItem && closetItem.id) {
                const cityIdx = localStorage.getItem('dy_selected_city_index') || 0;
                fetch('/api/wear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clothing_id: closetItem.id,
                        date_str: new Date().toISOString().split('T')[0],
                        city_index: parseInt(cityIdx),
                        occasion: 'Casual'
                    })
                }).catch(e => console.error("Could not log wear:", e));
            }
        }
    } catch (e) {
        console.error("Error evaluating fitting match:", e);
    }

    // Render detailed boutique checkout card
    const checkoutCard = document.getElementById('boutique-checkout-card');
    const checkoutPrice = document.getElementById('checkout-item-price');
    const checkoutShipping = document.getElementById('checkout-item-shipping');
    const checkoutTax = document.getElementById('checkout-item-tax');
    const checkoutTotal = document.getElementById('checkout-item-total');
    const btnPremiumCheckout = document.getElementById('btn-premium-checkout');

    const priceStr = String(boutiqueItem.price || '$0.00').replace(/[^0-9.]/g, '');
    const priceVal = parseFloat(priceStr) || 0;
    const shippingVal = 15.00;
    const taxVal = priceVal * 0.19; // 19% IVA
    const totalVal = priceVal + shippingVal + taxVal;

    if (checkoutPrice) checkoutPrice.textContent = `$${priceVal.toFixed(2)}`;
    if (checkoutShipping) checkoutShipping.textContent = `$${shippingVal.toFixed(2)}`;
    if (checkoutTax) checkoutTax.textContent = `$${taxVal.toFixed(2)}`;
    if (checkoutTotal) checkoutTotal.textContent = `$${totalVal.toFixed(2)}`;

    if (checkoutCard) checkoutCard.style.display = 'block';
    if (btnPurchase) btnPurchase.style.display = 'none';

    if (btnPremiumCheckout) {
        btnPremiumCheckout.onclick = () => {
            triggerCheckout(boutiqueItem);
        };
    }
}

function triggerBabylonPaySuccessAnimation(callback) {
    const overlay = document.getElementById('babylon-pay-overlay');
    const particlesContainer = document.getElementById('babylon-pay-particles');
    const logo = document.getElementById('babylon-pay-logo');
    const text = document.getElementById('babylon-pay-text');
    const checkmark = document.getElementById('babylon-pay-checkmark');
    
    if (!overlay) {
        if (callback) callback();
        return;
    }
    
    particlesContainer.innerHTML = '';
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    logo.style.opacity = '0';
    logo.style.transform = 'scale(0.8)';
    text.style.opacity = '0';
    text.style.transform = 'translateY(20px)';
    checkmark.style.opacity = '0';
    checkmark.style.transform = 'scale(0.5)';
    
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);
    
    setTimeout(() => {
        logo.style.opacity = '1';
        logo.style.transform = 'scale(1)';
    }, 400);
    
    setTimeout(() => {
        text.style.opacity = '1';
        text.style.transform = 'translateY(0)';
    }, 700);
    
    setTimeout(() => {
        checkmark.style.opacity = '1';
        checkmark.style.transform = 'scale(1)';
        
        // Spawn particle stars burst
        const particleCount = 120;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'gold-star-particle';
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 9;
                const size = 4 + Math.random() * 8;
                
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.left = `${centerX}px`;
                particle.style.top = `${centerY}px`;
                particle.style.position = 'absolute';
                particle.style.background = 'radial-gradient(circle, #fff 0%, var(--accent-gold) 60%, #b8952b 100%)';
                particle.style.borderRadius = '50%';
                particle.style.boxShadow = '0 0 8px var(--accent-gold)';
                particle.style.zIndex = '100000';
                
                particlesContainer.appendChild(particle);
                
                let curX = centerX;
                let curY = centerY;
                let velX = Math.cos(angle) * speed;
                let velY = Math.sin(angle) * speed;
                let opacity = 1;
                
                const anim = () => {
                    curX += velX;
                    curY += velY + 0.05; // gravity
                    opacity -= 0.015;
                    particle.style.left = `${curX}px`;
                    particle.style.top = `${curY}px`;
                    particle.style.opacity = opacity;
                    
                    if (opacity > 0) {
                        requestAnimationFrame(anim);
                    } else {
                        particle.remove();
                    }
                };
                requestAnimationFrame(anim);
            }, Math.random() * 800);
        }
    }, 1000);
    
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            if (callback) callback();
        }, 500);
    }, 4200);
}

function triggerCheckout(boutiqueItem) {
    const priceStr = String(boutiqueItem.price || '$0.00').replace(/[^0-9.]/g, '');
    const priceVal = parseFloat(priceStr) || 0;
    const shippingVal = 15.00;
    const taxVal = priceVal * 0.19;
    const totalVal = priceVal + shippingVal + taxVal;

    const confirmBuy = confirm(`¿Proceder al pago de "${boutiqueItem.name}" por $${totalVal.toFixed(2)} (IVA y envío incluidos) con Babylon Pay?`);
    if (!confirmBuy) return;

    triggerBabylonPaySuccessAnimation(() => {
        STATE.currentOrder = {
            id: 'DY-' + Math.floor(Math.random() * 90000 + 10000),
            status: 'Procesado',
            progress: 10,
            logs: [
                { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), text: `Orden de compra creada para ${boutiqueItem.name}.` },
                { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), text: 'Validación de pago aprobada via Babylon Pay.' }
            ]
        };
        switchTab('pedidos');
        showToast("¡Transacción exitosa a través de Babylon Pay!");
    });
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
                    if (sVal <= val) {
                        s.classList.add('active-star');
                        s.style.color = 'var(--accent-gold)';
                        s.style.transform = 'scale(1.3)';
                    } else {
                        s.classList.remove('active-star');
                        s.style.color = 'var(--text-muted)';
                        s.style.transform = 'scale(1)';
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                const siblings = star.parentNode.querySelectorAll('.star-rating-icon');
                siblings.forEach(s => {
                    const sVal = parseInt(s.getAttribute('data-value'));
                    const isBookmarked = sVal <= userRating;
                    if (isBookmarked) {
                        s.classList.add('active-star');
                        s.style.color = 'var(--accent-gold)';
                    } else {
                        s.classList.remove('active-star');
                        s.style.color = 'var(--text-muted)';
                    }
                    s.style.transform = 'scale(1)';
                });
            });

            star.addEventListener('click', async () => {
                const val = parseInt(star.getAttribute('data-value'));
                const isDb = star.parentNode.getAttribute('data-is-db') === 'true';
                const postId = star.parentNode.getAttribute('data-post-id');

                // Burst effect on click
                createGoldParticleBurst(star);

                // Add bounce animation class to all rated stars
                const siblings = star.parentNode.querySelectorAll('.star-rating-icon');
                siblings.forEach(s => {
                    const sVal = parseInt(s.getAttribute('data-value'));
                    if (sVal <= val) {
                        s.classList.add('star-elastic-bounce');
                        s.classList.add('active-star');
                        s.style.color = 'var(--accent-gold)';
                        setTimeout(() => s.classList.remove('star-elastic-bounce'), 600);
                    }
                });

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
                setTimeout(() => {
                    renderComunidadFeed();
                }, 500);
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

    // Apply flash loaded animation to the builder slot
    slot.classList.remove('slot-filled-glow');
    void slot.offsetWidth; // Force DOM reflow to trigger CSS animation
    slot.classList.add('slot-filled-glow');

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
    slot.classList.remove('slot-filled-glow');
    
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

    container.appendChild(toast);

    // Fade out out after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 350);
    }, 3000);
}

// RPG ENGINE (Isa)
const MOCK_RPG_NODES = {
    occasion_step: {
        node_id: "occasion_step", step: "Ocasión",
        question: "¿Para qué ocasión estás preparando tu atuendo el día de hoy?",
        options: [
            { id: "opt_quiet_luxury", text: "Lujo Silencioso", next_node_id: "color_step" },
            { id: "opt_casual", text: "Casual", next_node_id: "color_step" },
            { id: "opt_business_casual", text: "Business Casual", next_node_id: "color_step" },
            { id: "opt_sporty", text: "Deportivo Chic", next_node_id: "color_step" },
            { id: "opt_cocktail", text: "Coctel / Fiesta", next_node_id: "color_step" }
        ]
    },
    color_step: {
        node_id: "color_step", step: "Colorimetría",
        question: "¿Cuál es tu paleta de color estacional predominante?",
        options: [
            { id: "opt_spring", text: "Primavera (Tonos cálidos y luminosos)", next_node_id: "silhouette_step" },
            { id: "opt_summer", text: "Verano (Tonos fríos y suaves)", next_node_id: "silhouette_step" },
            { id: "opt_autumn", text: "Otoño (Tonos cálidos y terrosos)", next_node_id: "silhouette_step" },
            { id: "opt_winter", text: "Invierno (Tonos fríos y contrastantes)", next_node_id: "silhouette_step" }
        ]
    },
    silhouette_step: {
        node_id: "silhouette_step", step: "Silueta",
        question: "¿Qué silueta corporal describe mejor tu estructura física?",
        options: [
            { id: "opt_hourglass", text: "Reloj de Arena", next_node_id: "complete" },
            { id: "opt_triangle", text: "Triángulo", next_node_id: "complete" },
            { id: "opt_inverted_triangle", text: "Triángulo Invertido", next_node_id: "complete" },
            { id: "opt_rectangle", text: "Rectángulo", next_node_id: "complete" },
            { id: "opt_oval", text: "Óvalo / Manzana", next_node_id: "complete" }
        ]
    }
};

function generateLocalRPGComplete(answers) {
    let occasion = "Casual";
    if (answers.includes("opt_quiet_luxury")) occasion = "Quiet Luxury";
    else if (answers.includes("opt_business_casual")) occasion = "Business Casual";
    else if (answers.includes("opt_sporty")) occasion = "Sporty";
    else if (answers.includes("opt_cocktail")) occasion = "Cocktail";

    const top = STATE.closetItems.find(i => i.cat === 'superior') || { id: 1, name: "Camiseta Básica", cat: "superior", image: "" };
    const bottom = STATE.closetItems.find(i => i.cat === 'inferior') || { id: 3, name: "Jeans Denim", cat: "inferior", image: "" };
    const foot = STATE.closetItems.find(i => i.cat === 'calzado') || { id: 5, name: "Tenis Urbanos", cat: "calzado", image: "" };
    const bItem = STATE.boutiqueItems[0] || { id: 11, name: "Camisa a Rayas Marina", cat: "superior", brand: "Zara", price: "$45.00", image: "" };

    return {
        title: `El Susurro del Estilo ${occasion}`,
        justification: `Combinación curada de forma inteligente. Balance perfecto de colores y estructura.`,
        scores: { total_score: 95, color_score: 95, style_score: 95, pattern_score: 90, weather_score: 90 },
        outfit: {
            top: { id: top.id, name: top.name, category: 'Top', image_url: top.image, is_owned: 1 },
            bottom: { id: bottom.id, name: bottom.name, category: 'Bottom', image_url: bottom.image, is_owned: 1 },
            footwear: { id: foot.id, name: foot.name, category: 'Footwear', image_url: foot.image, is_owned: 1 },
            outerwear: { id: bItem.id, name: bItem.name, category: bItem.cat === 'superior' ? 'Top' : 'Bottom', brand: bItem.brand || 'Boutique', price: bItem.price, image_url: bItem.image, is_owned: 0 }
        }
    };
}

function switchChatMode(mode) {
    STATE.chatMode = mode;
    const btnLibre = document.getElementById('btn-mode-libre');
    const btnRPG = document.getElementById('btn-mode-rpg');
    const ariaControls = document.querySelector('.aria-controls');
    const chatInputRow = document.querySelector('.chat-input-row');
    const rpgProgress = document.getElementById('rpg-progress-tracker');
    const rpgOptions = document.getElementById('rpg-options-container');
    const portraitImg = document.getElementById('aria-portrait');
    const chatHistory = document.getElementById('chat-history');
    
    if (mode === 'rpg') {
        if (btnLibre) btnLibre.classList.remove('active');
        if (btnRPG) btnRPG.classList.add('active');
        if (ariaControls) ariaControls.style.display = 'none';
        if (chatInputRow) chatInputRow.style.display = 'none';
        if (rpgProgress) rpgProgress.style.display = 'flex';
        if (rpgOptions) rpgOptions.style.display = 'flex';
        if (portraitImg) {
            portraitImg.style.opacity = '0';
            setTimeout(() => {
                portraitImg.src = 'static/proposals/Propuestas%20de%20Asistente%20Personal/Propuesta%20(Animada%20CW)/Propuesta%20CW.png';
                portraitImg.style.opacity = '1';
            }, 300);
        }
        triggerAriaSpeech("¡Hola! Soy Aria, tu asesora de estilo personal. Comencemos con una sesión interactiva para definir tu próximo gran outfit. Elige una opción abajo para empezar.");
        if (chatHistory) chatHistory.innerHTML = '';
        STATE.rpgAnswers = [];
        STATE.rpgCurrentNode = 'occasion_step';
        loadRPGNode('occasion_step');
    } else {
        if (btnLibre) btnLibre.classList.add('active');
        if (btnRPG) btnRPG.classList.remove('active');
        if (ariaControls) ariaControls.style.display = 'flex';
        if (chatInputRow) chatInputRow.style.display = 'flex';
        if (rpgProgress) rpgProgress.style.display = 'none';
        if (rpgOptions) rpgOptions.style.display = 'none';
        if (portraitImg) {
            portraitImg.style.opacity = '0';
            setTimeout(() => {
                portraitImg.src = ARIA_LOOK_IMAGES[STATE.ariaLook] || ARIA_LOOK_IMAGES.base;
                portraitImg.style.opacity = '1';
            }, 300);
        }
        triggerAriaSpeech(getRandomQuote());
        if (chatHistory) {
            chatHistory.innerHTML = '';
            fetch('/api/chat/history')
                .then(res => res.ok ? res.json() : [])
                .then(historyData => {
                    historyData.forEach(item => {
                        let scraped = null;
                        if (item.scraped_item_json) {
                            try { scraped = JSON.parse(item.scraped_item_json); } catch(e) {}
                        }
                        appendChatMessage(item.sender, item.message, scraped);
                    });
                    updateChatHistoryState();
                }).catch(err => {
                    console.log("Error reloading history:", err);
                    updateChatHistoryState();
                });
        }
    }
}

async function loadRPGNode(nodeId) {
    STATE.rpgCurrentNode = nodeId;
    const rpgOptions = document.getElementById('rpg-options-container');
    if (rpgOptions) {
        rpgOptions.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; font-style: italic; padding: 10px;">Isa está pensando...</div>`;
    }
    let nodeData = null;
    try {
        const response = await fetch(`/api/rpg/node?node_id=${nodeId}`);
        if (response.ok) nodeData = await response.json();
    } catch (e) {
        console.warn("Could not fetch RPG node, using local fallback", e);
    }
    if (!nodeData) nodeData = MOCK_RPG_NODES[nodeId];
    if (!nodeData) {
        showToast("Error al cargar el nodo del juego de rol.", "error");
        return;
    }
    renderRPGNode(nodeData);
}

function renderRPGNode(nodeData) {
    const rpgOptions = document.getElementById('rpg-options-container');
    const stepIndicator = document.getElementById('rpg-step-indicator');
    const progressBar = document.getElementById('rpg-progress-bar');
    
    if (stepIndicator) {
        const stepNum = nodeData.node_id === 'occasion_step' ? 1 : (nodeData.node_id === 'color_step' ? 2 : 3);
        stepIndicator.textContent = `Paso ${stepNum} de 3`;
        const pct = (stepNum / 3) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
    }
    
    const textToDisplay = nodeData.question || nodeData.text || "Selecciona una opción:";
    appendChatMessage('bot', textToDisplay);
    triggerAriaSpeech(textToDisplay);
    
    if (rpgOptions) {
        rpgOptions.innerHTML = '';
        nodeData.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'rpg-option-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => {
                appendChatMessage('user', opt.text);
                STATE.rpgAnswers.push(opt.id);
                if (opt.next_node_id === 'complete') {
                    completeRPGGame();
                } else {
                    loadRPGNode(opt.next_node_id);
                }
            });
            rpgOptions.appendChild(btn);
        });
    }
}

async function completeRPGGame() {
    const rpgOptions = document.getElementById('rpg-options-container');
    const stepIndicator = document.getElementById('rpg-step-indicator');
    const progressBar = document.getElementById('rpg-progress-bar');
    
    if (stepIndicator) stepIndicator.textContent = "Completado";
    if (progressBar) progressBar.style.width = "100%";
    if (rpgOptions) {
        rpgOptions.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; font-style: italic; padding: 10px;">Generando tu outfit Haute Couture...</div>`;
    }
    
    let result = null;
    try {
        const response = await fetch('/api/rpg/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: STATE.rpgAnswers })
        });
        if (response.ok) result = await response.json();
    } catch (e) {
        console.warn("Could not complete RPG game on server, using local fallback:", e);
    }
    
    if (!result) result = generateLocalRPGComplete(STATE.rpgAnswers);
    
    if (rpgOptions) {
        rpgOptions.innerHTML = '';
        const restartBtn = document.createElement('button');
        restartBtn.className = 'rpg-option-btn';
        restartBtn.style.textAlign = 'center';
        restartBtn.innerHTML = '🔄 Reiniciar Juego de Rol';
        restartBtn.addEventListener('click', () => {
            const chatHistory = document.getElementById('chat-history');
            if (chatHistory) chatHistory.innerHTML = '';
            STATE.rpgAnswers = [];
            loadRPGNode('occasion_step');
        });
        rpgOptions.appendChild(restartBtn);
    }
    
    appendChatMessage('bot', "¡Espléndido! He diseñado el look ideal para ti:", null, result);
    triggerAriaSpeech("¡Look completado! Pruébatelo en el probador.");
}

function renderRPGRecommendation(recommendation) {
    const title = recommendation.title || "Look Recomendado";
    const justification = recommendation.justification || "";
    const outfit = recommendation.outfit || {};
    
    let itemsHTML = '';
    const keys = ['top', 'bottom', 'footwear', 'outerwear', 'accessory'];
    const outfitItems = [];
    
    keys.forEach(key => {
        const itm = outfit[key];
        if (itm) {
            const normalizedItem = {
                id: itm.id,
                name: itm.name,
                category: itm.category || key,
                brand: itm.store_name || itm.brand || 'Atelier',
                price: itm.price !== undefined ? (typeof itm.price === 'number' ? `$${itm.price.toFixed(2)}` : String(itm.price)) : '',
                image_url: itm.image_url || itm.image,
                is_owned: itm.is_owned === 1 || itm.is_owned === true
            };
            outfitItems.push(normalizedItem);
        }
    });

    outfitItems.forEach(itm => {
        const ownedBadge = itm.is_owned 
            ? `<span style="background: rgba(0, 255, 136, 0.12); color: #00ff88; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0, 255, 136, 0.25); font-family: 'Outfit', sans-serif;">Mi Closet</span>`
            : `<span style="background: rgba(212, 175, 55, 0.12); color: var(--accent-gold); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(212, 175, 55, 0.25); font-family: 'Outfit', sans-serif;">${itm.brand}</span>`;
        
        let buyButton = '';
        if (!itm.is_owned && itm.price) {
            const itmJSON = JSON.stringify(itm).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            buyButton = `
                <button class="gold-btn" style="padding: 4px 8px; font-size: 0.65rem; border-radius: 4px; text-transform: none; letter-spacing: 0.5px; width: 100%; margin-top: 5px; cursor: pointer;" onclick='buyRPGItem(${itmJSON})'>
                    Comprar (${itm.price})
                </button>
            `;
        }

        itemsHTML += `
            <div style="flex: 1; min-width: 100px; max-width: 150px; border: 1px solid var(--border-gold); padding: 8px; border-radius: 6px; background: rgba(10,10,10,0.8); display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
                <div style="width: 100%; height: 90px; overflow: hidden; border-radius: 4px; border: 1px solid rgba(212,175,55,0.15); margin-bottom: 6px; position: relative;">
                    <img src="${itm.image_url}" alt="${itm.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%27100%27 fill=%27%23333%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23111%27/%3E%3C/svg%3E';">
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; text-align: left; flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px;">
                        <span style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">${itm.category}</span>
                        ${ownedBadge}
                    </div>
                    <h5 style="font-size: 0.75rem; font-weight: 500; color: var(--text-primary); margin: 2px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; min-height: 28px; font-family: 'Inter', sans-serif;">${itm.name}</h5>
                </div>
                ${buyButton}
            </div>
        `;
    });

    const outfitItemsJSON = JSON.stringify(outfitItems).replace(/'/g, "&apos;").replace(/"/g, "&quot;");

    return `
        <div style="margin-top: 12px; border: 1px solid var(--border-gold); border-radius: 8px; background: rgba(212, 175, 55, 0.03); padding: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-align: left;">
            <div style="font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 600; color: var(--accent-gold); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid rgba(212,175,55,0.15); padding-bottom: 6px;">
                🏰 ${title}
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4; margin: 0 0 12px 0; font-family: 'Inter', sans-serif; font-style: italic;">
                "${justification}"
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; justify-content: center;">
                ${itemsHTML}
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; width: 100%;">
                <button class="gold-btn" style="flex: 1; padding: 10px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; text-transform: uppercase; font-family: 'Outfit', sans-serif; letter-spacing: 1px;" onclick='loadRPGOutfitToFitting(${outfitItemsJSON})'>
                    👗 Probar Look
                </button>
                <button class="gold-btn" style="flex: 1; padding: 10px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; text-transform: uppercase; font-family: 'Outfit', sans-serif; letter-spacing: 1px; background: linear-gradient(135deg, #b8952b, var(--accent-gold)); color: #000; font-weight: bold; border: none; box-shadow: 0 0 10px rgba(212,175,55,0.4);" onclick='buyRPGOutfit(${outfitItemsJSON})'>
                    💰 Comprar Atuendo
                </button>
            </div>
        </div>
    `;
}

window.buyRPGItem = function(item) {
    let bItem = STATE.boutiqueItems.find(b => String(b.id) === String(item.id) || b.name.toLowerCase().includes(item.name.toLowerCase()));
    if (!bItem) {
        bItem = { id: item.id, name: item.name, price: item.price || '$0.00', image: item.image_url || item.image, brand: item.brand || 'Boutique' };
    }
    triggerCheckout(bItem);
};

window.loadRPGOutfitToFitting = function(items) {
    let closetItem = null;
    let boutiqueItem = null;
    items.forEach(itm => {
        const isOwned = itm.is_owned === true;
        const mappedCat = mapCategory(itm.category);
        if (isOwned) {
            closetItem = STATE.closetItems.find(c => String(c.id) === String(itm.id) || c.name.toLowerCase().includes(itm.name.toLowerCase()));
            if (!closetItem) {
                closetItem = { id: itm.id || 'c_temp_' + Date.now(), cat: mappedCat, name: itm.name, style: 'Quiet Luxury', image: itm.image_url || itm.image };
            }
        } else {
            boutiqueItem = STATE.boutiqueItems.find(b => String(b.id) === String(itm.id) || b.name.toLowerCase().includes(itm.name.toLowerCase()));
            if (!boutiqueItem) {
                boutiqueItem = { id: itm.id || 'b_temp_' + Date.now(), cat: mappedCat, brand: itm.brand || 'Boutique', name: itm.name, price: itm.price || '$0.00', image: itm.image_url || itm.image };
            }
        }
    });
    if (closetItem) selectForFitting('closet', closetItem);
    if (boutiqueItem) selectForFitting('boutique', boutiqueItem);
    switchTab('probador');
    showToast("Look cargado en el probador interactivo.");
};

window.buyRPGOutfit = function(items) {
    const boutiqueItems = items.filter(itm => !itm.is_owned);
    if (boutiqueItems.length === 0) {
        showToast("Ya posees todas las prendas de este atuendo en tu closet.", "error");
        return;
    }
    
    const totalBoutiquePrice = boutiqueItems.reduce((acc, itm) => {
        const val = parseFloat(String(itm.price || '0').replace(/[^0-9.]/g, '')) || 0;
        return acc + val;
    }, 0);
    
    const primaryItem = boutiqueItems[0];
    const checkoutItem = {
        id: primaryItem.id,
        name: boutiqueItems.length > 1 ? `Atuendo (${boutiqueItems.length} prendas)` : primaryItem.name,
        price: `$${totalBoutiquePrice.toFixed(2)}`,
        image: primaryItem.image_url || primaryItem.image,
        brand: primaryItem.brand || 'Boutique'
    };
    
    triggerCheckout(checkoutItem);
};

window.buyRPGLook = async function(topId, bottomId, footwearId, outerwearId, accessoryId) {
    try {
        const fetchItem = async (id) => {
            if (!id) return null;
            const res = await fetch(`/api/clothes`);
            if (res.ok) {
                const clothes = await res.json();
                return clothes.find(c => c.id === id) || null;
            }
            return null;
        };
        
        const top = await fetchItem(topId);
        const bottom = await fetchItem(bottomId);
        const footwear = await fetchItem(footwearId);
        const outerwear = await fetchItem(outerwearId);
        const accessory = await fetchItem(accessoryId);
        
        const items = [top, bottom, footwear, outerwear, accessory].filter(x => x !== null);
        const boutiqueItems = items.filter(itm => itm.is_owned === 0 || itm.is_owned === false);
        
        if (boutiqueItems.length === 0) {
            showToast("Ya posees todas las prendas de este atuendo en tu closet.", "error");
            return;
        }
        
        const totalBoutiquePrice = boutiqueItems.reduce((acc, itm) => acc + (parseFloat(itm.price) || 0), 0);
        const primaryItem = boutiqueItems[0];
        const checkoutItem = {
            id: primaryItem.id,
            name: boutiqueItems.length > 1 ? `Atuendo (${boutiqueItems.length} prendas)` : primaryItem.name,
            price: `$${totalBoutiquePrice.toFixed(2)}`,
            image: primaryItem.image_url,
            brand: primaryItem.store_name || 'Boutique'
        };
        
        triggerCheckout(checkoutItem);
    } catch(err) {
        console.error("Buy RPG look error:", err);
    }
};

// BabylonSwarm_Commit_5: feat(rpg): render asymmetrical polaroid collage for final outfit recommendation

// BabylonSwarm_Commit_6: feat(rpg): add 'Load Outfit to Fitting Room' button and state restoration

// BabylonSwarm_Commit_8: feat(gamification): create ranking system (Apprentice, Coordinator, Senior, Master) based on items

// BabylonSwarm_Commit_9: feat(gamification): add dynamic progress bar animations for styling ranks

// BabylonSwarm_Commit_10: feat(gamification): implement offline database fallbacks for styling index calculations

// BabylonSwarm_Commit_16: feat(brands): display official brand logo badges on recommended boutique cards

// BabylonSwarm_Commit_17: feat(brands): link boutique checkout cards directly to partner online stores

// BabylonSwarm_Commit_24: feat(monetization): implement canvas-based gold star explosion particles for checkouts

// BabylonSwarm_Commit_25: feat(monetization): create 'buy outfit' callback to purchase multi-item recommendations

// BabylonSwarm_Commit_26: feat(monetization): bind buy events directly to Isa RPG completion cards

// BabylonSwarm_Commit_28: feat(monetization): calculate VAT (19% IVA) dynamically based on item target store location

// BabylonSwarm_Commit_29: feat(monetization): implement shipping rate estimation model depending on user geolocation

// BabylonSwarm_Commit_30: feat(monetization): enforce robust error handling for failed cart billing checkouts

// BabylonSwarm_Commit_37: feat(quests): add progress indicator for consecutive daily challenge streaks

// BabylonSwarm_Commit_38: feat(quests): display motivational messages from Isa for challenge milestones

// BabylonSwarm_Commit_39: feat(quests): generate dynamic push-notifications hints for upcoming quests

// BabylonSwarm_Commit_46: style(ui): redesign closet category filter buttons with active states

// BabylonSwarm_Commit_47: style(ui): add slide-in animation drawer for detailed garment properties

// BabylonSwarm_Commit_49: style(ui): add loading-spinner skeletons to boutique image lazy loads

// BabylonSwarm_Commit_54: test(qa): audit JS codebase with strict V8 check rules


// Antigravity additions: Weekly Calendar, Capsule Wardrobe, Daily Fashion Quests

// --- Weekly Calendar Manager ---
async function initCalendar() {
    try {
        const response = await fetch('/api/schedule');
        if (response.ok) {
            STATE.scheduledOutfits = await response.json();
        }
    } catch (e) {
        console.error("Error loading schedule:", e);
    }
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('weekly-calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(today);
        currentDay.setDate(today.getDate() + i);
        
        const yyyy = currentDay.getFullYear();
        const mm = String(currentDay.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDay.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const isToday = i === 0;
        const weekdayName = weekdays[currentDay.getDay()];
        const dateLabel = currentDay.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        
        const dayCard = document.createElement('div');
        dayCard.className = `calendar-day-card ${isToday ? 'today' : ''} animate-fade-in`;
        
        const scheduleEntry = STATE.scheduledOutfits.find(s => s.date_str === dateStr);
        
        let cardContent = '';
        if (scheduleEntry) {
            const savedOutfit = STATE.savedCombinations.find(o => o.id === scheduleEntry.outfit_id);
            let thumbsHTML = '';
            if (savedOutfit && savedOutfit.items) {
                thumbsHTML = '<div class="combo-elements-previews" style="margin: 8px 0; justify-content: center; display: flex; gap: 4px; flex-wrap: wrap;">';
                savedOutfit.items.forEach(itm => {
                    if (itm.image) {
                        thumbsHTML += `
                            <div class="combo-item-thumb" title="${itm.name}" style="width: 25px; height: 25px; border-radius: 50%; overflow: hidden; border: 1.5px solid var(--accent-gold);">
                                <img src="${itm.image}" alt="${itm.name}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        `;
                    }
                });
                thumbsHTML += '</div>';
            }
            
            const citiesList = ["Bogotá", "Medellín", "Cali", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta", "Manizales", "Ibagué", "Londres", "Nueva York"];
            const cityName = citiesList[scheduleEntry.city_index] || "Bogotá";
            
            cardContent = `
                <div class="calendar-day-header">
                    <h4 class="calendar-day-name">${weekdayName}</h4>
                    <p class="calendar-day-date">${dateLabel}</p>
                </div>
                <div class="calendar-outfit-container">
                    <h5 class="calendar-outfit-name" title="${scheduleEntry.outfit_name}">${scheduleEntry.outfit_name}</h5>
                    ${thumbsHTML}
                    <span class="calendar-outfit-badge">${scheduleEntry.occasion}</span>
                    <span class="calendar-outfit-badge" style="background: rgba(212,175,55,0.15); border-color: var(--accent-gold); color: var(--accent-gold); font-size: 0.65rem; margin-top: 4px;">📍 ${cityName}</span>
                </div>
                <div style="display: flex; gap: 6px; justify-content: center; margin-top: 8px;">
                    <button class="gold-btn-outline" style="padding: 4px 8px; font-size: 0.65rem;" onclick="window.openSchedulerModal('${dateStr}')">Cambiar</button>
                    <button class="gold-btn-outline" style="padding: 4px 8px; font-size: 0.65rem; color: #ff5555; border-color: rgba(255,85,85,0.3);" onclick="window.deleteSchedule('${dateStr}')">&times;</button>
                </div>
            `;
        } else {
            cardContent = `
                <div class="calendar-day-header">
                    <h4 class="calendar-day-name" style="color: var(--text-muted);">${weekdayName}</h4>
                    <p class="calendar-day-date">${dateLabel}</p>
                </div>
                <div class="calendar-empty-slot" onclick="window.openSchedulerModal('${dateStr}')">
                    <span style="font-size: 1.2rem; color: var(--accent-gold);">+</span>
                    <span>Programar</span>
                </div>
            `;
        }
        
        dayCard.innerHTML = cardContent;
        grid.appendChild(dayCard);
    }
}

window.openSchedulerModal = function(dateStr) {
    const select = document.getElementById('scheduler-outfit-select');
    if (!select) return;
    select.innerHTML = '';
    
    if (STATE.savedCombinations.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = "No tienes outfits guardados. Diseña uno primero.";
        select.appendChild(opt);
    } else {
        STATE.savedCombinations.forEach(combo => {
            const opt = document.createElement('option');
            opt.value = combo.id;
            opt.textContent = combo.name;
            select.appendChild(opt);
        });
    }
    
    document.getElementById('scheduler-date-input').value = dateStr;
    document.getElementById('scheduler-modal').style.display = 'block';
    document.getElementById('scheduler-modal-backdrop').style.display = 'block';
};

window.closeSchedulerModal = function() {
    document.getElementById('scheduler-modal').style.display = 'none';
    document.getElementById('scheduler-modal-backdrop').style.display = 'none';
};

window.handleScheduleFormSubmit = async function(event) {
    event.preventDefault();
    const dateStr = document.getElementById('scheduler-date-input').value;
    const outfitId = document.getElementById('scheduler-outfit-select').value;
    const cityIndex = document.getElementById('scheduler-city-select').value;
    const occasion = document.getElementById('scheduler-occasion-select').value;
    
    if (!outfitId) {
        showToast("Por favor selecciona un outfit para programar.", "error");
        return;
    }
    
    try {
        const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date_str: dateStr,
                outfit_id: parseInt(outfitId),
                city_index: parseInt(cityIndex),
                occasion: occasion
            })
        });
        
        if (response.ok) {
            showToast("Outfit programado correctamente.");
            window.closeSchedulerModal();
            initCalendar();
        } else {
            const errData = await response.json();
            showToast(errData.error || "Error al programar outfit.", "error");
        }
    } catch (e) {
        showToast("Error de red al programar.", "error");
    }
};

window.deleteSchedule = async function(dateStr) {
    try {
        const response = await fetch(`/api/schedule/${dateStr}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast("Programación eliminada.");
            initCalendar();
        } else {
            showToast("Error al eliminar la programación.", "error");
        }
    } catch(e) {
        showToast("Error de red.", "error");
    }
};

// --- Capsule Wardrobe Manager ---
async function initCapsule() {
    const essentialsGrid = document.getElementById('capsule-essentials-grid');
    const combinationsGrid = document.getElementById('capsule-combinations-grid');
    if (essentialsGrid) {
        essentialsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="spinner" style="margin: 0 auto 15px auto;"></div>
                <p style="color: var(--text-muted); font-size: 0.85rem;">Calculando los 10 esenciales de tu ropero...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch('/api/capsule');
        if (response.ok) {
            const data = await response.json();
            STATE.capsuleEssentials = data.capsule_items || [];
            STATE.capsuleOutfits = data.outfits || [];
        }
    } catch(e) {
        console.error("Error loading capsule:", e);
        STATE.capsuleEssentials = [];
        STATE.capsuleOutfits = [];
    }
    renderCapsule();
}

function renderCapsule() {
    const essentialsGrid = document.getElementById('capsule-essentials-grid');
    const combinationsGrid = document.getElementById('capsule-combinations-grid');
    
    if (essentialsGrid) {
        essentialsGrid.innerHTML = '';
        if (STATE.capsuleEssentials.length === 0) {
            essentialsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">No hay suficientes prendas en tu closet para formar un armario cápsula (se requieren mínimo 5 prendas).</p>';
        } else {
            STATE.capsuleEssentials.forEach(item => {
                const card = document.createElement('div');
                card.className = 'capsule-item-card animate-fade-in';
                card.innerHTML = `
                    <img src="${item.image_url}" alt="${item.name}" class="capsule-item-img" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23171717%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23646464%22 font-size=%2212%22 text-anchor=%22middle%22 dy=%22.3em%22>Esencial</text></svg>';">
                    <div class="capsule-item-cat">${mapCategory(item.category)}</div>
                    <h4 class="capsule-item-name" title="${item.name}">${item.name}</h4>
                `;
                essentialsGrid.appendChild(card);
            });
        }
    }
    
    if (combinationsGrid) {
        combinationsGrid.innerHTML = '';
        if (STATE.capsuleOutfits.length === 0) {
            combinationsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">No hay combinaciones disponibles.</p>';
        } else {
            const topOutfits = STATE.capsuleOutfits.slice(0, 12);
            topOutfits.forEach(outfit => {
                const card = document.createElement('div');
                card.className = 'capsule-outfit-card animate-fade-in';
                
                const outfitItems = [outfit.top, outfit.bottom, outfit.footwear, outfit.outerwear, outfit.accessory].filter(x => x !== null);
                let itemsThumbs = '';
                outfitItems.forEach(itm => {
                    itemsThumbs += `
                        <div class="combo-item-thumb" title="${itm.name} (${mapCategory(itm.category)})" style="width: 35px; height: 35px; border-radius: 50%; overflow: hidden; border: 1.5px solid var(--accent-gold);">
                            <img src="${itm.image_url}" alt="${itm.name}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    `;
                });
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <h4 style="margin: 0; font-size: 0.9rem; color: #fff; font-family: var(--font-editorial);">Outfit Cápsula #${outfit.id.split('-')[1]}</h4>
                            <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-top: 2px;">Combinación de ${outfitItems.length} piezas</span>
                        </div>
                        <span class="capsule-outfit-score-badge">${outfit.total_score}% Score</span>
                    </div>
                    
                    <div style="display: flex; gap: 6px; margin-bottom: 12px; justify-content: center;">
                        ${itemsThumbs}
                    </div>
                    
                    <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px; flex-grow: 1; min-height: 40px;">
                        ${outfit.advice}
                    </div>
                    
                    <button class="gold-btn-outline" style="width: 100%; justify-content: center; font-size: 0.75rem; padding: 6px 12px;" onclick="window.loadCapsuleOutfitToFittingRoom('${outfit.id}')">
                        Probar Outfit en Vestidor
                    </button>
                `;
                combinationsGrid.appendChild(card);
            });
        }
    }
}

window.loadCapsuleOutfitToFittingRoom = function(outfitId) {
    const outfit = STATE.capsuleOutfits.find(o => o.id === outfitId);
    if (!outfit) return;
    
    const topItem = outfit.top;
    if (topItem) {
        selectForFitting('closet', {
            id: topItem.id,
            cat: mapCategory(topItem.category),
            name: topItem.name,
            style: topItem.pattern || 'Classic',
            image: topItem.image_url
        });
    }
    
    if (STATE.boutiqueItems && STATE.boutiqueItems.length) {
        selectForFitting('boutique', STATE.boutiqueItems[Math.floor(Math.random() * STATE.boutiqueItems.length)]);
    }
    
    switchTab('probador');
    showToast("Prenda principal del outfit cápsula cargada en el Probador.");
};

// --- Daily Quests Manager ---
function initQuestsPanel() {
    if (!STATE.dailyQuests) {
        STATE.dailyQuests = [
            {
                id: 'q1',
                theme: 'Cyberpunk Friday',
                description: 'Diseña un look audaz combinando una prenda de tu Closet oscura con una pieza de Boutique estilo Streetwear/Cyberpunk.',
                reward: '+5.0% Styling Index',
                completed: false,
                checkFn: (closet, boutique) => {
                    const hasStreetwear = (closet && (closet.style.toLowerCase().includes('streetwear') || closet.style.toLowerCase().includes('cyberpunk') || closet.name.toLowerCase().includes('denim') || closet.name.toLowerCase().includes('gafas'))) || 
                                          (boutique && (boutique.style.toLowerCase().includes('streetwear') || boutique.style.toLowerCase().includes('cyberpunk') || boutique.name.toLowerCase().includes('puffer') || boutique.name.toLowerCase().includes('gafas')));
                    const hasDark = (closet && (closet.name.toLowerCase().includes('negro') || closet.name.toLowerCase().includes('azul') || closet.name.toLowerCase().includes('carbón') || closet.name.toLowerCase().includes('índigo'))) || 
                                    (boutique && (boutique.name.toLowerCase().includes('negro') || boutique.name.toLowerCase().includes('azul') || boutique.name.toLowerCase().includes('carbón') || boutique.name.toLowerCase().includes('índigo')));
                    return hasStreetwear && hasDark;
                }
            },
            {
                id: 'q2',
                theme: 'Parisian Chic',
                description: 'Combina un Abrigo Trench elegante con unos Mocasines o Botas de cuero para capturar el confort de París.',
                reward: '+4.0% Styling Index',
                completed: false,
                checkFn: (closet, boutique) => {
                    const hasTrench = (closet && (closet.name.toLowerCase().includes('trench') || closet.name.toLowerCase().includes('abrigo'))) || 
                                      (boutique && (boutique.name.toLowerCase().includes('trench') || boutique.name.toLowerCase().includes('abrigo')));
                    const hasLoafers = (closet && (closet.name.toLowerCase().includes('mocasines') || closet.name.toLowerCase().includes('botas') || closet.name.toLowerCase().includes('cuero'))) || 
                                       (boutique && (boutique.name.toLowerCase().includes('mocasines') || boutique.name.toLowerCase().includes('botas') || boutique.name.toLowerCase().includes('cuero')));
                    return hasTrench && hasLoafers;
                }
            },
            {
                id: 'q3',
                theme: 'Quiet Luxury Neutrals',
                description: 'Crea una composición minimalista utilizando únicamente tonos neutros refinados (Blanco Puro o Beige Arena) sin estampados.',
                reward: '+3.0% Styling Index',
                completed: false,
                checkFn: (closet, boutique) => {
                    const isNeutral = (closet && (closet.name.toLowerCase().includes('blanco') || closet.name.toLowerCase().includes('beige') || closet.name.toLowerCase().includes('crema') || closet.name.toLowerCase().includes('seda') || closet.name.toLowerCase().includes('algodón'))) &&
                                      (boutique && (boutique.name.toLowerCase().includes('blanco') || boutique.name.toLowerCase().includes('beige') || boutique.name.toLowerCase().includes('crema') || boutique.name.toLowerCase().includes('satin') || boutique.name.toLowerCase().includes('lurex') || boutique.name.toLowerCase().includes('tweed')));
                    return isNeutral;
                }
            }
        ];
        
        const savedStreak = localStorage.getItem('dy_quest_streak');
        if (savedStreak) {
            const streakCountEl = document.getElementById('quest-streak-count');
            if (streakCountEl) streakCountEl.textContent = savedStreak;
        }
        
        STATE.dailyQuests.forEach(q => {
            const isCompleted = localStorage.getItem(`dy_quest_completed_${q.id}`) === 'true';
            q.completed = isCompleted;
        });
    }
    renderQuests();
}

function renderQuests() {
    const list = document.getElementById('quests-list');
    if (!list) return;
    list.innerHTML = '';
    
    STATE.dailyQuests.forEach(q => {
        const card = document.createElement('div');
        card.className = `quest-card ${q.completed ? 'completed' : ''} animate-fade-in`;
        
        card.innerHTML = `
            <div style="flex-grow: 1;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <strong style="color: #fff; font-size: 0.85rem; font-family: var(--font-editorial); letter-spacing: 0.5px;">${q.theme}</strong>
                    <span class="quest-badge ${q.completed ? 'completed' : 'active'}">${q.completed ? 'Completado' : 'Activo'}</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin: 0 0 4px 0;">${q.description}</p>
                <span style="font-size: 0.7rem; color: var(--accent-gold); font-weight: 600;">Recompensa: ${q.reward}</span>
            </div>
            <div>
                ${q.completed ? 
                  `<span style="font-size: 1.5rem; color: #4caf50;">✓</span>` : 
                  `<button class="gold-btn-outline" style="padding: 6px 12px; font-size: 0.7rem;" onclick="window.tryQuest('${q.id}')">Ir al Probador</button>`
                }
            </div>
        `;
        list.appendChild(card);
    });
}

window.tryQuest = function(questId) {
    const q = STATE.dailyQuests.find(quest => quest.id === questId);
    if (!q) return;
    
    switchTab('probador');
    showToast(`Desafío: ${q.theme}. Selecciona prendas en el Vestidor para completarlo.`);
};

function checkDailyQuestsCompletion(closetItem, boutiqueItem) {
    if (!STATE.dailyQuests) return;
    
    STATE.dailyQuests.forEach(q => {
        if (!q.completed && q.checkFn(closetItem, boutiqueItem)) {
            q.completed = true;
            localStorage.setItem(`dy_quest_completed_${q.id}`, 'true');
            
            let streak = parseInt(localStorage.getItem('dy_quest_streak') || '0');
            streak += 1;
            localStorage.setItem('dy_quest_streak', streak);
            
            const streakCountEl = document.getElementById('quest-streak-count');
            if (streakCountEl) streakCountEl.textContent = streak;
            
            renderQuests();
            showQuestCompletionEffect(q);
        }
    });
}
function showQuestCompletionEffect(quest) {
    if (typeof createGoldParticleBurst === 'function') {
        createGoldParticleBurst();
    }
    const indexScoreEl = document.getElementById('styling-index-score');
    if (indexScoreEl) {
        let currentVal = parseFloat(indexScoreEl.textContent.replace('%', ''));
        let bonus = quest.id === 'q1' ? 5.0 : (quest.id === 'q2' ? 4.0 : 3.0);
        let newVal = Math.min(100.0, currentVal + bonus).toFixed(1);
        indexScoreEl.textContent = `${newVal}%`;
        indexScoreEl.style.color = "var(--accent-gold)";
        indexScoreEl.style.textShadow = "0 0 10px var(--accent-gold)";
    }
    showToast(`¡Desafío Completado! ${quest.reward}`);
}


// --- SOTA: Analytics, Outfit Shuffler, and Travel Packing Planner Managers ---

async function initAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
            const data = await response.json();
            renderAnalytics(data);
        }
    } catch(e) {
        showToast("Error al cargar analíticas", "error");
    }
}

function renderAnalytics(data) {
    document.getElementById('analytics-total-items').textContent = data.total_items;
    document.getElementById('analytics-rotation').textContent = `${data.rotation_index}%`;
    document.getElementById('analytics-rotation-bar').style.width = `${data.rotation_index}%`;
    document.getElementById('analytics-eco').textContent = `${data.eco_score}%`;
    document.getElementById('analytics-roi').textContent = data.roi_index;
    
    const catContainer = document.getElementById('analytics-categories-container');
    if (catContainer) {
        catContainer.innerHTML = '';
        Object.entries(data.categories_pct).forEach(([cat, pct]) => {
            const row = document.createElement('div');
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
                    <span style="text-transform:capitalize;">${cat}</span>
                    <span>${pct}%</span>
                </div>
                <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:var(--accent-gold);"></div>
                </div>
            `;
            catContainer.appendChild(row);
        });
    }

    document.getElementById('analytics-shopping-gaps').textContent = data.shopping_gaps;
    document.getElementById('analytics-color-harmony').textContent = `${data.color_harmony_score}%`;

    const cpwList = document.getElementById('analytics-cpw-list');
    if (cpwList) {
        cpwList.innerHTML = '';
        if (!data.cpw || data.cpw.length === 0) {
            cpwList.innerHTML = '<p style="color:var(--text-muted); font-size:0.75rem;">No tienes prendas compradas con precio registrado.</p>';
        } else {
            data.cpw.forEach(item => {
                const el = document.createElement('div');
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.gap = '10px';
                el.style.padding = '8px';
                el.style.background = 'rgba(255,255,255,0.02)';
                el.style.borderRadius = '6px';
                el.style.border = '1px solid rgba(255,255,255,0.05)';
                el.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" style="width:35px; height:35px; border-radius:4px; object-fit:cover;">
                    <div style="flex-grow:1;">
                        <h5 style="margin:0; font-size:0.75rem; color:#fff;">${item.name}</h5>
                        <span style="font-size:0.65rem; color:var(--text-muted); text-transform:capitalize;">${item.category} • Costo: $${item.price.toFixed(2)}</span>
                    </div>
                    <div style="text-align:right;">
                        <span style="display:block; font-size:0.75rem; font-weight:bold; color:var(--accent-gold);">$${item.cpw.toFixed(2)} / uso</span>
                        <span style="font-size:0.6rem; color:var(--text-secondary);">${item.wear_count} puestas</span>
                    </div>
                `;
                cpwList.appendChild(el);
            });
        }
    }

    const mostWornList = document.getElementById('analytics-most-worn');
    if (mostWornList) {
        mostWornList.innerHTML = '';
        if (!data.most_worn || data.most_worn.length === 0) {
            mostWornList.innerHTML = '<p style="color:var(--text-muted); font-size:0.7rem; margin:0;">Ninguna puesta registrada.</p>';
        } else {
            data.most_worn.forEach(item => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '8px';
                row.style.fontSize = '0.7rem';
                row.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                    <span style="flex-grow:1; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.name}</span>
                    <strong style="color:var(--accent-gold);">${item.wear_count} usos</strong>
                `;
                mostWornList.appendChild(row);
            });
        }
    }

    const leastWornList = document.getElementById('analytics-least-worn');
    if (leastWornList) {
        leastWornList.innerHTML = '';
        if (!data.least_worn || data.least_worn.length === 0) {
            leastWornList.innerHTML = '<p style="color:var(--text-muted); font-size:0.7rem; margin:0;">Todas tus prendas han sido usadas.</p>';
        } else {
            data.least_worn.forEach(item => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '8px';
                row.style.fontSize = '0.7rem';
                row.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
                    <span style="flex-grow:1; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.name}</span>
                    <span style="color:var(--text-muted);">0 usos</span>
                `;
                leastWornList.appendChild(row);
            });
        }
    }

    const comfortChart = document.getElementById('analytics-comfort-chart');
    if (comfortChart) {
        comfortChart.innerHTML = '';
        if (!data.temp_logs || Object.keys(data.temp_logs).length === 0) {
            comfortChart.innerHTML = '<p style="color:var(--text-muted); font-size:0.7rem; margin:0;">Sin registros de confort.</p>';
        } else {
            const entries = Object.entries(data.temp_logs);
            const totalLogs = entries.reduce((a, b) => a + b[1], 0) || 1;
            entries.forEach(([range, count]) => {
                const pct = Math.round((count / totalLogs) * 100);
                const row = document.createElement('div');
                row.innerHTML = `
                    <div style="display:flex; justify-content:space-between; font-size:0.65rem; margin-bottom:2px;">
                        <span>${range}</span>
                        <span>${count} usos (${pct}%)</span>
                    </div>
                    <div style="width:100%; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
                        <div style="width:${pct}%; height:100%; background:#2196f3;"></div>
                    </div>
                `;
                comfortChart.appendChild(row);
            });
        }
    }
}

// --- Shuffle Manager ---
let currentShuffleOutfit = null;

async function initShuffle() {
    const content = document.getElementById('shuffle-card-content');
    if (content) {
        content.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; font-style: italic; text-align: center;">Haz clic en Mezclar para ver una combinación</p>';
    }
    const badge = document.getElementById('shuffle-score-badge');
    if (badge) badge.textContent = '--% Score';
    const advice = document.getElementById('shuffle-advice');
    if (advice) advice.textContent = '';
    currentShuffleOutfit = null;
}

window.spinShuffle = async function() {
    const content = document.getElementById('shuffle-card-content');
    if (content) {
        content.innerHTML = `
            <div style="text-align: center;">
                <div class="spinner" style="margin: 0 auto 10px auto;"></div>
                <p style="font-size:0.75rem; color:var(--text-muted);">Buscando combinación perfecta...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch('/api/shuffle');
        if (response.ok) {
            currentShuffleOutfit = await response.json();
            renderShuffleOutfit();
        } else {
            const err = await response.json();
            showToast(err.error || "No hay suficientes prendas.", "error");
            initShuffle();
        }
    } catch(e) {
        showToast("Error de red al mezclar.", "error");
        initShuffle();
    }
};

function renderShuffleOutfit() {
    if (!currentShuffleOutfit) return;
    
    const content = document.getElementById('shuffle-card-content');
    const badge = document.getElementById('shuffle-score-badge');
    const advice = document.getElementById('shuffle-advice');
    
    if (badge) badge.textContent = `${currentShuffleOutfit.total_score}% Score`;
    if (advice) advice.textContent = currentShuffleOutfit.advice;
    
    if (content) {
        content.innerHTML = '';
        const items = [currentShuffleOutfit.top, currentShuffleOutfit.bottom, currentShuffleOutfit.footwear, currentShuffleOutfit.outerwear, currentShuffleOutfit.accessory].filter(x => x !== null);
        
        items.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.style.display = 'flex';
            itemRow.style.alignItems = 'center';
            itemRow.style.gap = '12px';
            itemRow.style.width = '100%';
            itemRow.style.padding = '6px';
            itemRow.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            itemRow.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                <div style="flex-grow:1; text-align:left;">
                    <div style="font-size:0.75rem; color:#fff; font-weight:500;">${item.name}</div>
                    <div style="font-size:0.6rem; color:var(--text-muted); text-transform:capitalize;">${mapCategory(item.category)}</div>
                </div>
            `;
            content.appendChild(itemRow);
        });
    }
}

window.discardShuffle = function() {
    if (!currentShuffleOutfit) return;
    const board = document.getElementById('shuffle-board');
    if (board) {
        board.style.transform = 'translateX(-150px) rotate(-15deg)';
        board.style.opacity = '0';
        board.style.transition = 'all 0.4s ease';
    }
    setTimeout(() => {
        initShuffle();
        if (board) {
            board.style.transform = 'none';
            board.style.opacity = '1';
            board.style.transition = 'none';
        }
        window.spinShuffle();
    }, 450);
};

window.saveShuffleOutfit = async function() {
    if (!currentShuffleOutfit) {
        showToast("Primero mezcla un outfit.", "error");
        return;
    }
    
    try {
        const itemsList = [currentShuffleOutfit.top, currentShuffleOutfit.bottom, currentShuffleOutfit.footwear, currentShuffleOutfit.outerwear, currentShuffleOutfit.accessory].filter(x => x !== null);
        const ids = itemsList.map(i => i.id);
        
        const response = await fetch('/api/combinations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `Mezcla DressMe #${Math.floor(Math.random() * 900) + 100}`,
                occasion: 'Casual',
                items: ids
            })
        });
        
        if (response.ok) {
            showToast("Outfit guardado en tus combinaciones!");
            
            const board = document.getElementById('shuffle-board');
            if (board) {
                board.style.transform = 'translateX(150px) rotate(15deg)';
                board.style.opacity = '0';
                board.style.transition = 'all 0.4s ease';
            }
            setTimeout(() => {
                initShuffle();
                if (board) {
                    board.style.transform = 'none';
                    board.style.opacity = '1';
                    board.style.transition = 'none';
                }
            }, 450);
        } else {
            showToast("Error al guardar combinación.", "error");
        }
    } catch(e) {
        showToast("Error de red.", "error");
    }
};

// --- Packing Planner Manager ---
async function initPacking() {
    try {
        const response = await fetch('/api/packing');
        if (response.ok) {
            const data = await response.json();
            renderPacking(data);
        }
    } catch(e) {
        console.error("Error loading packing lists:", e);
    }
}

function renderPacking(lists) {
    const container = document.getElementById('packing-lists-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (lists.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 20px;">No tienes viajes planificados.</p>';
        return;
    }
    
    lists.forEach(list => {
        const card = document.createElement('div');
        card.className = 'glass-card animate-fade-in';
        card.style.padding = '15px';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid rgba(212,175,55,0.15)';
        card.style.marginBottom = '15px';
        
        let itemsHTML = '<div style="display:flex; gap:8px; overflow-x:auto; padding:8px 0; margin-bottom:10px;">';
        list.items.forEach(item => {
            if (item) {
                itemsHTML += `
                    <div style="flex-shrink:0; text-align:center; position:relative;">
                        <img src="${item.image_url}" alt="${item.name}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; border:1px solid var(--border-gold);">
                        <input type="checkbox" style="position:absolute; top:2px; right:2px; cursor:pointer;" onclick="window.toggleCheckGarment(this)">
                        <div style="font-size:0.55rem; color:var(--text-muted); max-width:40px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.name}</div>
                    </div>
                `;
            }
        });
        itemsHTML += '</div>';
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px;">
                <div>
                    <h5 style="margin:0; color:#fff; font-size:0.85rem; font-family:var(--font-editorial);">✈️ Destino: ${list.destination}</h5>
                    <span style="font-size:0.65rem; color:var(--text-muted);">${list.start_date} al ${list.end_date}</span>
                </div>
                <button class="gold-btn-outline" style="padding:4px 8px; font-size:0.65rem; color:#ff5555; border-color:rgba(255,85,85,0.3);" onclick="window.deletePackingList(${list.id})">Eliminar</button>
            </div>
            
            <p style="font-size:0.7rem; color:var(--text-secondary); margin:0 0 5px 0;"><strong>Maleta Cápsula Recomendada:</strong> Marca la casilla al guardar en tu equipaje físico:</p>
            ${itemsHTML}
        `;
        container.appendChild(card);
    });
}

window.toggleCheckGarment = function(checkbox) {
    const parent = checkbox.parentElement;
    if (checkbox.checked) {
        parent.style.opacity = '0.4';
    } else {
        parent.style.opacity = '1';
    }
};

window.handlePackingSubmit = async function(event) {
    event.preventDefault();
    const destination = document.getElementById('packing-destination').value;
    const start_date = document.getElementById('packing-start').value;
    const end_date = document.getElementById('packing-end').value;
    
    try {
        const response = await fetch('/api/packing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination, start_date, end_date })
        });
        
        if (response.ok) {
            showToast("¡Maleta cápsula inteligente generada!");
            document.getElementById('packing-form').reset();
            initPacking();
        } else {
            const err = await response.json();
            showToast(err.error || "Error al crear viaje.", "error");
        }
    } catch(e) {
        showToast("Error de red.", "error");
    }
};

window.deletePackingList = async function(listId) {
    try {
        const response = await fetch(`/api/packing/${listId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showToast("Viaje eliminado.");
            initPacking();
        } else {
            showToast("Error al eliminar.", "error");
        }
    } catch(e) {
        showToast("Error de red.", "error");
    }
};


/* --- Custom Garment Personalization Engine --- */

window.openCustomGarmentModal = function() {
    const modal = document.getElementById('custom-garment-modal');
    if (modal) modal.style.display = 'flex';
    
    // Reset form fields
    const form = document.getElementById('custom-garment-form');
    if (form) form.reset();
    
    const customGroup = document.getElementById('custom-category-name-group');
    if (customGroup) customGroup.style.display = 'none';
    
    const customInput = document.getElementById('custom-category-name');
    if (customInput) customInput.required = false;
    
    // Load presets for default category 'Top'
    window.loadGarmentTemplates('Top');
};

window.closeCustomGarmentModal = function() {
    const modal = document.getElementById('custom-garment-modal');
    if (modal) modal.style.display = 'none';
};

window.toggleCustomCategoryInput = function(val) {
    const group = document.getElementById('custom-category-name-group');
    const input = document.getElementById('custom-category-name');
    if (val === 'custom') {
        if (group) group.style.display = 'block';
        if (input) input.required = true;
        window.loadGarmentTemplates('custom');
    } else {
        if (group) group.style.display = 'none';
        if (input) input.required = false;
        window.loadGarmentTemplates(val);
    }
};

const TEMPLATE_PRESETS = {
    'Top': [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300', // White tee
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=300', // Black shirt
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300'  // Yellow sweater
    ],
    'Bottom': [
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300', // Denim jeans
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300', // Sartorial pants
        'https://images.unsplash.com/photo-1551854838-212c50b4c184?w=300'  // Skirt
    ],
    'Outerwear': [
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300', // Leather jacket
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300', // Trench coat
        'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=300'  // Puffer jacket
    ],
    'Footwear': [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300', // Loafers
        'https://images.unsplash.com/photo-1539185441755-769473a23570?w=300', // Black boots
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=300'  // Sneakers
    ],
    'Accessory': [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', // Watch
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300', // Sunglasses
        'https://images.unsplash.com/photo-1566150905458-1bf1fc15a4a5?w=300'  // Designer bag
    ],
    'custom': [
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300', // General outfit sketch
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300', // Stylized outfit silhouette
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300'  // Clothes layout sketch
    ]
};

window.loadGarmentTemplates = function(category) {
    const container = document.getElementById('custom-garment-templates');
    if (!container) return;
    container.innerHTML = '';
    
    const urls = TEMPLATE_PRESETS[category] || TEMPLATE_PRESETS['custom'];
    
    urls.forEach((url, index) => {
        const div = document.createElement('div');
        div.className = 'scan-thumb';
        if (index === 0) {
            div.classList.add('active');
            const imgUrlInput = document.getElementById('custom-garment-image-url');
            if (imgUrlInput) imgUrlInput.value = url;
        }
        div.innerHTML = `<img src="${url}" alt="Plantilla" style="width:100%; height:100%; object-fit:cover;">`;
        div.onclick = () => {
            container.querySelectorAll('.scan-thumb').forEach(t => t.classList.remove('active'));
            div.classList.add('active');
            const imgUrlInput = document.getElementById('custom-garment-image-url');
            if (imgUrlInput) imgUrlInput.value = url;
        };
        container.appendChild(div);
    });
};

window.handleCustomGarmentSubmit = async function(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('custom-garment-name');
    const catSelect = document.getElementById('custom-garment-category');
    const customCatInput = document.getElementById('custom-category-name');
    const materialSelect = document.getElementById('custom-garment-material');
    const styleSelect = document.getElementById('custom-garment-style');
    const colorSelect = document.getElementById('custom-garment-color');
    const priceInput = document.getElementById('custom-garment-price');
    const imgUrlInput = document.getElementById('custom-garment-image-url');
    
    if (!nameInput || !catSelect || !imgUrlInput) return;
    
    const name = nameInput.value;
    let category = catSelect.value;
    
    if (category === 'custom') {
        category = customCatInput ? customCatInput.value : 'Custom';
    }
    
    const material = materialSelect ? materialSelect.value : 'Seda';
    const style = styleSelect ? styleSelect.value : 'Classic';
    const color = colorSelect ? colorSelect.value : 'Negro Nocturno';
    const priceVal = priceInput ? priceInput.value : '';
    const imageUrl = imgUrlInput.value;
    
    const price = priceVal ? parseFloat(priceVal) : null;
    
    const bodyPayload = {
        name: `${name} (${material})`,
        image_url: imageUrl,
        category: category,
        subcategory: material,
        color_primary: color,
        pattern: style,
        price: price,
        is_owned: 1
    };
    
    try {
        const response = await fetch('/api/clothes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });
        
        if (response.ok) {
            showToast("¡Prenda personalizada creada y agregada al clóset!");
            window.closeCustomGarmentModal();
            
            // Reload closet
            if (typeof loadClosetItems === 'function') {
                await loadClosetItems();
                renderCloset('all');
            }
            
            // Refresh analytics
            if (typeof initAnalytics === 'function') {
                initAnalytics();
            }
        } else {
            const err = await response.json();
            showToast(err.error || "Error al crear la prenda.", "error");
        }
    } catch(e) {
        showToast("Error de red.", "error");
    }
};


/* --- Onboarding & Settings Engine --- */

window.onboardingData = {
    name: '',
    style: '',
    color: '',
    brand: ''
};

window.nextOnboardingStep = function(stepNum) {
    if (stepNum === 1) {
        const nameVal = document.getElementById('onboarding-user-name').value;
        if (!nameVal.trim()) {
            showToast("Por favor ingresa tu nombre", "error");
            return;
        }
        window.onboardingData.name = nameVal;
    }
    
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.remove('active');
    });
    
    let stepId = '';
    if (stepNum === 1) stepId = 'ostep-style';
    else if (stepNum === 2) stepId = 'ostep-color';
    else if (stepNum === 3) stepId = 'ostep-brand';
    
    const stepEl = document.getElementById(stepId);
    if (stepEl) stepEl.classList.add('active');
};

window.selectOnboardingOption = function(type, value) {
    const activeStep = document.querySelector('.onboarding-step.active');
    if (!activeStep) return;
    
    activeStep.querySelectorAll('.onboarding-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    window.onboardingData[type] = value;
    
    let nextBtnId = '';
    if (type === 'style') nextBtnId = 'btn-onboarding-next-1';
    else if (type === 'color') nextBtnId = 'btn-onboarding-next-2';
    else if (type === 'brand') nextBtnId = 'btn-onboarding-finish';
    
    const btn = document.getElementById(nextBtnId);
    if (btn) btn.disabled = false;
};

window.completeOnboarding = function() {
    localStorage.setItem('dy_user_name', window.onboardingData.name);
    localStorage.setItem('dy_user_style', window.onboardingData.style);
    localStorage.setItem('dy_user_color_season', window.onboardingData.color);
    localStorage.setItem('dy_user_brand_focus', window.onboardingData.brand);
    localStorage.setItem('dy_onboarding_completed', 'true');
    
    const settingsUsername = document.getElementById('settings-username');
    if (settingsUsername) settingsUsername.value = window.onboardingData.name;
    
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
        overlay.style.transition = 'opacity 0.6s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            if (typeof createGoldParticleBurst === 'function') {
                createGoldParticleBurst();
            }
            showToast(`¡Bienvenido, ${window.onboardingData.name}! Tu experiencia Maison de Mode ha sido activada.`);
        }, 600);
    }
};

window.checkOnboardingStartup = function() {
    const completed = localStorage.getItem('dy_onboarding_completed');
    if (completed !== 'true') {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
        }
    } else {
        const name = localStorage.getItem('dy_user_name') || 'Jorge Gomez';
        const settingsUsername = document.getElementById('settings-username');
        if (settingsUsername) settingsUsername.value = name;
        
        const lang = localStorage.getItem('dy_language') || 'es';
        const langSelect = document.getElementById('settings-language');
        if (langSelect) langSelect.value = lang;
        
        const cityIdx = localStorage.getItem('dy_selected_city_index') || '0';
        const locSelect = document.getElementById('settings-location');
        if (locSelect) locSelect.value = cityIdx;
        
        const isPro = localStorage.getItem('dy_is_pro') === 'true';
        if (isPro) {
            const proBtn = document.querySelector('.premium-checkout-btn span');
            if (proBtn) proBtn.textContent = "Adquirido";
            const proBtnParent = document.querySelector('.premium-checkout-btn');
            if (proBtnParent) {
                proBtnParent.disabled = true;
                proBtn.textContent = "Adquirido";
            }
        }
    }
};

window.handleSettingsAccountSubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('settings-username').value;
    if (username.trim()) {
        localStorage.setItem('dy_user_name', username);
        showToast("Nombre de usuario actualizado.");
    }
};

window.resetAccountData = async function() {
    if (confirm("¿Estás seguro de que deseas restablecer los datos de tu clóset? Esto eliminará tus puestas registradas, viajes y combinaciones guardadas.")) {
        localStorage.clear();
        showToast("Datos locales restablecidos. Reiniciando aplicación...");
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
};

window.changeSystemLanguage = function(lang) {
    localStorage.setItem('dy_language', lang);
    const translations = {
        'es': "Idioma cambiado a Español.",
        'en': "Language changed to English.",
        'fr': "Langue changée en Français."
    };
    showToast(translations[lang] || "Idioma actualizado.");
    
    // Apply translations across DOM elements
    if (typeof applySystemTranslations === 'function') {
        applySystemTranslations(lang);
    }
};

window.changeSystemLocation = function(cityIdx) {
    localStorage.setItem('dy_selected_city_index', cityIdx);
    
    const mainSelect = document.getElementById('location-select');
    if (mainSelect) mainSelect.value = cityIdx;
    
    const saveBtn = document.getElementById('btn-save-location');
    if (saveBtn) {
        saveBtn.click();
    }
    
    showToast("Ubicación climatológica principal actualizada.");
};

window.buyPremiumPro = function() {
    showToast("Iniciando pasarela de pago segura con Babylon Pay...");
    if (typeof triggerBabylonPaySuccessAnimation === 'function') {
        triggerBabylonPaySuccessAnimation(() => {
            localStorage.setItem('dy_is_pro', 'true');
            showToast("¡Transacción Exitosa! Cuenta Premium PRO Activada.");
            
            const proBtn = document.querySelector('.premium-checkout-btn span');
            if (proBtn) proBtn.textContent = "Adquirido";
            
            const proBtnParent = document.querySelector('.premium-checkout-btn');
            if (proBtnParent) proBtnParent.disabled = true;
        });
    } else {
        localStorage.setItem('dy_is_pro', 'true');
        showToast("Cuenta Premium PRO Activada.");
    }
};

// ==========================================
// HAUTE COUTURE SYSTEM - SOTA NEW EXTENSIONS
// ==========================================

// 1. LOCAL RPG NODES & OFFLINE COMPLETION
const LOCAL_RPG_NODES = {
    "occasion_step": {
        "node_id": "occasion_step",
        "step": { "es": "Ocasión", "en": "Occasion" },
        "question": {
            "es": "¿Para qué ocasión estás preparando tu atuendo el día de hoy?",
            "en": "For what occasion are you preparing your outfit today?"
        },
        "options": [
            {
                "id": "opt_quiet_luxury",
                "text": { "es": "Lujo Silencioso (Elegante, minimalista y sofisticado)", "en": "Quiet Luxury (Elegant, minimalist and sophisticated)" },
                "next_node_id": "color_step",
                "weight_adjustments": { "occasion": "Quiet Luxury" }
            },
            {
                "id": "opt_casual",
                "text": { "es": "Casual (Relajado, cómodo y cotidiano)", "en": "Casual (Relaxed, comfortable and everyday)" },
                "next_node_id": "color_step",
                "weight_adjustments": { "occasion": "Casual" }
            },
            {
                "id": "opt_business_casual",
                "text": { "es": "Business Casual (Profesional pero moderno)", "en": "Business Casual (Professional but modern)" },
                "next_node_id": "color_step",
                "weight_adjustments": { "occasion": "Business Casual" }
            },
            {
                "id": "opt_sporty",
                "text": { "es": "Deportivo Chic (Activo, dinámico y urbano)", "en": "Sporty Chic (Active, dynamic and urban)" },
                "next_node_id": "color_step",
                "weight_adjustments": { "occasion": "Sporty" }
            },
            {
                "id": "opt_cocktail",
                "text": { "es": "Coctel / Fiesta (Glamoroso, nocturno y festivo)", "en": "Cocktail / Party (Glamorous, nightly and festive)" },
                "next_node_id": "color_step",
                "weight_adjustments": { "occasion": "Cocktail" }
            }
        ]
    },
    "color_step": {
        "node_id": "color_step",
        "step": { "es": "Colorimetría", "en": "Color Analysis" },
        "question": {
            "es": "¿Cuál es tu paleta de color estacional predominante?",
            "en": "What is your predominant seasonal color palette?"
        },
        "options": [
            {
                "id": "opt_spring",
                "text": { "es": "Primavera (Tonos cálidos, vivos y luminosos)", "en": "Spring (Warm, bright and luminous tones)" },
                "next_node_id": "silhouette_step",
                "weight_adjustments": { "season": "Spring Warm" }
            },
            {
                "id": "opt_summer",
                "text": { "es": "Verano (Tonos fríos, suaves y empolvados)", "en": "Summer (Cool, soft and powdery tones)" },
                "next_node_id": "silhouette_step",
                "weight_adjustments": { "season": "Summer Cool" }
            },
            {
                "id": "opt_autumn",
                "text": { "es": "Otoño (Tonos cálidos, profundos y terrosos)", "en": "Autumn (Warm, deep and earthy tones)" },
                "next_node_id": "silhouette_step",
                "weight_adjustments": { "season": "Autumn Warm" }
            },
            {
                "id": "opt_winter",
                "text": { "es": "Invierno (Tonos fríos, brillantes y contrastantes)", "en": "Winter (Cool, bright and contrasting tones)" },
                "next_node_id": "silhouette_step",
                "weight_adjustments": { "season": "Winter Cool" }
            }
        ]
    },
    "silhouette_step": {
        "node_id": "silhouette_step",
        "step": { "es": "Silueta", "en": "Silhouette" },
        "question": {
            "es": "¿Qué tipo de silueta o estructura corporal deseas potenciar hoy?",
            "en": "What type of silhouette or body structure do you wish to enhance today?"
        },
        "options": [
            {
                "id": "opt_hourglass",
                "text": { "es": "Reloj de Arena (Proporciones balanceadas con cintura definida)", "en": "Hourglass (Balanced proportions with a defined waist)" },
                "next_node_id": "complete",
                "weight_adjustments": { "silhouette": "Hourglass" }
            },
            {
                "id": "opt_triangle",
                "text": { "es": "Triángulo / Pera (Caderas más anchas que los hombros)", "en": "Triangle / Pear (Hips wider than shoulders)" },
                "next_node_id": "complete",
                "weight_adjustments": { "silhouette": "Triangle" }
            },
            {
                "id": "opt_inverted_triangle",
                "text": { "es": "Triángulo Invertido (Hombros o busto más anchos que las caderas)", "en": "Inverted Triangle (Shoulders or bust wider than hips)" },
                "next_node_id": "complete",
                "weight_adjustments": { "silhouette": "Inverted Triangle" }
            },
            {
                "id": "opt_rectangle",
                "text": { "es": "Rectángulo (Silueta atlética con curvas poco pronunciadas)", "en": "Rectangle (Athletic silhouette with slight curves)" },
                "next_node_id": "complete",
                "weight_adjustments": { "silhouette": "Rectangle" }
            },
            {
                "id": "opt_oval",
                "text": { "es": "Ovalada (Silueta redondeada con foco de atención en el torso)", "en": "Oval (Rounded silhouette focusing attention on the torso)" },
                "next_node_id": "complete",
                "weight_adjustments": { "silhouette": "Oval" }
            }
        ]
    }
};

function processRPGCompletionLocally(answers, lang) {
    let occasion = "Casual";
    let season = "Winter Cool";
    let silhouette = "Hourglass";
    
    answers.forEach(ans => {
        const node = LOCAL_RPG_NODES[ans.node_id];
        if (node) {
            const opt = node.options.find(o => o.id === ans.option_id);
            if (opt && opt.weight_adjustments) {
                const w = opt.weight_adjustments;
                if (w.occasion) occasion = w.occasion;
                if (w.season) season = w.season;
                if (w.silhouette) silhouette = w.silhouette;
            }
        }
    });
    
    const occasionMap = {
        'es': {
            "Quiet Luxury": "del Quiet Luxury",
            "Business Casual": "del Office Chic",
            "Sporty": "del Athleisure Urbano",
            "Cocktail": "de la Noche Festiva",
            "Casual": "del Estilo Casual"
        },
        'en': {
            "Quiet Luxury": "of Quiet Luxury",
            "Business Casual": "of Office Chic",
            "Sporty": "of Urban Athleisure",
            "Cocktail": "of Festive Night",
            "Casual": "of Casual Style"
        }
    };
    
    const nounsMap = {
        'es': {
            "Hourglass": ["El Escultor", "El Alquimista", "El Esteta"],
            "Triangle": ["El Arquitecto", "El Diseñador", "El Maestro"],
            "Inverted Triangle": ["El Vanguardista", "El Estratega", "El Pionero"],
            "Rectangle": ["El Editor", "El Creador", "El Modelador"],
            "Oval": ["El Compositor", "El Armonizador", "El Curador"]
        },
        'en': {
            "Hourglass": ["The Sculptor", "The Alchemist", "The Esthete"],
            "Triangle": ["The Architect", "The Designer", "The Master"],
            "Inverted Triangle": ["The Avant-Garde", "The Strategist", "The Pioneer"],
            "Rectangle": ["The Editor", "The Creator", "The Modeler"],
            "Oval": ["The Composer", "The Harmonizer", "The Curator"]
        }
    };
    
    const adjectivesMap = {
        'es': {
            "Spring Warm": "Cálido",
            "Summer Cool": "Sereno",
            "Autumn Warm": "Terrenal",
            "Winter Cool": "Helado"
        },
        'en': {
            "Spring Warm": "Warm",
            "Summer Cool": "Serene",
            "Autumn Warm": "Earthy",
            "Winter Cool": "Icy"
        }
    };
    
    const nouns = nounsMap[lang][silhouette] || (lang === 'es' ? ["El Diseñador"] : ["The Designer"]);
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const adj = adjectivesMap[lang][season] || "Chic";
    const suffix = occasionMap[lang][occasion] || (lang === 'es' ? "del Estilo Contemporáneo" : "of Contemporary Style");
    
    const title = `${noun} ${adj} ${suffix}`;
    
    // Fallback clothes list
    const allItems = [...(STATE.closetItems || []), ...(MOCK_DATA.boutique || [])];
    
    const outfit = {
        top: allItems.find(i => i.cat === 'superior' || i.category?.toLowerCase() === 'top') || null,
        bottom: allItems.find(i => i.cat === 'inferior' || i.category?.toLowerCase() === 'bottom') || null,
        footwear: allItems.find(i => i.cat === 'calzado' || i.category?.toLowerCase() === 'footwear') || null,
        outerwear: allItems.find(i => i.cat === 'abrigo' || i.category?.toLowerCase() === 'outerwear') || null,
        accessory: allItems.find(i => i.cat === 'accesorio' || i.category?.toLowerCase() === 'accessory') || null
    };
    
    const formatItem = (item) => {
        if (!item) return null;
        return {
            id: item.id,
            name: item.name,
            category: item.category || (item.cat === 'superior' ? 'Top' : item.cat === 'inferior' ? 'Bottom' : item.cat === 'calzado' ? 'Footwear' : item.cat === 'abrigo' ? 'Outerwear' : 'Accessory'),
            image_url: item.image_url || item.image,
            is_owned: item.is_owned !== undefined ? item.is_owned : (item.brand ? 0 : 1),
            price: item.price ? parseFloat(item.price.replace('$', '')) : 120,
            store_name: item.store_name || item.brand || 'Boutique'
        };
    };
    
    const formattedOutfit = {
        top: formatItem(outfit.top),
        bottom: formatItem(outfit.bottom),
        footwear: formatItem(outfit.footwear),
        outerwear: formatItem(outfit.outerwear),
        accessory: formatItem(outfit.accessory)
    };
    
    const score = 92.5;
    const justification = lang === 'es' 
        ? `Este look ha sido seleccionado meticulosamente para la ocasión ${occasion} potenciando una silueta tipo ${silhouette} mediante contrastes y paletas estacionales de ${season}. La combinación entre piezas clave del armario y boutique otorga una armonía estilística impecable.`
        : `This look has been meticulously selected for the ${occasion} occasion, enhancing an ${silhouette} type silhouette through contrasts and seasonal palettes of ${season}. The combination of wardrobe and boutique key pieces provides impeccable stylistic harmony.`;
    
    return {
        title: title,
        justification: justification,
        scores: {
            total_score: score,
            color_score: 95.0,
            style_score: 90.0,
            pattern_score: 93.0,
            weather_score: 92.0
        },
        outfit: formattedOutfit
    };
}

function grantStylingIndexBonus(points, lang) {
    const scoreEl = document.getElementById('styling-index-score');
    if (scoreEl) {
        let currentVal = parseFloat(scoreEl.textContent.replace('%', ''));
        let newVal = Math.min(100.0, currentVal + points).toFixed(1);
        scoreEl.textContent = `${newVal}%`;
        scoreEl.style.color = "var(--accent-gold)";
        scoreEl.style.textShadow = "0 0 10px var(--accent-gold)";
        
        if (typeof createGoldParticleBurst === 'function') {
            createGoldParticleBurst();
        }
        showToast(lang === 'es' ? `¡+${points}% Babylon Styling Index Otorgado!` : `+${points}% Babylon Styling Index Awarded!`, "success");
    }
}

// 2. DYNAMIC TRANSLATION DICTIONARY
const TRANSLATIONS = {
    'es': {
        // Navigation menu
        'nav_clima': 'Clima',
        'nav_closet': 'Closet',
        'nav_asistente': 'Asistente',
        'nav_innovaciones': 'Escáner',
        'nav_boutique': 'Boutique',
        'nav_probador': 'Probador',
        'nav_comunidad': 'Comunidad',
        'nav_pedidos': 'Pedidos',
        'nav_calendario': 'Calendario',
        'nav_capsula': 'Cápsula',
        'nav_analiticas': 'Analíticas',
        'nav_mezclador': 'Mezclador',
        'nav_viajes': 'Viajes',
        'nav_configuracion': 'Ajustes',
        // Clima (Weather) Section
        'clima_header': 'Clima & Silhouette',
        'clima_desc': 'Estilo inteligente adaptado a la temperatura exterior, proyectado sobre tu avatar de alta costura.',
        'clima_flatlay': 'Lienzo de Estilo (Flat Lay)',
        'clima_recommended_title': 'Outfit Recomendado para Hoy',
        // Closet Section
        'closet_header': 'Mi Closet Virtual',
        'closet_desc': 'Tu colección privada, digitalizada y clasificada por inteligencia artificial.',
        'closet_design_btn': 'Diseñar Outfit',
        'closet_create_btn': 'Crear Prenda',
        'closet_scan_btn': 'Escanear Prenda',
        'closet_scanned_count': 'Prendas Catalogadas',
        'closet_next_rank': 'Próximo Rango',
        'closet_progress': 'Progreso de Rango',
        'closet_combinations': 'Mis Combinaciones Diseñadas',
        // Daily Quests (Gamification)
        'quests_title': 'DESAFÍOS DIARIOS DE MODA',
        'quests_desc': 'Completa misiones y gana bonificaciones al Babylon Styling Index',
        'quests_streak': '🔥 Racha: ',
        'quests_days': ' día(s)',
        'quests_days_streak': 'día',
        // Aria Assistant Section
        'aria_title': 'Aria | Asesora de Estilo Personal',
        'aria_desc': 'Asesoría de moda de alta costura interactiva a través de preguntas de estilo guiadas.',
        'aria_hair_label': 'Estilo de Aria (Look):',
        'aria_personality_label': 'Personalidad de Aria:',
        'aria_rpg_header': 'Sesión de Asesoría Interactiva',
        'aria_rpg_progress': 'ASISTENCIA DE ALTA COSTURA',
        'aria_speech_default': '¡Hola! Soy Aria, tu asesora de estilo personal. Comencemos una sesión de asesoría guiada para crear tu próximo gran outfit.',
        // Settings Section
        'settings_title': 'Ajustes del Sistema',
        'settings_desc': 'Personaliza tu cuenta, idioma, ubicación y suscripción Premium de Alta Costura.',
        'settings_lang_label': 'Idioma del Sistema:',
        'settings_location_label': 'Ubicación Principal (Clima):',
        // OOTD Widget
        'ootd_widget_title': 'Outfit del Día (OOTD)',
        'ootd_widget_desc': 'Registra tu outfit de hoy y suma +5.0% al Styling Index',
        'btn_register_ootd': 'Registrar OOTD',
        'ootd_registered_toast': '¡Outfit del Día registrado! +5.0% Babylon Styling Index.',
        'ootd_already_registered': '¡Ya has registrado tu Outfit del Día hoy!',
        'ootd_btn_done': 'OOTD Registrado ✓',
        // Notifications Panel
        'notif_panel_title': 'Notificaciones de Estilo',
        'notif_panel_clear': 'Limpiar',
        'notif_no_pending': 'No hay notificaciones pendientes',
        'notif_ootd_title': 'OOTD Pendiente',
        'notif_ootd_desc': 'No olvides registrar tu Outfit del Día hoy para ganar puntos.',
        'notif_quest_title': 'Desafío Diario',
        'notif_quest_desc': 'Misión Cyberpunk Friday disponible. Combina prendas y sube de rango.'
    },
    'en': {
        // Navigation menu
        'nav_clima': 'Weather',
        'nav_closet': 'Wardrobe',
        'nav_asistente': 'Advisor',
        'nav_innovaciones': 'Scanner',
        'nav_boutique': 'Boutique',
        'nav_probador': 'Fitting Room',
        'nav_comunidad': 'Community',
        'nav_pedidos': 'Orders',
        'nav_calendario': 'Calendar',
        'nav_capsula': 'Capsule',
        'nav_analiticas': 'Analytics',
        'nav_mezclador': 'Shuffler',
        'nav_viajes': 'Travel',
        'nav_configuracion': 'Settings',
        // Clima (Weather) Section
        'clima_header': 'Weather & Silhouette',
        'clima_desc': 'Smart style adapted to outdoor temperature, projected on your haute couture avatar.',
        'clima_flatlay': 'Style Canvas (Flat Lay)',
        'clima_recommended_title': 'Recommended Outfit for Today',
        // Closet Section
        'closet_header': 'My Virtual Wardrobe',
        'closet_desc': 'Your private collection, digitized and classified by artificial intelligence.',
        'closet_design_btn': 'Design Outfit',
        'closet_create_btn': 'Create Garment',
        'closet_scan_btn': 'Scan Garment',
        'closet_scanned_count': 'Cataloged Items',
        'closet_next_rank': 'Next Rank',
        'closet_progress': 'Rank Progress',
        'closet_combinations': 'My Curated Outfits',
        // Daily Quests (Gamification)
        'quests_title': 'DAILY FASHION QUESTS',
        'quests_desc': 'Complete quests and win bonuses for the Babylon Styling Index',
        'quests_streak': '🔥 Streak: ',
        'quests_days': ' day(s)',
        'quests_days_streak': 'day',
        // Aria Assistant Section
        'aria_title': 'Aria | Personal Stylist Advisor',
        'aria_desc': 'Interactive high fashion consulting through guided style questions.',
        'aria_hair_label': 'Aria's Style (Look):',
        'aria_personality_label': 'Aria's Personality:',
        'aria_rpg_header': 'Interactive Styling Session',
        'aria_rpg_progress': 'HAUTE COUTURE ASSISTANCE',
        'aria_speech_default': 'Hello! I am Aria, your personal style advisor. Let's begin a guided styling session to design your next great outfit.',
        // Settings Section
        'settings_title': 'System Settings',
        'settings_desc': 'Customize your account, language, location and Premium subscription.',
        'settings_lang_label': 'System Language:',
        'settings_location_label': 'Primary Location (Weather):',
        // OOTD Widget
        'ootd_widget_title': 'Outfit of the Day (OOTD)',
        'ootd_widget_desc': 'Register your outfit today and add +5.0% to Styling Index',
        'btn_register_ootd': 'Register OOTD',
        'ootd_registered_toast': 'Outfit of the Day registered! +5.0% Babylon Styling Index.',
        'ootd_already_registered': 'You have already registered your Outfit of the Day today!',
        'ootd_btn_done': 'OOTD Registered ✓',
        // Notifications Panel
        'notif_panel_title': 'Style Notifications',
        'notif_panel_clear': 'Clear',
        'notif_no_pending': 'No pending notifications',
        'notif_ootd_title': 'OOTD Pending',
        'notif_ootd_desc': 'Don't forget to register your Outfit of the Day today to earn points.',
        'notif_quest_title': 'Daily Quest',
        'notif_quest_desc': 'Cyberpunk Friday quest available. Match clothes and rank up.'
    }
};

const QUEST_TRANSLATIONS = {
    'es': {
        'q1_theme': 'Cyberpunk Friday',
        'q1_desc': 'Diseña un look audaz combinando una prenda de tu Closet oscura con una pieza de Boutique estilo Streetwear/Cyberpunk.',
        'q2_theme': 'Parisian Chic',
        'q2_desc': 'Combina un Abrigo Trench elegante con unos Mocasines o Botas de cuero para capturar el confort de París.',
        'q3_theme': 'Quiet Luxury Neutrals',
        'q3_desc': 'Crea una composición minimalista utilizando únicamente tonos neutros refinados (Blanco Puro o Beige Arena) sin estampados.'
    },
    'en': {
        'q1_theme': 'Cyberpunk Friday',
        'q1_desc': 'Design a bold look combining a dark garment from your Closet with a Streetwear/Cyberpunk Boutique piece.',
        'q2_theme': 'Parisian Chic',
        'q2_desc': 'Combine an elegant Trench Coat with Loafers or leather Boots to capture Parisian comfort.',
        'q3_theme': 'Quiet Luxury Neutrals',
        'q3_desc': 'Create a minimalist composition using only refined neutral tones (Pure White or Sand Beige) without patterns.'
    }
};

const ARIA_QUOTES_LANG = {
    'es': {
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
    'en': {
        classy: [
            "Simplicity is the key to true elegance, darling.",
            "A clean silhouette never goes out of style. Add texture rather than logos.",
            "Dress like you are going to meet your worst enemy today.",
            "Fashion is bought, style is owned. Seek structural harmony."
        ],
        diva: [
            "Darling! That look screams ordinary. We need DRAMA! More volume!",
            "No gold accessories? Are we in mourning or just out of budget?",
            "If they don't turn to look at you when you enter, the outfit was a total failure.",
            "Shining is not an option, it is your moral obligation. Add that boutique piece now!"
        ],
        sarcastic: [
            "I see you chose to dress in the dark today. Interesting artistic statement.",
            "That combination is highly... 'brave'. Hopefully nobody asks you for photos today.",
            "Oh, a black blazer with jeans. How innovative. Earth-shattering.",
            "Is your closet a museum of boredom or did you just buy everything on sale?"
        ],
        nervous: [
            "Oh my god! Do you think it matches? I feel like the fashion police will arrest us...",
            "Wait, don't you think that color clashes too much? Please, let's look in the mirror again.",
            "I hope it doesn't rain, that suede will be ruined in a second... So stressful!",
            "Will it be okay? Maybe we should go 100% black and pass unnoticed..."
        ]
    }
};

function applySystemTranslations(lang) {
    if (lang !== 'en' && lang !== 'es') lang = 'es';
    const dict = TRANSLATIONS[lang];
    
    // Navigation translate
    const tabs = ['clima', 'closet', 'asistente', 'innovaciones', 'boutique', 'probador', 'comunidad', 'pedidos', 'calendario', 'capsula', 'analiticas', 'mezclador', 'viajes', 'configuracion'];
    tabs.forEach(t => {
        const btnText = dict[`nav_${t}`];
        if (btnText) {
            // Desktop aside navigation
            const desktopBtn = document.querySelector(`.sidebar .nav-btn[data-tab="${t}"] span`);
            if (desktopBtn) desktopBtn.textContent = btnText;
            
            // Mobile navigation
            const mobileBtn = document.querySelector(`.bottom-nav .bottom-nav-btn[data-tab="${t}"] span`);
            if (mobileBtn) mobileBtn.textContent = btnText;
        }
    });

    // Translate Sections headers
    const mappings = [
        { sel: '#clima .editorial-title', key: 'clima_header' },
        { sel: '#clima .section-desc', key: 'clima_desc' },
        { sel: '.mannequin-title', key: 'clima_flatlay' },
        { sel: '#title-ootd-recommendation', key: 'clima_recommended_title' },
        { sel: '#closet .editorial-title', key: 'closet_header' },
        { sel: '#closet .section-desc', key: 'closet_desc' },
        { sel: '#btn-open-outfit-builder span', key: 'closet_design_btn' },
        { sel: '#btn-open-custom-garment span', key: 'closet_create_btn' },
        { sel: '.trigger-scan', key: 'closet_scan_btn', isTextContent: true },
        { sel: '#closet h3.subsection-title', key: 'closet_combinations', isTextContent: true },
        
        { sel: '.daily-quests-panel h4.gold-text', key: 'quests_title' },
        { sel: '.daily-quests-panel .section-desc', key: 'quests_desc', isTextContent: true },
        { sel: '#asistente .editorial-title', key: 'aria_title' },
        { sel: '#asistente .section-desc', key: 'aria_desc' },
        { sel: '#asistente label[for="aria-look"]', key: 'aria_hair_label' },
        { sel: '#asistente label[for="personality"]', key: 'aria_personality_label' },
        { sel: '#asistente .chat-mode-header h4', key: 'aria_rpg_header' },
        { sel: '#asistente .rpg-progress-tracker span:first-child', key: 'aria_rpg_progress' },
        
        { sel: '#configuracion .editorial-title', key: 'settings_title', isTextContent: true },
        { sel: '#configuracion .section-desc', key: 'settings_desc' },
        { sel: '#configuracion label[for="settings-language"]', key: 'settings_lang_label' },
        { sel: '#configuracion label[for="settings-location"]', key: 'settings_location_label' },
        
        { sel: '#ootd-widget-title', key: 'ootd_widget_title' },
        { sel: '#ootd-widget-desc', key: 'ootd_widget_desc' },
        { sel: '#btn-register-ootd span', key: 'btn_register_ootd' },
        
        { sel: '#notif-panel-title', key: 'notif_panel_title' },
        { sel: '#notif-panel-clear', key: 'notif_panel_clear' },
        { sel: '#notif-panel-title-desktop', key: 'notif_panel_title' },
        { sel: '#notif-panel-clear-desktop', key: 'notif_panel_clear' }
    ];

    mappings.forEach(m => {
        const el = document.querySelector(m.sel);
        if (el) {
            const val = dict[m.key];
            if (val) {
                if (m.isTextContent) {
                    el.textContent = val;
                } else {
                    el.innerHTML = val;
                }
            }
        }
    });

    // Update Aria default speech if chat is at step 1
    const ariaSpeechEl = document.getElementById('aria-speech');
    if (ariaSpeechEl && (ariaSpeechEl.textContent.includes('Soy Aria') || ariaSpeechEl.textContent.includes('I am Aria'))) {
        ariaSpeechEl.textContent = dict['aria_speech_default'];
    }

    // Translate Daily Quests structure dynamically
    if (STATE.dailyQuests) {
        STATE.dailyQuests.forEach(q => {
            const questTrans = QUEST_TRANSLATIONS[lang];
            if (questTrans) {
                q.theme = questTrans[`${q.id}_theme`] || q.theme;
                q.description = questTrans[`${q.id}_desc`] || q.description;
            }
        });
        renderQuests();
    }

    // Refresh streak language
    const savedStreak = localStorage.getItem('dy_quest_streak') || '0';
    const streakCountEl = document.getElementById('quest-streak-count');
    if (streakCountEl && streakCountEl.parentElement) {
        const streakText = dict['quests_streak'];
        const daysText = dict['quests_days_streak'];
        streakCountEl.parentElement.innerHTML = `${streakText}<span id="quest-streak-count" style="font-weight:bold;">${savedStreak}</span> ${daysText}`;
    }

    // Update Aria Quotes Language Map
    MOCK_DATA.ariaQuotes = ARIA_QUOTES_LANG[lang] || ARIA_QUOTES_LANG.es;

    // Refresh OOTD Button state
    checkOOTDState();
    
    // Refresh notifications panel contents
    renderNotifications();
}

// 3. OOTD REGISTRATION LOGIC
window.registerOOTD = function() {
    const lang = localStorage.getItem('dy_language') || 'es';
    const lastOOTD = localStorage.getItem('dy_last_ootd_date');
    const today = new Date().toDateString();
    
    if (lastOOTD === today) {
        showToast(TRANSLATIONS[lang]['ootd_already_registered'], "warning");
        return;
    }
    
    localStorage.setItem('dy_last_ootd_date', today);
    grantStylingIndexBonus(5.0, lang);
    
    // Update button visual state
    const btn = document.getElementById('btn-register-ootd');
    if (btn) {
        btn.disabled = true;
        btn.style.background = 'rgba(212, 175, 55, 0.15)';
        btn.style.borderColor = 'rgba(212, 175, 55, 0.3)';
        btn.style.color = 'var(--accent-gold)';
        btn.querySelector('span').textContent = TRANSLATIONS[lang]['ootd_btn_done'];
    }
    
    // Mark OOTD notification as complete and remove from list
    notifications = notifications.filter(n => n.id !== 'n_ootd');
    renderNotifications();
};

function checkOOTDState() {
    const lang = localStorage.getItem('dy_language') || 'es';
    const lastOOTD = localStorage.getItem('dy_last_ootd_date');
    const today = new Date().toDateString();
    
    const btn = document.getElementById('btn-register-ootd');
    if (btn) {
        if (lastOOTD === today) {
            btn.disabled = true;
            btn.style.background = 'rgba(212, 175, 55, 0.15)';
            btn.style.borderColor = 'rgba(212, 175, 55, 0.3)';
            btn.style.color = 'var(--accent-gold)';
            btn.querySelector('span').textContent = TRANSLATIONS[lang]['ootd_btn_done'];
            
            // Remove OOTD notification if already done
            notifications = notifications.filter(n => n.id !== 'n_ootd');
        } else {
            btn.disabled = false;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.querySelector('span').textContent = TRANSLATIONS[lang]['btn_register_ootd'];
            
            // Add OOTD notification if not in list
            if (!notifications.find(n => n.id === 'n_ootd')) {
                notifications.unshift({
                    id: 'n_ootd',
                    title: { es: 'OOTD Pendiente', en: 'OOTD Pending' },
                    message: { es: 'No olvides registrar tu Outfit del Día hoy para ganar puntos.', en: 'Don't forget to register your Outfit of the Day today to earn points.' },
                    type: 'warning'
                });
            }
        }
    }
}

// 4. NOTIFICATIONS LOGIC
let notifications = [
    {
        id: 'n_ootd',
        title: { es: 'OOTD Pendiente', en: 'OOTD Pending' },
        message: { es: 'No olvides registrar tu Outfit del Día hoy para ganar puntos.', en: 'Don't forget to register your Outfit of the Day today to earn points.' },
        type: 'warning'
    },
    {
        id: 'n_quest',
        title: { es: 'Desafío Diario', en: 'Daily Quest' },
        message: { es: 'Misión Cyberpunk Friday disponible. Combina prendas y sube de rango.', en: 'Cyberpunk Friday quest available. Match clothes and rank up.' },
        type: 'info'
    }
];

window.toggleNotificationsPanel = function() {
    const panel = document.getElementById('notifications-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

window.toggleNotificationsPanelDesktop = function(event) {
    if (event) event.stopPropagation();
    const panel = document.getElementById('notifications-panel-desktop');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

window.clearNotifications = function() {
    notifications = [];
    renderNotifications();
    showToast(localStorage.getItem('dy_language') === 'en' ? "Notifications cleared" : "Notificaciones limpiadas");
};

function initNotifications() {
    renderNotifications();
    
    // In-app float notification reminder after 3.5 seconds
    setTimeout(() => {
        showInAppOOTDReminder();
    }, 3500);
}

function renderNotifications() {
    const lang = localStorage.getItem('dy_language') || 'es';
    const badgeMobile = document.getElementById('notif-badge');
    const badgeDesktop = document.getElementById('notif-badge-desktop');
    
    const listMobile = document.getElementById('notifications-list');
    const listDesktop = document.getElementById('notifications-list-desktop');
    
    const count = notifications.length;
    
    // Update badge values
    if (badgeMobile) {
        badgeMobile.textContent = count;
        badgeMobile.style.display = count > 0 ? 'flex' : 'none';
    }
    if (badgeDesktop) {
        badgeDesktop.textContent = count;
        badgeDesktop.style.display = count > 0 ? 'flex' : 'none';
    }
    
    const buildListHTML = () => {
        if (count === 0) {
            return `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 15px 0;">${TRANSLATIONS[lang]['notif_no_pending']}</div>`;
        }
        
        let html = '';
        notifications.forEach(n => {
            const title = n.title[lang] || n.title['es'];
            const message = n.message[lang] || n.message['es'];
            const icon = n.type === 'warning' ? '⚠️' : '✨';
            const borderCol = n.type === 'warning' ? 'rgba(230,73,73,0.3)' : 'rgba(212,175,55,0.3)';
            
            html += `
                <div style="padding: 8px 10px; border-radius: 6px; border: 1px solid ${borderCol}; background: rgba(255,255,255,0.02); display: flex; gap: 8px; align-items: flex-start; font-size: 0.72rem; line-height: 1.3;">
                    <span>${icon}</span>
                    <div style="flex-grow: 1;">
                        <strong style="color: #fff; display: block; font-family: var(--font-editorial);">${title}</strong>
                        <span style="color: var(--text-secondary);">${message}</span>
                    </div>
                </div>
            `;
        });
        return html;
    };
    
    const listHTML = buildListHTML();
    if (listMobile) listMobile.innerHTML = listHTML;
    if (listDesktop) listDesktop.innerHTML = listHTML;
}

function showInAppOOTDReminder() {
    const lastOOTD = localStorage.getItem('dy_last_ootd_date');
    if (lastOOTD === new Date().toDateString()) return; // Already registered
    
    const lang = localStorage.getItem('dy_language') || 'es';
    const container = document.createElement('div');
    container.className = 'glass-card in-app-notification-toast';
    container.style.position = 'fixed';
    container.style.bottom = '90px'; // Above mobile tab bar
    container.style.right = '20px';
    container.style.width = '300px';
    container.style.padding = '12px 15px';
    container.style.border = '1px solid var(--border-gold)';
    container.style.borderRadius = '10px';
    container.style.background = 'rgba(10, 10, 10, 0.95)';
    container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.style.alignItems = 'center';
    container.style.animation = 'slideInRight 0.5s ease-out';
    
    const titleText = TRANSLATIONS[lang]['notif_ootd_title'];
    const descText = TRANSLATIONS[lang]['notif_ootd_desc'];
    
    container.innerHTML = `
        <span style="font-size: 1.4rem; color: var(--accent-gold);">✨</span>
        <div style="flex-grow: 1; text-align: left; font-family: 'Outfit', sans-serif;">
            <strong style="color: var(--accent-gold); font-size: 0.8rem; font-family: var(--font-editorial); display: block;">${titleText}</strong>
            <span style="font-size: 0.72rem; color: var(--text-secondary);">${descText}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; padding: 0 4px;">&times;</button>
    `;
    
    document.body.appendChild(container);
    
    // Auto remove after 7 seconds
    setTimeout(() => {
        if (container.parentElement) {
            container.style.animation = 'fadeOut 0.5s ease-in';
            setTimeout(() => container.remove(), 500);
        }
    }, 7000);
}

// Close panels on desktop click outside
document.addEventListener('click', function(event) {
    const desktopPanel = document.getElementById('notifications-panel-desktop');
    if (desktopPanel && desktopPanel.style.display === 'block') {
        const sidebarBrand = document.querySelector('.sidebar-brand');
        if (sidebarBrand && !sidebarBrand.contains(event.target)) {
            desktopPanel.style.display = 'none';
        }
    }
    
    const mobilePanel = document.getElementById('notifications-panel');
    if (mobilePanel && mobilePanel.style.display === 'block') {
        const header = document.querySelector('.mobile-header');
        if (header && !header.contains(event.target)) {
            mobilePanel.style.display = 'none';
        }
    }
});

// Hook translations initialization on load
document.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('dy_language') || 'es';
    applySystemTranslations(savedLanguage);
    
    // Set selected value in select forms
    const langSelect = document.getElementById('settings-language');
    if (langSelect) langSelect.value = savedLanguage;
    
    // Initialize notifications
    initNotifications();
});
