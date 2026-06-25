/**
 * Dress Yourself - Client Interactive Engine
 * Handles asynchronous API connections, state management, vision scanning, 
 * interactive fitting room, Ganchito's personalities, and real-time tracking.
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
    ganchitoPersonality: 'classy',
    currentOrder: {
        id: 'DY-74692',
        status: 'Procesado', // Procesado, Enviado, En Camino, Entregado
        progress: 10, // percentage for the truck
        logs: [
            { time: '14:32', text: 'Orden recibida en Dress Yourself Atelier.' },
            { time: '15:10', text: 'Prendas curadas y preparadas en el empaque de seda.' }
        ]
    },
    trackingInterval: null
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
            why: 'Ideal para resguardarte de la llovizna sin perder el corte estructurado clásico.',
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
            badge: 'Clima Húmedo'
        },
        {
            type: 'Superior',
            name: 'Suéter de Cashmere Off-White',
            why: 'Aislamiento premium de tacto suave para mantener el confort térmico hoy.',
            image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop',
            badge: 'Térmico'
        },
        {
            type: 'Calzado',
            name: 'Botines Chelsea de Cuero Negro',
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
        { id: 'c5', cat: 'superior', name: 'Body Knit Cuello Tortuga', style: 'Minimalist', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=500&auto=format&fit=crop' }
    ],
    boutique: [
        { id: 'b1', cat: 'superior', brand: 'VALENTINO', name: 'Vestido Golden Glow Lurex', price: '$450', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop' },
        { id: 'b2', cat: 'abrigo', brand: 'BALMAIN', name: 'Blazer Lino Sandstone', price: '$290', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500&auto=format&fit=crop' },
        { id: 'b3', cat: 'inferior', brand: 'CHANEL', name: 'Falda Plisada Champagne Satin', price: '$190', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=500&auto=format&fit=crop' },
        { id: 'b4', cat: 'calzado', brand: 'PRADA', name: 'Tacones Velvet Emerald', price: '$340', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500&auto=format&fit=crop' },
        { id: 'b5', cat: 'superior', brand: 'JIL SANDER', name: 'Camisa Oversize Silk Sage', price: '$160', image: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=500&auto=format&fit=crop' }
    ],
    ganchitoQuotes: {
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
    }
};

// Document Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initWeather();
    initCloset();
    initBoutique();
    initGanchito();
    initScanner();
    initFittingRoom();
    initComunidad();
    initTracking();
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
    
    // Update active class on all nav elements (desktop + mobile tabs synced)
    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update visibility of tab content sections
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });

    const activeSection = document.getElementById(tabName);
    if (activeSection) {
        activeSection.classList.add('active');
        // Scroll to top of content area on change
        document.querySelector('.main-content').scrollTop = 0;
    }
    
    // Custom behaviors on tab enter
    if (tabName === 'pedidos') {
        startTrackingSimulation();
    } else {
        stopTrackingSimulation();
    }
}

// 2. Weather & Daily Recommendations Integration
async function initWeather() {
    const cityEl = document.getElementById('weather-city');
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    const detailsEl = document.getElementById('weather-details');
    const recShowcaseEl = document.getElementById('clima-recommendation');

    try {
        const response = await fetch('/api/clima');
        if (!response.ok) throw new Error("Fallback to mock");
        const data = await response.json();
        renderWeather(data);
    } catch (e) {
        // Safe Fallback
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
        recShowcaseEl.appendChild(card);
    });
}

// 3. Virtual Closet Manager
async function initCloset() {
    const closetGrid = document.getElementById('closet-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Load Items
    await loadClosetItems();

    // Setup filter listeners
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
        
        // Mobile tap to try-on
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

// 4. Ganchito Assistant Engine
function initGanchito() {
    const personalitySelector = document.getElementById('personality');
    const hangerSvg = document.getElementById('ganchito-svg');
    const sendBtn = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');

    // Selection changes Ganchito's mode
    personalitySelector.addEventListener('change', (e) => {
        STATE.ganchitoPersonality = e.target.value;
        updateGanchitoAccessories();
        triggerGanchitoSpeech(getRandomQuote());
    });

    // Tap/Click Hanger sways it and triggers quote
    hangerSvg.addEventListener('click', () => {
        // Hanger physical action
        const hangerGroup = document.getElementById('hanger-g');
        hangerGroup.style.transform = "scale(0.9) rotate(15deg)";
        setTimeout(() => {
            hangerGroup.style.transform = "";
        }, 300);

        triggerGanchitoSpeech(getRandomQuote());
    });

    // Chat sending
    sendBtn.addEventListener('click', handleUserMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });
}

function updateGanchitoAccessories() {
    const crown = document.getElementById('hanger-crown');
    const bowtie = document.getElementById('hanger-bowtie');
    
    // Hide all first
    crown.style.display = 'none';
    bowtie.style.display = 'none';

    if (STATE.ganchitoPersonality === 'diva') {
        crown.style.display = 'block';
    } else if (STATE.ganchitoPersonality === 'classy') {
        bowtie.style.display = 'block';
    }
}

function getRandomQuote() {
    const quotes = MOCK_DATA.ganchitoQuotes[STATE.ganchitoPersonality] || MOCK_DATA.ganchitoQuotes.classy;
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function triggerGanchitoSpeech(text) {
    const speechEl = document.getElementById('ganchito-speech');
    speechEl.style.opacity = '0';
    
    // Animate mouth speaking
    const mouth = document.getElementById('hanger-mouth');
    let speakCycles = 6;
    
    const speakInterval = setInterval(() => {
        mouth.setAttribute('d', speakCycles % 2 === 0 ? "M92 105 Q 100 120 108 105" : "M92 108 Q 100 115 108 108");
        speakCycles--;
        if (speakCycles <= 0) {
            clearInterval(speakInterval);
            mouth.setAttribute('d', "M92 108 Q 100 115 108 108");
        }
    }, 150);

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

    // Call API with Ganchito profile
    try {
        const response = await fetch(`/api/ganchito/quote?personality=${STATE.ganchitoPersonality}&q=${encodeURIComponent(text)}`);
        if (!response.ok) throw new Error("Fallback");
        const data = await response.json();
        appendChatMessage('bot', data.response);
        triggerGanchitoSpeech(data.response);
    } catch (e) {
        // Quick rule-based simulated styling advisory
        setTimeout(() => {
            const botReplies = {
                classy: `Interesante pregunta sobre "${text}". Sugiero siluetas estructuradas y paletas tierra. Menos es siempre más, querido.`,
                diva: `¡Ay por favor! Me preguntas por "${text}"... Si no brilla o no cuesta tres salarios mínimos, la respuesta es ¡NO!`,
                sarcastic: `¿En serio me preguntas por "${text}"? Creo que tu closet y mi paciencia están en crisis simultáneas.`,
                nervous: `¡Ay no sé! Sobre "${text}"... ¿estás seguro de que no causará controversias? Yo que tú me pondría un suéter clásico.`
            };
            const reply = botReplies[STATE.ganchitoPersonality] || botReplies.classy;
            appendChatMessage('bot', reply);
            triggerGanchitoSpeech(reply);
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

    // Drag-Drop Events
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

    // Trigger Scan (Guarantees at least 2 seconds laser scan visual feedback)
    btnScan.addEventListener('click', async () => {
        btnScan.setAttribute('disabled', 'true');
        btnScan.querySelector('.btn-text').textContent = 'Escaneando con Visión IA...';
        btnScan.querySelector('.spinner-small').style.display = 'block';
        laser.classList.add('active');

        const startTime = Date.now();

        // Prepare image upload payload (Fetch API setup)
        const formData = new FormData();
        formData.append('image', fileInput.files[0] || 'mock_file');

        let scanResultData = null;
        try {
            // Hit real API endpoint
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

        // Enforce the 2 seconds laser layout presentation
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(2200 - elapsed, 0);

        setTimeout(() => {
            laser.classList.remove('active');
            btnScan.removeAttribute('disabled');
            btnScan.querySelector('.btn-text').textContent = 'Iniciar Escaneo';
            btnScan.querySelector('.spinner-small').style.display = 'none';
            
            // Present Results
            showScanResults(scanResultData || MOCK_DATA.scanResults);
        }, remainingDelay);
    });

    // Save Scanned Garment to Closet
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
    
    // Color Swatches render
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
        
        // Touch/Click to add directly to fitting room
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

    // Left Panel tabs toggles source list
    sourceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sourceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderFittingSource(tab.getAttribute('data-source'));
        });
    });

    // Drag Over rules for slots
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

    // Try calculating cross styling matching rules
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

    // Simulate compatibility score calculation
    let baseScore = 70;
    if (closetItem.cat !== boutiqueItem.cat) {
        baseScore += 15; // Mixed matching (top + bottom, or outerwear + top)
    }
    if (closetItem.style && boutiqueItem.brand) {
        baseScore += Math.floor(Math.random() * 11); // Add stylistic variance
    }
    const score = Math.min(baseScore, 100);

    const scoreBar = document.getElementById('score-bar');
    const scorePct = document.getElementById('score-pct');
    const verdictText = document.getElementById('verdict-text');
    const btnPurchase = document.getElementById('btn-purchase-boutique');
    const verdictBox = document.getElementById('fitting-verdict');

    verdictBox.style.display = 'flex';
    
    // Smooth progress bar update
    setTimeout(() => {
        scoreBar.style.width = `${score}%`;
        scorePct.textContent = `${score}%`;
    }, 100);

    // Ganchito speaks on the combo
    const personalityAdvisories = {
        classy: [
            `Una combinación refinada. El contraste entre ${closetItem.name} y la pieza ${boutiqueItem.brand} es digno de una editorial parisina.`,
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

    const quotesList = personalityAdvisories[STATE.ganchitoPersonality] || personalityAdvisories.classy;
    verdictText.textContent = `"${quotesList[Math.floor(Math.random() * quotesList.length)]}"`;

    // Buy Action hookup
    btnPurchase.style.display = 'block';
    btnPurchase.onclick = () => {
        triggerCheckout(boutiqueItem);
    };
}

function triggerCheckout(boutiqueItem) {
    const confirmBuy = confirm(`¿Deseas comprar "${boutiqueItem.name}" por ${boutiqueItem.price}?`);
    if (!confirmBuy) return;

    // Simulate order placement
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

// 8. Editorial Social Community Feed
function initComunidad() {
    const feedEl = document.getElementById('comunidad-feed');
    feedEl.innerHTML = '';

    const posts = [
        { user: 'Alessia V.', initials: 'AV', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop', likes: 142, desc: 'Tarde de lino y champaña con un blazer clásico.' },
        { user: 'Mateo Garces', initials: 'MG', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600&auto=format&fit=crop', likes: 89, desc: 'Quiet luxury en la ciudad. Paletas crema y botas altas.' },
        { user: 'Sophia Atelier', initials: 'SA', img: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=600&auto=format&fit=crop', likes: 215, desc: 'Probando el Vestidor de Ganchito. Combinación aprobada al 92%.' }
    ];

    posts.forEach(post => {
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
            <div class="post-actions">
                <button class="post-action-btn like-btn">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
                    <span class="like-count">${post.likes}</span>
                </button>
            </div>
            <div class="post-body">
                <p class="post-caption"><strong>@${post.user.toLowerCase().replace(/\s/g, '')}</strong> ${post.desc}</p>
            </div>
        `;
        
        // Handle post likes
        const likeBtn = card.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => {
            const countSpan = likeBtn.querySelector('.like-count');
            let count = parseInt(countSpan.textContent);
            if (likeBtn.classList.contains('liked')) {
                likeBtn.classList.remove('liked');
                likeBtn.style.color = '';
                countSpan.textContent = count - 1;
            } else {
                likeBtn.classList.add('liked');
                likeBtn.style.color = '#e25c5c';
                countSpan.textContent = count + 1;
            }
        });

        feedEl.appendChild(card);
    });
}

// 9. Real-Time Order Tracking Logic (Fetch Polling & Simulations)
function initTracking() {
    const refreshBtn = document.getElementById('btn-refresh-tracking');
    refreshBtn.addEventListener('click', () => {
        fetchOrderStatus(true);
    });

    fetchOrderStatus(false);
}

async function fetchOrderStatus(isManual) {
    try {
        const response = await fetch('/api/pedido/status');
        if (!response.ok) throw new Error("Fallback to client logic");
        const data = await response.json();
        updateTrackingUI(data);
    } catch (e) {
        // Run Client Fallback Update
        updateTrackingUI(STATE.currentOrder);
    }
}

function updateTrackingUI(order) {
    document.getElementById('track-order-id').textContent = order.id;
    
    const progressBar = document.getElementById('track-progress-bar');
    const truckIcon = document.getElementById('truck-icon');
    
    progressBar.style.width = `${order.progress}%`;
    truckIcon.style.left = `${order.progress}%`;

    // Toggle Node Activeness
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

    // Render event logs
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

// Active simulation for demonstration/prototype when tab is active
function startTrackingSimulation() {
    if (STATE.trackingInterval) return;

    STATE.trackingInterval = setInterval(() => {
        const statuses = ['Procesado', 'Enviado', 'En Camino', 'Entregado'];
        let currentIdx = statuses.indexOf(STATE.currentOrder.status);

        if (currentIdx < statuses.length - 1) {
            currentIdx++;
            STATE.currentOrder.status = statuses[currentIdx];
            
            // Set truck progress coordinates
            const progressSteps = [10, 38, 68, 100];
            STATE.currentOrder.progress = progressSteps[currentIdx];
            
            // Add event log log
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
            // Reached delivered, stop checking
            stopTrackingSimulation();
        }
    }, 8000); // Advances stage every 8 seconds when active in testing
}

function stopTrackingSimulation() {
    if (STATE.trackingInterval) {
        clearInterval(STATE.trackingInterval);
        STATE.trackingInterval = null;
    }
}
