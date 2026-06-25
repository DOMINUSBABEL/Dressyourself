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
    savedCombinations: []
};

// Look image map for Aria
const ARIA_LOOK_IMAGES = {
    base: 'static/proposals/Propuestas de Asistente Personal/Propuesta (Animada )/Propuesta Animada.png',
    castano_corto: 'static/proposals/Propuestas de Asistente Personal/Propuesta (Animada )/Versiones del personaje/Pelo Castaño Corto.jpeg',
    rojo_corto: 'static/proposals/Propuestas de Asistente Personal/Propuesta (Animada )/Versiones del personaje/Pelo Rojo corto.jpeg',
    rojo_largo: 'static/proposals/Propuestas de Asistente Personal/Propuesta (Animada )/Versiones del personaje/Pelo Rojo largo.jpeg',
    castano_gafas: 'static/proposals/Propuestas de Asistente Personal/Propuesta (Animada )/Versiones del personaje/Pelo castaño medio con gafas.jpeg',
    castano_medio: 'static/proposals/Propuestas de Asistente Personal/Propuesta (Animada )/Versiones del personaje/Pelo castaño medio.jpeg'
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
        { id: 1, user: 'Alessia V.', initials: 'AV', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop', desc: 'Tarde de lino y champaña con un blazer clásico.', votes: { aesthetic: 42, streetwear: 5, minimalist: 24, classic: 53, oversize: 8 }, userVoted: {} },
        { id: 2, user: 'Mateo Garces', initials: 'MG', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600&auto=format&fit=crop', desc: 'Quiet luxury en la ciudad. Paletas crema y botas altas.', votes: { aesthetic: 18, streetwear: 35, minimalist: 62, classic: 41, oversize: 27 }, userVoted: {} },
        { id: 3, user: 'Sophia Atelier', initials: 'SA', img: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=600&auto=format&fit=crop', desc: 'Probando el Vestidor de Aria. Combinación aprobada al 92%.', votes: { aesthetic: 75, streetwear: 12, minimalist: 19, classic: 25, oversize: 33 }, userVoted: {} }
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

// 2. Weather & Daily Recommendations Integration (with interactive mannequin highlights)
async function initWeather() {
    try {
        const response = await fetch('/api/clima');
        if (!response.ok) throw new Error("Fallback to mock");
        const data = await response.json();
        renderWeather(data);
    } catch (e) {
        renderWeather(MOCK_DATA.weather);
        renderRecommendations(MOCK_DATA.climaRecommendation);
    }
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
    recShowcaseEl.innerHTML = '';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'rec-card';
        card.setAttribute('data-part', item.part);
        card.innerHTML = `
            <div class="rec-img-wrapper">
                <span class="rec-badge">${item.badge}</span>
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="rec-details">
                <span class="rec-type">${item.type}</span>
                <h4 class="rec-name">${item.name}</h4>
                <p class="rec-why">"${item.why}"</p>
            </div>
        `;

        card.addEventListener('mouseenter', () => {
            const partId = card.getAttribute('data-part');
            const mannequinPart = document.getElementById(partId);
            if (mannequinPart) {
                mannequinPart.classList.add('highlighted');
            }
        });

        card.addEventListener('mouseleave', () => {
            const partId = card.getAttribute('data-part');
            const mannequinPart = document.getElementById(partId);
            if (mannequinPart) {
                mannequinPart.classList.remove('highlighted');
            }
        });

        recShowcaseEl.appendChild(card);
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

async function loadClosetItems() {
    try {
        const response = await fetch('/api/closet');
        if (!response.ok) throw new Error("Fallback");
        STATE.closetItems = await response.json();
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
                <img src="${item.image}" alt="${item.name}">
                <span class="closet-style-tag">${item.style}</span>
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
        STATE.savedCombinations = await response.json();
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
                        <img src="${itm.image}" alt="${itm.name}">
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
        appendChatMessage('bot', data.response);
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

function appendChatMessage(sender, text) {
    const history = document.getElementById('chat-history');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.textContent = text;
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
}

// 5. Vision Scanner & AI Cataloging (With mandatory 2-second scan delay)
function initScanner() {
    const dropZone = document.getElementById('scanner-drop-zone');
    const fileInput = document.getElementById('scanner-file-input');
    const btnScan = document.getElementById('btn-scan');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewWrapper = document.getElementById('scan-preview-wrapper');
    const previewImg = document.getElementById('scan-preview-img');
    const laser = document.getElementById('scan-laser');
    const resultsBox = document.getElementById('scan-results-box');

    dropZone.addEventListener('click', () => fileInput.click());
    
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
            handleSelectedFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleSelectedFile(e.target.files[0]);
        }
    });

    function handleSelectedFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            previewImg.src = event.target.result;
            uploadPlaceholder.style.display = 'none';
            previewWrapper.style.display = 'flex';
            btnScan.removeAttribute('disabled');
            resultsBox.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    btnScan.addEventListener('click', async () => {
        btnScan.setAttribute('disabled', 'true');
        btnScan.querySelector('.btn-text').textContent = 'Escaneando con Visión IA...';
        btnScan.querySelector('.spinner-small').style.display = 'block';
        laser.classList.add('active');

        const startTime = Date.now();
        const formData = new FormData();
        formData.append('image', fileInput.files[0] || 'mock_file');

        let scanResultData = null;
        try {
            const response = await fetch('/api/closet/scan', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                scanResultData = await response.json();
            }
        } catch (err) {
            console.log("Using local mock scan data.");
        }

        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(2200 - elapsed, 0);

        setTimeout(() => {
            laser.classList.remove('active');
            btnScan.removeAttribute('disabled');
            btnScan.querySelector('.btn-text').textContent = 'Iniciar Escaneo';
            btnScan.querySelector('.spinner-small').style.display = 'none';
            
            showScanResults(scanResultData || MOCK_DATA.scanResults);
        }, remainingDelay);
    });

    document.getElementById('btn-save-scanned').addEventListener('click', () => {
        const newGarment = {
            id: 'c_scanned_' + Date.now(),
            cat: 'superior',
            name: document.getElementById('res-tipo').textContent,
            style: document.getElementById('res-estilo').textContent,
            image: previewImg.src
        };
        STATE.closetItems.unshift(newGarment);
        renderCloset('all');
        alert("Prenda guardada exitosamente en tu Closet.");
        switchTab('closet');
    });
}

function showScanResults(results) {
    const resultsBox = document.getElementById('scan-results-box');
    
    document.getElementById('res-tipo').textContent = results.tipo;
    document.getElementById('res-estilo').textContent = results.estilo;
    document.getElementById('res-confianza').textContent = results.confianza;
    document.getElementById('res-consejo').textContent = results.consejo;
    
    const colorBox = document.getElementById('res-colores');
    colorBox.innerHTML = '';
    results.colores.forEach(hex => {
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
        const response = await fetch('/api/boutique');
        if (!response.ok) throw new Error("Fallback");
        STATE.boutiqueItems = await response.json();
    } catch (e) {
        STATE.boutiqueItems = [...MOCK_DATA.boutique];
    }
    renderBoutique();
}

function renderBoutique() {
    const boutiqueGrid = document.getElementById('boutique-grid');
    boutiqueGrid.innerHTML = '';

    STATE.boutiqueItems.forEach(item => {
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
                <img src="${item.image}" alt="${item.name}">
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
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
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
        <img src="${item.image}" alt="${item.name}">
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

function evaluateFittingMatch() {
    const closetItem = STATE.fittingSlots.closet;
    const boutiqueItem = STATE.fittingSlots.boutique;

    if (!closetItem || !boutiqueItem) return;

    let baseScore = 70;
    if (closetItem.cat !== boutiqueItem.cat) {
        baseScore += 15;
    }
    if (closetItem.style && boutiqueItem.brand) {
        baseScore += Math.floor(Math.random() * 11);
    }
    const score = Math.min(baseScore, 100);

    const scoreBar = document.getElementById('score-bar');
    const scorePct = document.getElementById('score-pct');
    const verdictText = document.getElementById('verdict-text');
    const btnPurchase = document.getElementById('btn-purchase-boutique');
    const verdictBox = document.getElementById('fitting-verdict');

    verdictBox.style.display = 'flex';
    
    setTimeout(() => {
        scoreBar.style.width = `${score}%`;
        scorePct.textContent = `${score}%`;
    }, 100);

    const personalityAdvisories = {
        classy: [
            `Una combinación refinada. El contraste entre ${closetItem.name} y la pieza de ${boutiqueItem.brand} es digno de una editorial parisina.`,
            `Me convence. La caída estructural de ambas piezas conversa en perfecto equilibrio visual.`
        ],
        diva: [
            `¡Uf, espectacular! Eso sí es tener buen ojo. Estás a un par de tacones altos de dominar la semana de la moda.`,
            `Es decente, pero agrégale joyas de oro macizo. De lo contrario, parece que vas a la oficina.`
        ],
        sarcastic: [
            `Al menos no chocan por completo, lo cual ya es una mejora respecto a tu outfit de ayer. Felicidades.`,
            `La pieza de boutique está rescatando tu prenda del closet del abismo del mal gusto. Cómprala para salvarte.`
        ],
        nervous: [
            `Se ve... bien, ¿verdad? Digo, no es demasiado arriesgado. ¡Por favor dime que te sientes cómodo!`
        ]
    };

    const quotesList = personalityAdvisories[STATE.ariaPersonality] || personalityAdvisories.classy;
    verdictText.textContent = `"${quotesList[Math.floor(Math.random() * quotesList.length)]}"`;

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

function renderComunidadFeed() {
    const feedEl = document.getElementById('comunidad-feed');
    if (!feedEl) return;
    feedEl.innerHTML = '';

    MOCK_DATA.posts.forEach((post, index) => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${post.initials}</div>
                <div class="post-user-info">
                    <span class="post-username">${post.user}</span>
                    <span class="post-time">Hace 2 horas</span>
                </div>
            </div>
            <div class="post-image-wrapper">
                <img src="${post.img}" alt="Outfit post">
            </div>
            
            <div class="valuation-bar">
                <button class="tag-vote-btn ${post.userVoted.aesthetic ? 'active' : ''}" data-post-idx="${index}" data-tag="aesthetic">
                    ✨ Aesthetic <span class="vote-count">${post.votes.aesthetic}</span>
                </button>
                <button class="tag-vote-btn ${post.userVoted.streetwear ? 'active' : ''}" data-post-idx="${index}" data-tag="streetwear">
                    🛹 Streetwear <span class="vote-count">${post.votes.streetwear}</span>
                </button>
                <button class="tag-vote-btn ${post.userVoted.minimalist ? 'active' : ''}" data-post-idx="${index}" data-tag="minimalist">
                    🖤 Minimalist <span class="vote-count">${post.votes.minimalist}</span>
                </button>
                <button class="tag-vote-btn ${post.userVoted.classic ? 'active' : ''}" data-post-idx="${index}" data-tag="classic">
                    👔 Classic <span class="vote-count">${post.votes.classic}</span>
                </button>
                <button class="tag-vote-btn ${post.userVoted.oversize ? 'active' : ''}" data-post-idx="${index}" data-tag="oversize">
                    🧥 Oversize <span class="vote-count">${post.votes.oversize}</span>
                </button>
            </div>

            <div class="post-body">
                <p class="post-caption"><strong>@${post.user.toLowerCase().replace(/\s/g, '')}</strong> ${post.desc}</p>
            </div>
        `;

        card.querySelectorAll('.tag-vote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag');
                const postIdx = parseInt(btn.getAttribute('data-post-idx'));
                const postItem = MOCK_DATA.posts[postIdx];

                if (postItem.userVoted[tag]) {
                    postItem.userVoted[tag] = false;
                    postItem.votes[tag]--;
                } else {
                    postItem.userVoted[tag] = true;
                    postItem.votes[tag]++;
                }

                renderComunidadFeed();
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
                <img src="${item.image}" alt="${item.name}">
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
        <img class="preview-thumb" src="${item.image}" alt="${item.name}">
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
