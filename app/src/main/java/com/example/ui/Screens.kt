package com.example.ui

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import com.example.data.ClotheItem
import com.example.data.SavedOutfit
import com.example.data.TrackingOrder
import kotlinx.coroutines.launch
import androidx.compose.ui.draw.alpha
import androidx.compose.foundation.lazy.rememberLazyListState

// Primary styling definitions for fashion-focused colors
val FashionPrimary = Color(0xFF6750A4) // Bento brand purple
val FashionSecondary = Color(0xFFD0BCFF) // Bento accent purple
val SoftBackground = Color(0xFFEADDFF) // Bento highlight tint (#EADDFF)
val DarkPanelGold = Color(0xFFF59E0B) // Bento orange/gold warning
val OwnedGreen = Color(0xFF16A34A) // Bento vibrant green

/**
 * Ganchito3DCanvas: A simulated Three.js WebGL canvas utilizing Jetpack Compose.
 * Implements GPU-accelerated graphic transformations (Y-axis orbit rotation, X-axis pitch,
 * dynamic metal linear shading brushes, concentric 3D perspective wireframes, and particle vectors)
 * without triggering parent recompositions, ensuring maximum runtime execution efficiency.
 */
@Composable
fun Ganchito3DCanvas(
    expression: String,
    isDressed: Boolean,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "ganchito_3d")

    // Continuous simulated camera orbit Y-axis (Three.js OrbitControls feel)
    val orbitY by infiniteTransition.animateFloat(
        initialValue = -18f,
        targetValue = 18f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "orbit_y"
    )

    // Camera pitch X-axis
    val orbitX by infiniteTransition.animateFloat(
        initialValue = -8f,
        targetValue = 10f,
        animationSpec = infiniteRepeatable(
            animation = tween(3100, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "orbit_x"
    )

    // Float/Hover breathing movement
    val floatY by infiniteTransition.animateFloat(
        initialValue = -5f,
        targetValue = 5f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = EaseInOutQuad),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_y"
    )

    // Constant spinning angle for the backdrop interactive geometry grid vertices
    val wireframeRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(15000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wireframe_spin"
    )

    // REMEMBER PATHS outside the draw loop to avoid object creation at 60fps!
    val hookPath = remember { Path() }
    val mainframePath = remember { Path() }
    val mainframeShadowPath = remember { Path() }

    Box(
        modifier = modifier
            .graphicsLayer {
                // Apply hardware-accelerated 3D perspective projection
                cameraDistance = 10f * density
                rotationY = orbitY
                rotationX = orbitX
                translationY = floatY
            },
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val cx = w / 2
            val cy = h / 2

            // Draw concentric 3D perspective wireframe depth rings
            val ringCount = 3
            for (i in 1..ringCount) {
                drawCircle(
                    color = FashionPrimary.copy(alpha = 0.04f * (4 - i)),
                    radius = (cx * 0.35f) * i,
                    center = center,
                    style = Stroke(width = 2f)
                )
            }

            // Draw spinning Starfield / particle grid vertices reminiscent of WebGL buffer geometries
            rotate(wireframeRotation, pivot = center) {
                val nodes = 8
                for (j in 0 until nodes) {
                    val angle = (j * (2 * Math.PI / nodes)).toFloat()
                    val nodeX = cx + (cx * 0.65f) * kotlin.math.cos(angle)
                    val nodeY = cy + (cy * 0.65f) * kotlin.math.sin(angle)
                    
                    // Draw node vertex point
                    drawCircle(
                        color = FashionSecondary.copy(alpha = 0.4f),
                        radius = 4f,
                        center = androidx.compose.ui.geometry.Offset(nodeX, nodeY)
                    )
                    
                    // Draw constellation vector connection line
                    drawLine(
                        color = FashionPrimary.copy(alpha = 0.08f),
                        start = center,
                        end = androidx.compose.ui.geometry.Offset(nodeX, nodeY),
                        strokeWidth = 1.5f
                    )
                }
            }

            // Create linear brushed silver gradient representing 3D volumetric tubular steel
            val steelBrush = Brush.linearGradient(
                colors = listOf(
                    Color(0xFFE2E8F0), // Volumetric highlight top
                    Color(0xFFCBD5E1), // Shaded highlight mid
                    Color(0xFF64748B), // Steel shadow baseline
                    Color(0xFF475569)  // Deep metallic shadow
                ),
                start = androidx.compose.ui.geometry.Offset(cx - 24f, cy - 36f),
                end = androidx.compose.ui.geometry.Offset(cx + 24f, cy + 6f)
            )

            // 1. Draw 3D curved Hanger neck Hook
            hookPath.rewind()
            hookPath.moveTo(cx, cy - 10f)
            hookPath.lineTo(cx, cy - 28f)
            hookPath.cubicTo(
                cx, cy - 44f,
                cx - 14f, cy - 44f,
                cx - 14f, cy - 34f
            )
            hookPath.cubicTo(
                cx - 14f, cy - 28f,
                cx - 8f, cy - 24f,
                cx - 4f, cy - 24f
            )
            
            drawPath(
                path = hookPath,
                brush = steelBrush,
                style = Stroke(width = 5.5f, cap = StrokeCap.Round)
            )

            // 2. Draw 3D Triangular Main Frame
            mainframeShadowPath.rewind()
            mainframeShadowPath.moveTo(cx - 38f, cy + 10f)
            mainframeShadowPath.lineTo(cx + 38f, cy + 10f)
            mainframeShadowPath.lineTo(cx, cy - 10f)
            mainframeShadowPath.close()
            
            drawPath(
                path = mainframeShadowPath,
                color = Color.Black.copy(alpha = 0.08f),
                style = Stroke(width = 8f)
            )

            mainframePath.rewind()
            mainframePath.moveTo(cx - 36f, cy + 8f)
            mainframePath.lineTo(cx + 36f, cy + 8f)
            mainframePath.lineTo(cx, cy - 10f)
            mainframePath.close()
            
            drawPath(
                path = mainframePath,
                brush = steelBrush,
                style = Stroke(width = 5.5f, cap = StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round)
            )

            // Shading highlight reflection on vector structure
            val shinyBrush = Brush.verticalGradient(
                colors = listOf(Color.White.copy(alpha = 0.65f), Color.Transparent)
            )
            drawPath(
                path = mainframePath,
                brush = shinyBrush,
                style = Stroke(width = 1.5f)
            )
        }

        // Centered interactive avatar glass card displaying Ganchito's high-fidelity expressions
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.offset(y = 12.dp)
        ) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.88f))
                    .border(1.2.dp, FashionPrimary.copy(alpha = 0.25f), CircleShape)
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = when (expression) {
                        "happy" -> if (isDressed) "🥰" else "😸"
                        "dizzy" -> "🤪"
                        "wink" -> "😎"
                        else -> "🧐"
                    },
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
            }
        }
    }
}

/**
 * Web browser wrapper to visit famous clothing sites inside the app (e.g., Zara, H&M, Mango)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FamousBrandBrowser(
    url: String,
    title: String,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isLoading by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = url,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Cerrar tienda")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(3.dp)
                )
            )
        },
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
        ) {
            AndroidView(
                factory = { context ->
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        webViewClient = object : WebViewClient() {
                            override fun onPageFinished(view: WebView?, url: String?) {
                                isLoading = false
                            }
                        }
                        loadUrl(url)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.White.copy(alpha = 0.8f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = FashionPrimary)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Conectando en tiempo real con ${title}...",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

/**
 * SCREEN 1: Daily Weather & Outfit Suggester (Recomendación Diaria)
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WeatherOutfitView(
    viewModel: WardrobeViewModel,
    ownedClothes: List<ClotheItem>,
    shopClothes: List<ClotheItem>,
    onNavigateToStore: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val weather by viewModel.currentWeather.collectAsState(initial = viewModel.cities[0])
    val cityIndex by viewModel.selectedCityIndex.collectAsState(initial = 0)
    val selectedOccasion by viewModel.selectedOccasion.collectAsState(initial = "Casual")

    var showCitySelector by remember { mutableStateOf(false) }
    var userOutfitNameInput by remember { mutableStateOf("") }
    var isSavingOutfitAndPendingAnimation by remember { mutableStateOf(false) }

    // Ganchito retro assistant states
    var isGanchitoDressed by remember { mutableStateOf(false) }
    var selectedPersonality by remember { mutableStateOf("Clásico") } // Clásico, Sarcástico, Diva, Nervioso
    var forceHangerExpression by remember { mutableStateOf("normal") } // normal, happy, dizzy, wink

    // Quotes for Ganchito based on state, weather, and occasion
    val ganchitoQuotes = remember(weather, selectedOccasion, selectedPersonality, ownedClothes) {
        val weatherAdvice = when (weather.condition) {
            "Lluvia" -> "¡Cuidado con el agua! Mis finos hilos de alambre podrían oxidarse si nos mojamos."
            "Tormenta" -> "¡Rayos y centellas! Mejor quédate en cama o usa un impermeable grueso."
            "Nublado" -> "Gris como la pantalla de inicio de Windows 95. Un look alegre vendría genial."
            "Soleado" -> "¡Excelente día para lucir destellante! El sol brilla como un CD-ROM nuevo."
            else -> "Buen clima para simular un gran desfile de modas."
        }
        
        when (selectedPersonality) {
            "Sarcástico" -> listOf(
                "¿Un look '$selectedOccasion'? Muy atrevido... espero que tu tarjeta gráfica Windows 95 banque tantos píxeles.",
                "¡Bip! He visto disquetes de 3.5'' con mejor gusto estético, ¡pero hoy te ves genial!",
                "¿Me vas a vestir hoy con la ropa sugerida o simplemente me vas a dejar colgado?",
                "¿Esa combinación? Interesante... En mis tiempos, combinar eso te daba un reinicio espontáneo.",
                "¡Bip, click! Vaya, por fin alguien que saca provecho a un procesador de estilo analógico."
            ).random()
            "Diva" -> listOf(
                "¡Osea, divino total! Siento que brillamos más que un salvapantallas de laberinto 3D original.",
                "Esa prenda superior realza mi curvatura de acero templado. ¡Amo completamente!",
                "¡Cariño, con este outfit el feed colapsará los servidores de Netscape Navigator!",
                "Sujétame con cuidado, soy de alta costura retro y mi gancho superior tiene tratamiento de oro.",
                "La vida es demasiado corta para usar ropa aburrida. ¡Déjame modelar tu look ya mismo!"
            ).random()
            "Nervioso" -> listOf(
                "¿Seguro que no hay humedad exterior? El óxido es el peor enemigo de mi familia Hanger...",
                "¡Ay! No me estires muy fuerte al ponerme los Tops, mi alambre es flexible pero sensible.",
                "Espero que no se congele la app... ¡No quiero que mi sistema operativo lance una pantalla azul!",
                "Tengo pánico de que el viento de hoy vuele este conjunto virtual. ¿Está bien asegurado?",
                "¿La geolocalización es segura? ¡No quiero que un virus troyano moje mi colección!"
            ).random()
            else -> listOf( // Clásico
                "¡Hola! Soy Ganchito, tu asistente de estilo vintage. $weatherAdvice",
                "Veo que estás planeando salir para: '$selectedOccasion'. ¡Permíteme ponerme el look recomendado!",
                "Dato curioso: Fui modelado con el mejor metal reciclado de los racks de Microsoft Office 97.",
                "¡Qué combinación tan elegante! Pincha en 'Vestir a Ganchito' para modelarla en mí.",
                "¿Sabías que un buen calzado ahorra memoria virtual? ¡Es ciencia de la moda!"
            ).random()
        }
    }

    var currentGanchitoQuote by remember { mutableStateOf("") }
    LaunchedEffect(ganchitoQuotes) {
        currentGanchitoQuote = ganchitoQuotes
    }

    // Logic: Coordinate 1 complete outfit based on current weather temp and rain Suitability
    val outfitSuggestion = remember(weather, ownedClothes, shopClothes, selectedOccasion) {
        val occasionStyles = when (selectedOccasion) {
            "Formal" -> listOf("Formal", "Elegante")
            "Deportivo" -> listOf("Deportivo", "Casual")
            "Fiesta" -> listOf("Fiesta", "Elegante")
            else -> listOf("Casual", "Deportivo")
        }

        // Filters matching weather temperatures
        fun filterSuited(item: ClotheItem): Boolean {
            val isTempOk = weather.tempCelsius >= item.minTemp && weather.tempCelsius <= item.maxTemp
            val isRainOk = if (weather.condition == "Lluvia") item.rainFriendly else true
            return isTempOk && isRainOk
        }

        // Try getting owned items first, fallback to shop clothes (pretending they are on the rack for visual coordinator preview)
        fun findItem(cat: String): ClotheItem? {
            val ownedCat = ownedClothes.filter { it.category == cat && filterSuited(it) }
            val matchedStyleOwned = ownedCat.firstOrNull { it.style in occasionStyles }
            if (matchedStyleOwned != null) return matchedStyleOwned
            if (ownedCat.isNotEmpty()) return ownedCat.first()

            // Shop fallback
            val shopCat = shopClothes.filter { it.category == cat && filterSuited(it) }
            val matchedStyleShop = shopCat.firstOrNull { it.style in occasionStyles }
            if (matchedStyleShop != null) return matchedStyleShop
            return shopCat.firstOrNull()
        }

        val top = findItem("Top")
        val bottom = findItem("Bottom")
        val outer = if (weather.tempCelsius < 16.0 || weather.condition == "Lluvia" || weather.condition == "Nieve") {
            findItem("Outerwear")
        } else null
        val footwear = findItem("Footwear")
        val accessory = findItem("Accessory")

        if (top != null && bottom != null && footwear != null) {
            CoordinateOutfit(top, bottom, outer, footwear, accessory)
        } else {
            null
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // BENTO STYLE GREETING HEADER (Mirrors the Bento mockup)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Hoy es un día espectacular ✨",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = "Hola, Diseñadora 👋",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                // Subtle temperature badge
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    modifier = Modifier.border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "${weather.tempCelsius}°C",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Box(
                            modifier = Modifier
                                .size(16.dp)
                                .clip(CircleShape)
                                .background(FashionPrimary)
                        )
                    }
                }
            }
        }

        // WEATHER HERO SECTION CARD
        item {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(
                    containerColor = SoftBackground
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), RoundedCornerShape(28.dp))
                    .testTag("weather_section_card")
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Asistente del Clima",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.SemiBold
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "${weather.city}, ${weather.country}",
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                IconButton(
                                    onClick = { showCitySelector = true },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.EditLocation,
                                        contentDescription = "Cambiar ubicación",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }

                        // Giant Animated/Stunning Weather Icon
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = weather.icon,
                                fontSize = 48.sp,
                                modifier = Modifier.animateContentSize()
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "${weather.tempCelsius}°C",
                                style = MaterialTheme.typography.displayMedium,
                                fontWeight = FontWeight.Black,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Text(
                                text = "Predisposición: ${weather.condition}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Column(
                            horizontalAlignment = Alignment.End,
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = "💨 Viento: ${weather.windSpeedKmh} km/h",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                            )
                            Text(
                                text = "💧 Humedad: ${weather.humidityPercent}%",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Geolocalización GPS activa. Sugiriendo combinación idónea para el clima.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f),
                        textAlign = TextAlign.Start
                    )
                }
            }
        }

        // OCASSION SELECTOR PILLS
        item {
            Column {
                Text(
                    text = "Selecciona la Ocasión del Día",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val occasions = listOf("Casual", "Formal", "Deportivo", "Fiesta")
                    occasions.forEach { occasion ->
                        val isSelected = selectedOccasion == occasion
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.setOccasion(occasion) },
                            label = { Text(occasion) },
                            leadingIcon = if (isSelected) {
                                { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp)) }
                            } else null,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = FashionPrimary,
                                selectedLabelColor = Color.White,
                                selectedLeadingIconColor = Color.White
                            ),
                            modifier = Modifier.testTag("occasion_chip_$occasion")
                        )
                    }
                }
            }
        }

        // GANCHITO RETRO ASSISTANT SECTION
        item {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFC0C0C0)), // Win95 Original Gray
                modifier = Modifier
                    .fillMaxWidth()
                    .border(2.dp, Color.White, RoundedCornerShape(28.dp))
                    .testTag("ganchito_retro_advisor")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Windows 95 Title Bar styled as Bento grid header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF000080)) // Classic Navy Blue title bar
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("👗", fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Ganchito_Asesor.exe (v1.95) - On-Device",
                                color = Color.White,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        
                        // Mini Windows 95 window buttons
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(18.dp)
                                    .background(Color(0xFFC0C0C0))
                                    .border(1.dp, Color.White)
                                    .clickable {
                                        forceHangerExpression = "wink"
                                        currentGanchitoQuote = "¡Mímica minimizada! Sigo vigilando tus costuras en segundo plano."
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text("_", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            }
                            Box(
                                modifier = Modifier
                                    .size(18.dp)
                                    .background(Color(0xFFC0C0C0))
                                    .border(1.dp, Color.White)
                                    .clickable {
                                        forceHangerExpression = "happy"
                                        isGanchitoDressed = !isGanchitoDressed
                                        currentGanchitoQuote = if (isGanchitoDressed) "¡Ejecutando DRESSUP.EXE! El look me calza divino." else "¡Cerrando probador! De regreso a mi estado de percha natural."
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text("🗖", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Main interactive content: Left Hanger visual representation, Right speech bubble!
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        // Left Column: Ganchito the interactive Hanger
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .width(120.dp)
                                .clickable {
                                    // Change facial expression and set funny sounds / new quotes
                                    val expressions = listOf("happy", "dizzy", "wink", "normal")
                                    forceHangerExpression = expressions.random()
                                    currentGanchitoQuote = ganchitoQuotes
                                    // Visual effect feedback
                                    viewModel.sendNotification("💡 Toque en Ganchito", "Ganchito dice: ¡Eso da cosquillas metálicas!")
                                }
                        ) {
                            // Ganchito Graphic Container
                            Box(
                                modifier = Modifier
                                    .size(110.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color.White)
                                    .border(1.dp, Color.LightGray, RoundedCornerShape(16.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                if (isGanchitoDressed && outfitSuggestion != null) {
                                    // Layer simulated 3D Ganchito in background, and dress clothing layers on top
                                    Box(modifier = Modifier.fillMaxSize()) {
                                        Ganchito3DCanvas(
                                            expression = forceHangerExpression,
                                            isDressed = true,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                        
                                        // Dressed garments floating layout
                                        Column(
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.Center,
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .padding(top = 16.dp)
                                        ) {
                                            // Modern top overlay
                                            Box(
                                                modifier = Modifier.size(46.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                AsyncImage(
                                                    model = outfitSuggestion.top.imageUri,
                                                    contentDescription = outfitSuggestion.top.name,
                                                    modifier = Modifier
                                                        .fillMaxSize()
                                                        .clip(RoundedCornerShape(8.dp))
                                                        .border(1.dp, Color.White, RoundedCornerShape(8.dp))
                                                )
                                                
                                                if (outfitSuggestion.outerwear != null) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(24.dp)
                                                            .align(Alignment.BottomEnd)
                                                            .background(Color.White.copy(alpha = 0.95f))
                                                            .border(1.dp, FashionPrimary, RoundedCornerShape(4.dp))
                                                    ) {
                                                        AsyncImage(
                                                            model = outfitSuggestion.outerwear.imageUri,
                                                            contentDescription = outfitSuggestion.outerwear.name,
                                                            modifier = Modifier.fillMaxSize()
                                                        )
                                                    }
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(2.dp))

                                            // Modern bottom overlay dangling
                                            AsyncImage(
                                                model = outfitSuggestion.bottom.imageUri,
                                                contentDescription = outfitSuggestion.bottom.name,
                                                modifier = Modifier
                                                    .size(26.dp)
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .border(1.dp, Color.White, RoundedCornerShape(6.dp))
                                            )
                                        }
                                    }
                                } else {
                                    // Pure Ganchito 3D Orbit representation
                                    Ganchito3DCanvas(
                                        expression = forceHangerExpression,
                                        isDressed = false,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            // Interactive Button: "Ponerse Outfit"
                            Button(
                                onClick = {
                                    if (outfitSuggestion == null) {
                                        currentGanchitoQuote = "No puedo vestir nada si no hay ropa recomendada para esta ocasión en tu ubicación de ${weather.city}."
                                        forceHangerExpression = "dizzy"
                                    } else {
                                        isGanchitoDressed = !isGanchitoDressed
                                        forceHangerExpression = if (isGanchitoDressed) "happy" else "normal"
                                        currentGanchitoQuote = if (isGanchitoDressed) {
                                            "¡Wow! Colgué la ropa perfectamente en mis hombros. ¿Cómo se ve?"
                                        } else {
                                            "Me la quité. ¡Lista para que te la pruebes tú!"
                                        }
                                    }
                                    viewModel.sendNotification("Probador retro", "Ganchito se ha probado/quitado la ropa de hoy.")
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isGanchitoDressed) Color.Red else FashionPrimary
                                ),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text(
                                    text = if (isGanchitoDressed) "Quitar ropa" else "Vestir Gancho",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color.White
                                )
                            }
                        }

                        // Right Column: Office Help Bubble & Personality Chips
                        Column(modifier = Modifier.weight(1f)) {
                            // Clippy style post-it speech bubble
                            Card(
                                shape = RoundedCornerShape(bottomStart = 0.dp, bottomEnd = 12.dp, topStart = 12.dp, topEnd = 12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFFE1)), // Windows Yellow ToolTip yellow color
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, Color(0xFF808000), RoundedCornerShape(bottomStart = 0.dp, bottomEnd = 12.dp, topStart = 12.dp, topEnd = 12.dp))
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = currentGanchitoQuote.ifEmpty { "¡Hola! Selecciona un look y me lo probaré con gusto." },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color.Black,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text(
                                text = "Personalidad de Ganchito:",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color.Black
                            )

                            // Quick personality toggle bar
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val personalities = listOf("Clásico", "Sarcástico", "Diva", "Nervioso")
                                personalities.forEach { persona ->
                                    val isSelected = selectedPersonality == persona
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSelected) FashionPrimary else Color(0xFFDCDCDC))
                                            .border(1.dp, Color.Gray, RoundedCornerShape(6.dp))
                                            .clickable {
                                                selectedPersonality = persona
                                                forceHangerExpression = when (persona) {
                                                    "Sarcástico" -> "wink"
                                                    "Diva" -> "happy"
                                                    "Nervioso" -> "dizzy"
                                                    else -> "normal"
                                                }
                                            }
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = persona,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (isSelected) Color.White else Color.Black,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // OUTFIT SUGGESTION SECTION
        item {
            Column {
                Text(
                    text = "Outfit Coordinado Sugerido",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                if (outfitSuggestion == null) {
                    Card(
                        shape = RoundedCornerShape(28.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp)
                            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(28.dp)),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.secondary
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                "No posees prendas suficientes registradas para sugerir un outfit completo para esta ocasión. Visita el armario para importar algunas con nuestra Inteligencia/ML de Visión de Dispositivo.",
                                style = MaterialTheme.typography.bodyMedium,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                } else {
                    OutlinedCard(
                        shape = RoundedCornerShape(28.dp),
                        colors = CardDefaults.outlinedCardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.outline),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("outfit_card_suggestion")
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            // Sub Header displaying contents of coordinates
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(FashionSecondary)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "COORDINACIÓN SMART STYLE",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = FashionSecondary
                                    )
                                }
                                Text(
                                    text = "$selectedOccasion / ${weather.city}",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // List garments coordinates row / flex layout
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                maxItemsInEachRow = 3
                            ) {
                                FashionItemCardMini(outfitSuggestion.top, "Prenda Superior")
                                FashionItemCardMini(outfitSuggestion.bottom, "Prenda Inferior")
                                if (outfitSuggestion.outerwear != null) {
                                    FashionItemCardMini(outfitSuggestion.outerwear, "Abrigo / Capa")
                                }
                                FashionItemCardMini(outfitSuggestion.footwear, "Calzado")
                                if (outfitSuggestion.accessory != null) {
                                    FashionItemCardMini(outfitSuggestion.accessory, "Accesorio")
                                }
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            // Outfits Save & Share tools
                            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                "Nombra este conjunto para guardarlo en favoritos:",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextField(
                                    value = userOutfitNameInput,
                                    onValueChange = { userOutfitNameInput = it },
                                    placeholder = { Text("Ej. Mi look chic, Moda Bogotá...") },
                                    colors = TextFieldDefaults.colors(
                                        focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                                        focusedIndicatorColor = FashionPrimary
                                    ),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(52.dp),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Button(
                                    onClick = {
                                        viewModel.saveCustomOutfit(
                                            name = userOutfitNameInput,
                                            top = outfitSuggestion.top,
                                            bottom = outfitSuggestion.bottom,
                                            outer = outfitSuggestion.outerwear,
                                            shoes = outfitSuggestion.footwear,
                                            accessory = outfitSuggestion.accessory,
                                            occasion = selectedOccasion
                                        )
                                        userOutfitNameInput = ""
                                        isSavingOutfitAndPendingAnimation = true
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = FashionPrimary),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .height(52.dp)
                                        .testTag("btn_save_outfit_suggestion")
                                ) {
                                    Icon(imageVector = Icons.Default.Favorite, contentDescription = null)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Guardar", fontWeight = FontWeight.SemiBold)
                                }
                            }

                            // Share to Social Button
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedButton(
                                onClick = {
                                    // Save then directly share to Feed
                                    viewModel.saveCustomOutfit(
                                        name = if(userOutfitNameInput.isNotEmpty()) userOutfitNameInput else "Look $selectedOccasion",
                                        top = outfitSuggestion.top,
                                        bottom = outfitSuggestion.bottom,
                                        outer = outfitSuggestion.outerwear,
                                        shoes = outfitSuggestion.footwear,
                                        accessory = outfitSuggestion.accessory,
                                        occasion = selectedOccasion
                                    )
                                    // Simulated delay and then notifying the community feed
                                    viewModel.sendNotification("Outfit Compartido en Comunidad", "¡Look guardado y exportado al feed público!")
                                },
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, FashionSecondary.copy(alpha = 0.6f)),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = FashionSecondary),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Guardar y Publicar en Red Social de Outfits", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // DAILY TIPS ADVICE BLOCK
        item {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), RoundedCornerShape(28.dp))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "💡", fontSize = 28.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Tip de Moda de hoy:",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            text = if (weather.tempCelsius < 15) {
                                "En días fríos, la técnica de capas (capa base + chaqueta de abrigo) le da volumen y estilo a tu ropa."
                            } else {
                                "Los colores claros contrastan perfecto con el sol directo. ¡Prueba combinar blanco con tonos tierra!"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }
        }
    }

    // CITY SELECTOR DIALOG
    if (showCitySelector) {
        AlertDialog(
            onDismissRequest = { showCitySelector = false },
            title = { Text("Simular Geolocalización GPS", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        "Selecciona una región alternativa para geolocalizar el clima en tiempo real y sugerir la vestimenta perfecta:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.height(240.dp)
                    ) {
                        itemsIndexed(viewModel.cities) { index, info ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (cityIndex == index) MaterialTheme.colorScheme.primaryContainer
                                        else Color.Transparent
                                    )
                                    .clickable {
                                        viewModel.setCityIndex(index)
                                        showCitySelector = false
                                    }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(info.icon, fontSize = 20.sp, modifier = Modifier.padding(end = 8.dp))
                                    Column {
                                        Text(info.city, fontWeight = FontWeight.Bold)
                                        Text(info.country, style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                                Text("${info.tempCelsius}°C", fontWeight = FontWeight.Bold, color = FashionPrimary)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showCitySelector = false }) {
                    Text("Cerrar")
                }
            }
        )
    }
}

// Coordinate helper class
data class CoordinateOutfit(
    val top: ClotheItem,
    val bottom: ClotheItem,
    val outerwear: ClotheItem?,
    val footwear: ClotheItem,
    val accessory: ClotheItem?
)

@Composable
fun FashionItemCardMini(item: ClotheItem, layerLabel: String) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .width(105.dp)
            .padding(vertical = 4.dp)
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), RoundedCornerShape(18.dp))
    ) {
        Column(modifier = Modifier.padding(6.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(85.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.LightGray)
            ) {
                AsyncImage(
                    model = item.imageUri,
                    contentDescription = item.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                
                // Owned/Unpurchased Tag visual
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(4.dp)
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(if (item.isPurchased) OwnedGreen else DarkPanelGold)
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = layerLabel,
                style = MaterialTheme.typography.labelSmall,
                color = FashionPrimary,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = item.name,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = if (item.isPurchased) "Disponible" else "Tienda: ${item.storeName}",
                style = MaterialTheme.typography.bodySmall,
                color = if (item.isPurchased) OwnedGreen else DarkPanelGold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}


/**
 * SCREEN 2: Armario (Cabinet / Wardrobe Management with Mobile Vision analyzer)
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WardrobeView(
    viewModel: WardrobeViewModel,
    ownedClothes: List<ClotheItem>,
    modifier: Modifier = Modifier
) {
    var selectedCategoryFilter by remember { mutableStateOf("Todos") }
    var selectedStyleFilter by remember { mutableStateOf("Todos") }
    var isAddingPrenda by remember { mutableStateOf(false) }

    // Forms and scanning simulation state
    val scanningState by viewModel.visionScanning.collectAsState()
    val visionResult by viewModel.visionResult.collectAsState()

    var customClotheNameInput by remember { mutableStateOf("") }
    var selectedSizeInput by remember { mutableStateOf("M") }
    var selectedStyleInput by remember { mutableStateOf("Casual") }
    var customImageSelectedUri by remember { mutableStateOf("") }
    var customImageLabelSelected by remember { mutableStateOf("") }

    val filteredClothes = ownedClothes.filter { clothe ->
        val matchCat = selectedCategoryFilter == "Todos" || clothe.category == selectedCategoryFilter
        val matchStyle = selectedStyleFilter == "Todos" || clothe.style == selectedStyleFilter
        matchCat && matchStyle
    }

    Scaffold(
        floatingActionButton = {
            if (!isAddingPrenda) {
                ExtendedFloatingActionButton(
                    onClick = {
                        isAddingPrenda = true
                        customClotheNameInput = ""
                        selectedSizeInput = "M"
                        selectedStyleInput = "Casual"
                        customImageSelectedUri = viewModel.predefinedImportImages[0].second
                        customImageLabelSelected = viewModel.predefinedImportImages[0].first
                    },
                    icon = { Icon(Icons.Default.AddAPhoto, contentDescription = "Importar Prenda") },
                    text = { Text("Escanear Prenda", fontWeight = FontWeight.Bold) },
                    containerColor = FashionPrimary,
                    contentColor = Color.White,
                    modifier = Modifier.testTag("btn_open_scan_prenda_dialog")
                )
            }
        },
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            if (isAddingPrenda) {
                // INTERACTIVE VISION ML UPLOADING VIEW
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Escaner de Visión de Ropa",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Black,
                            color = FashionPrimary
                        )
                        IconButton(onClick = { isAddingPrenda = false; viewModel.cancelAnalysis() }) {
                            Icon(Icons.Default.Close, contentDescription = "Cancelar")
                        }
                    }

                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                "El algoritmo de machine learning en dispositivo procesará el contorno textil, texturas e histogramas de color en tiempo real para clasificar la categoría y el rango climático sin nube.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }

                    // Predefined slide camera photos mock selecting
                    Text(
                        "Paso 1: Elige una foto para tu prenda (Simula cámara/galería):",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        viewModel.predefinedImportImages.forEach { item ->
                            val isSelected = customImageSelectedUri == item.second
                            Card(
                                modifier = Modifier
                                    .width(130.dp)
                                    .clickable {
                                        customImageSelectedUri = item.second
                                        customImageLabelSelected = item.first
                                        viewModel.cancelAnalysis()
                                    },
                                border = if (isSelected) BorderStroke(3.dp, FashionPrimary) else null,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Box {
                                    AsyncImage(
                                        model = item.second,
                                        contentDescription = item.first,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.size(130.dp)
                                    )
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .align(Alignment.BottomCenter)
                                            .background(Color.Black.copy(alpha = 0.6f))
                                            .padding(4.dp)
                                    ) {
                                        Text(
                                            item.first,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color.White,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Action buttons standard processing
                    Spacer(modifier = Modifier.height(8.dp))

                    if (visionResult == null && !scanningState) {
                        Button(
                            onClick = {
                                viewModel.runOnDeviceVisionAnalysis(customImageSelectedUri, customImageLabelSelected)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = FashionPrimary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("btn_run_vision_ml")
                        ) {
                            Icon(Icons.Default.Search, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Escanear y Analizar con ML On-Device", fontWeight = FontWeight.Bold)
                        }
                    }

                    // Scanner scanning status spinner animation
                    if (scanningState) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                CircularProgressIndicator(color = FashionSecondary)
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    "Analizando silueta de prenda...",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    "Modelos cargados: [SegmenterHSV, TextureDescriptorPattern, StyleRegressor]",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }

                    // Vision analysis results visual
                    visionResult?.let { result ->
                        Card(
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(2.dp, OwnedGreen),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxWidth().testTag("vision_result_panel")
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "Resultado del Análisis Visión ML",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Black,
                                        color = OwnedGreen
                                    )
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("${result.confidencePercent}% de Precisión", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = OwnedGreen)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Icon(Icons.Default.Verified, contentDescription = null, tint = OwnedGreen, modifier = Modifier.size(18.dp))
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Grid values details
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Categoría identificada:", fontWeight = FontWeight.Medium)
                                        Text(result.category, fontWeight = FontWeight.Bold, color = FashionPrimary)
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Subtipo de prenda:", fontWeight = FontWeight.Medium)
                                        Text(result.subcategory, fontWeight = FontWeight.Bold)
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Color Principal:", fontWeight = FontWeight.Medium)
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(
                                                modifier = Modifier
                                                    .size(16.dp)
                                                    .clip(CircleShape)
                                                    .background(Color(android.graphics.Color.parseColor(result.detectedColorHex)))
                                                    .border(1.dp, Color.Gray, CircleShape)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(result.detectedColorName, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Estampado Textil:", fontWeight = FontWeight.Medium)
                                        Text(result.textilePattern, fontWeight = FontWeight.Bold)
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Clima y Rango Óptimo:", fontWeight = FontWeight.Medium)
                                        Text(result.comfortTempText, fontWeight = FontWeight.Bold, color = FashionSecondary)
                                    }
                                }

                                Spacer(modifier = Modifier.height(20.dp))

                                // Customizing manual fields
                                Text("Paso 2: Completa detalles de la prenda:", fontWeight = FontWeight.Bold)

                                Spacer(modifier = Modifier.height(8.dp))

                                Text("Asignar un nombre personalizado:", style = MaterialTheme.typography.bodySmall)
                                TextField(
                                    value = customClotheNameInput,
                                    onValueChange = { customClotheNameInput = it },
                                    placeholder = { Text("Ej. Mi polera preferida, Vestido Azul") },
                                    colors = TextFieldDefaults.colors(focusedIndicatorColor = FashionPrimary),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp)
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    // Size picker column
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Siez / Talla:", style = MaterialTheme.typography.bodySmall)
                                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            listOf("S", "M", "L", "XL").forEach { talla ->
                                                val sel = selectedSizeInput == talla
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .clip(RoundedCornerShape(6.dp))
                                                        .background(if (sel) FashionPrimary else Color.LightGray.copy(alpha = 0.4f))
                                                        .clickable { selectedSizeInput = talla },
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text(talla, color = if (sel) Color.White else Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                                }
                                            }
                                        }
                                    }

                                    // Style selection
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Estilo sugerido:", style = MaterialTheme.typography.bodySmall)
                                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            listOf("Casual", "Formal", "Deportivo", "Fiesta").forEach { est ->
                                                val sel = selectedStyleInput == est
                                                Box(
                                                    modifier = Modifier
                                                        .padding(vertical = 2.dp)
                                                        .clip(RoundedCornerShape(6.dp))
                                                        .background(if (sel) FashionSecondary else Color.LightGray.copy(alpha = 0.4f))
                                                        .clickable { selectedStyleInput = est }
                                                        .padding(horizontal = 8.dp, vertical = 6.dp),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text(est, color = if (sel) Color.White else Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                                }
                                            }
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(24.dp))

                                // CONFIRM EXPORT ACTION BUTTONS
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    OutlinedButton(
                                        onClick = { viewModel.cancelAnalysis() },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("Re-escanear")
                                    }

                                    Button(
                                        onClick = {
                                            viewModel.saveAnalyzedClotheToWardrobe(
                                                name = customClotheNameInput,
                                                size = selectedSizeInput,
                                                style = selectedStyleInput,
                                                result = result,
                                                imageUri = customImageSelectedUri
                                            )
                                            isAddingPrenda = false
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = OwnedGreen),
                                        modifier = Modifier.weight(1f).testTag("btn_save_analysis_wardrobe"),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("Guardar Prenda", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))
                }
            } else {
                // NORMAL ARCHITECTURE VIEW - GRID OF CLOTHES
                Text(
                    "Mi Armario Inteligente",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Black,
                    color = FashionPrimary,
                    modifier = Modifier.padding(top = 16.dp)
                )

                Text(
                    "Gestiona tu colección nacional de ropa y visualiza prendas disponibles.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // FILTERS CHIPS PANEL
                Text("Filtrar por Categoría:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val categories = listOf("Todos", "Top", "Bottom", "Outerwear", "Footwear", "Accessory")
                    categories.forEach { cat ->
                        FilterChip(
                            selected = selectedCategoryFilter == cat,
                            onClick = { selectedCategoryFilter = cat },
                            label = { Text(cat) }
                        )
                    }
                }

                Text("Filtrar por Estilo:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val styles = listOf("Todos", "Casual", "Formal", "Deportivo", "Elegante", "Fiesta")
                    styles.forEach { style ->
                        FilterChip(
                            selected = selectedStyleFilter == style,
                            onClick = { selectedStyleFilter = style },
                            label = { Text(style) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                if (filteredClothes.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.HourglassEmpty, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                "Ninguna prenda coincide con tus filtros.",
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color.Gray
                            )
                        }
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .testTag("wardrobe_clothes_grid")
                    ) {
                        items(filteredClothes) { item ->
                            ClotheItemCard(
                                item = item,
                                onDelete = { viewModel.deleteClothe(item) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ClotheItemCard(item: ClotheItem, onDelete: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("clothe_item_${item.id}")
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                    .background(Color.LightGray)
            ) {
                AsyncImage(
                    model = item.imageUri,
                    contentDescription = item.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Category Tag Badge
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color.Black.copy(alpha = 0.7f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(item.category, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }

                    // Delete button
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier
                            .size(28.dp)
                            .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Eliminar de armario",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Talla: ${item.size}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = item.style,
                        style = MaterialTheme.typography.bodySmall,
                        color = FashionSecondary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Color circular badge display
                Row(
                    modifier = Modifier.padding(top = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(Color(android.graphics.Color.parseColor(item.color)))
                            .border(0.5.dp, Color.Gray, CircleShape)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = item.colorName,
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}


/**
 * SCREEN 3: Perchero & Boutique (Shop Clothes Explorer combined with owned items integration coordination)
 */
@Composable
fun StoreView(
    viewModel: WardrobeViewModel,
    ownedClothes: List<ClotheItem>,
    shopClothes: List<ClotheItem>,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var coordinatePreviewItem by remember { mutableStateOf<ClotheItem?>(null) }
    var selectedStoreUrlToVisit by remember { mutableStateOf<String?>(null) }
    var selectedStoreTitleToVisit by remember { mutableStateOf<String?>(null) }

    val filteredShopItems = shopClothes.filter { item ->
        searchQuery.isEmpty() || item.name.contains(searchQuery, ignoreCase = true) || item.storeName.contains(searchQuery, ignoreCase = true)
    }

    // Coordinates Preview logic: Match with one user garment of opposite type
    val coordinatedUserItem = remember(coordinatePreviewItem, ownedClothes) {
        val storeItem = coordinatePreviewItem ?: return@remember null
        val oppositeCategory = when (storeItem.category) {
            "Top" -> "Bottom"
            "Bottom" -> "Top"
            "Outerwear" -> "Top"
            "Footwear" -> "Bottom"
            else -> "Top"
        }
        ownedClothes.firstOrNull { it.category == oppositeCategory }
    }

    // Firebase states for VTO and Regional Stores
    val vtoResultUrl by viewModel.vtoResultUrl.collectAsState()
    val isVtoLoading by viewModel.isVtoLoading.collectAsState()
    val regionalStores by viewModel.regionalStores.collectAsState()
    val isStoresLoading by viewModel.isStoresLoading.collectAsState()
    var selectedCountryCode by remember { mutableStateOf("CO") }

    Scaffold(
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Text(
                "Perchero y Boutique Real",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = FashionPrimary,
                modifier = Modifier.padding(top = 16.dp)
            )

            Text(
                "Los artículos de boutique incorporan etiqueta informativa 'Aún no comprada'. Pruébalos combinados con tu ropa antes de comprar o visita sus webs globales.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // REGIONAL STORES GEOLOCATION INJECTOR
            Text(
                "Buscar Tiendas de Moda en tu Región:",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("CO" to "🇨🇴 CO", "ES" to "🇪🇸 ES", "US" to "🇺🇸 US").forEach { (code, label) ->
                        FilterChip(
                            selected = selectedCountryCode == code,
                            onClick = { selectedCountryCode = code },
                            label = { Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        )
                    }
                }

                Button(
                    onClick = { viewModel.loadRegionalStores(selectedCountryCode) },
                    colors = ButtonDefaults.buttonColors(containerColor = FashionPrimary),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Cargar Tiendas", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            if (isStoresLoading) {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = FashionPrimary)
                }
            } else if (regionalStores.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            "Boutiques locales encontradas:",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Black,
                            color = FashionPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            regionalStores.forEach { store ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.clickable {
                                        selectedStoreUrlToVisit = store.website
                                        selectedStoreTitleToVisit = store.brand
                                    }
                                ) {
                                    Column(modifier = Modifier.padding(8.dp)) {
                                        Text(store.brand, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = FashionPrimary)
                                        Text(store.category, style = MaterialTheme.typography.bodySmall, fontSize = 10.sp, color = Color.Gray)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // WEB FAMOUS BRANDS LINKS ROW
            Text(
                "Visitar Tiendas Famosas Internacionales:",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val famousStores = listOf(
                    Triple("Zara", "https://www.zara.com", "🇪🇸"),
                    Triple("H&M", "https://www2.hm.com", "🇸🇪"),
                    Triple("Mango", "https://shop.mango.com", "🇪🇸"),
                    Triple("Pull&Bear", "https://www.pullandbear.com", "🇪🇸"),
                    Triple("Decathlon", "https://www.decathlon.com", "🇫🇷")
                )
                famousStores.forEach { store ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(3.dp)),
                        modifier = Modifier
                            .clickable {
                                selectedStoreUrlToVisit = store.second
                                selectedStoreTitleToVisit = store.first
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(store.third, fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(store.first, fontWeight = FontWeight.Black, fontSize = 12.sp)
                        }
                    }
                }
            }

            // SEARCH BAR
            TextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Buscar artículo de marca o tienda...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                colors = TextFieldDefaults.colors(focusedIndicatorColor = FashionPrimary),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp)
                    .testTag("shop_search_field"),
                shape = RoundedCornerShape(12.dp)
            )

            // ACTIVE COUPLING COORDINATION MOCK DISPLAY
            animatedOutfitCombinationPanel(
                storeItem = coordinatePreviewItem,
                userItem = coordinatedUserItem,
                onDismiss = { coordinatePreviewItem = null },
                onBuyDirect = { item ->
                    viewModel.purchaseStoreItem(item)
                    coordinatePreviewItem = null
                },
                onTryOnVirtually = { item ->
                    viewModel.runVirtualTryOn(item.imageUri)
                }
            )

            // VIRTUAL TRY-ON DIALOG
            if (isVtoLoading || vtoResultUrl != null) {
                AlertDialog(
                    onDismissRequest = { viewModel.clearVtoResult() },
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("👗", fontSize = 24.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Probador Virtual IA (Isa)", fontWeight = FontWeight.Black)
                        }
                    },
                    text = {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            if (isVtoLoading) {
                                CircularProgressIndicator(color = FashionPrimary)
                                Spacer(modifier = Modifier.height(16.dp))
                                Text("Ajustando costuras e iluminación con Gemini...", style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
                            } else if (vtoResultUrl != null) {
                                Text(
                                    "Desliza para ver la prenda en tu silueta:",
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                                BeforeAfterSlider(
                                    beforeImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop", // User photo mockup
                                    afterImage = vtoResultUrl!!,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(300.dp)
                                )
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { viewModel.clearVtoResult() }) {
                            Text("Cerrar")
                        }
                    }
                )
            }

            // CATALOG GRID
            if (filteredShopItems.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No se hallaron artículos en tiendas locales.", color = Color.Gray)
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .testTag("boutiques_clothes_grid")
                ) {
                    items(filteredShopItems) { boutiqueItem ->
                        BoutiqueClotheCard(
                            item = boutiqueItem,
                            onPreviewFitting = { coordinatePreviewItem = boutiqueItem },
                            onBuyDirect = {
                                viewModel.purchaseStoreItem(boutiqueItem)
                            }
                        )
                    }
                }
            }
        }
    }

    // WebView controller
    selectedStoreUrlToVisit?.let { url ->
        FamousBrandBrowser(
            url = url,
            title = selectedStoreTitleToVisit ?: "Tienda",
            onClose = {
                selectedStoreUrlToVisit = null
                selectedStoreTitleToVisit = null
            }
        )
    }
}

@Composable
fun animatedOutfitCombinationPanel(
    storeItem: ClotheItem?,
    userItem: ClotheItem?,
    onDismiss: () -> Unit,
    onBuyDirect: (ClotheItem) -> Unit,
    onTryOnVirtually: (ClotheItem) -> Unit
) {
    AnimatedVisibility(
        visible = storeItem != null,
        enter = expandVertically() + fadeIn(),
        exit = shrinkVertically() + fadeOut()
    ) {
        storeItem?.let { item ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(28.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
                    .border(1.5.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(28.dp))
                    .testTag("fitting_preview_panel")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Probando Coordinación en Perchero",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = FashionSecondary
                        )
                        IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Cerrar probador")
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Store item previews
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(8.dp)).background(Color.Gray)) {
                                AsyncImage(
                                    model = item.imageUri,
                                    contentDescription = item.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                            Text(
                                "Tienda: ${item.storeName}",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = DarkPanelGold,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                            Text(
                                item.subcategory,
                                style = MaterialTheme.typography.bodySmall,
                                maxLines = 1
                            )
                        }

                        // Coordination central symbol link
                        Icon(
                            imageVector = Icons.Default.Link,
                            contentDescription = "Combinado",
                            tint = FashionPrimary,
                            modifier = Modifier.size(32.dp)
                        )

                        // Owned counterpart garment preview
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            if (userItem != null) {
                                Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(8.dp)).background(Color.Gray)) {
                                    AsyncImage(
                                        model = userItem.imageUri,
                                        contentDescription = userItem.name,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                Text(
                                    "Tu Ropa",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = OwnedGreen,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                                Text(
                                    userItem.name,
                                    style = MaterialTheme.typography.bodySmall,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.width(80.dp),
                                    textAlign = TextAlign.Center
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(80.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.LightGray.copy(alpha = 0.5f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("Ninguno", color = Color.Gray, fontSize = 11.sp)
                                }
                                Text("Sin prenda opuesta", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { onBuyDirect(item) },
                            colors = ButtonDefaults.buttonColors(containerColor = FashionSecondary),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.ShoppingBag, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                "Comprar - $${item.price}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }

                        Button(
                            onClick = { onTryOnVirtually(item) },
                            colors = ButtonDefaults.buttonColors(containerColor = FashionPrimary),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                "Probar IA",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BoutiqueClotheCard(
    item: ClotheItem,
    onPreviewFitting: () -> Unit,
    onBuyDirect: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("boutique_item_${item.id}")
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(125.dp)
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(Color.LightGray)
            ) {
                AsyncImage(
                    model = item.imageUri,
                    contentDescription = item.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // UNPURCHASED BADGE (Requerido por usuario)
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(8.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.Black.copy(alpha = 0.8f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        "Aún no está comprada",
                        color = DarkPanelGold,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                // BRAND TAG
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(6.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(FashionPrimary)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(item.storeName, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }

            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "$${item.price} USD",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Black,
                        color = Color.Black
                    )
                    Text(
                        text = item.category,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Action buttons direct buys and fittings pairs
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    OutlinedButton(
                        onClick = onPreviewFitting,
                        modifier = Modifier
                            .weight(1f)
                            .height(38.dp),
                        contentPadding = PaddingValues(0.dp),
                        border = BorderStroke(1.dp, FashionPrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Outfit", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = FashionPrimary)
                    }

                    Button(
                        onClick = onBuyDirect,
                        colors = ButtonDefaults.buttonColors(containerColor = FashionSecondary),
                        modifier = Modifier
                            .weight(1.2f)
                            .height(38.dp),
                        contentPadding = PaddingValues(0.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(2.dp))
                        Text("Pedir", fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}


/**
 * SCREEN 4: Red Social de Outfits (Share & Rank styles feed)
 */
@Composable
fun SocialFeedView(
    viewModel: WardrobeViewModel,
    modifier: Modifier = Modifier
) {
    val outfits by viewModel.savedOutfits.collectAsState(initial = emptyList())
    val sharedOutfits = outfits.filter { it.isShared || it.likesCount > 40 } // preloaded and community list

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Text(
            "Social Fashion Feed",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Black,
            color = FashionPrimary,
            modifier = Modifier.padding(top = 16.dp)
        )

        Text(
            "Comparte tus combinaciones favoritas con la comunidad y califica los looks de otras diseñadoras en tiempo real.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        if (sharedOutfits.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text("Aún no has compartido outfits. Visita la sección de Clima o Favoritos para subirlos al feed.", color = Color.Gray, textAlign = TextAlign.Center)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 32.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .testTag("social_outfits_list")
            ) {
                items(sharedOutfits) { outfit ->
                    SocialOutfitCard(
                        outfit = outfit,
                        onLike = { viewModel.upvoteOutfit(outfit) }
                    )
                }
            }
        }
    }
}

@Composable
fun SocialOutfitCard(
    outfit: SavedOutfit,
    onLike: () -> Unit
) {
    var animateLike by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f), RoundedCornerShape(28.dp))
            .testTag("social_card_${outfit.id}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Profile top row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(FashionPrimary, FashionSecondary)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        outfit.authorName.take(1).uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.Black
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = "@${outfit.authorName.lowercase()}",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        text = "Combinación para ocasión: ${outfit.occasion}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Body name of setup
            Text(
                text = outfit.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = FashionPrimary
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Clothes ids tag row info
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("Top ID: #${outfit.topId}", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("Bottom ID: #${outfit.bottomId}", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
                if (outfit.outerId != null) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.secondaryContainer)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("Outer ID: #${outfit.outerId}", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.tertiaryContainer)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("Zapatos ID: #${outfit.footwearId}", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

            // Heart actions rank stats
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable {
                        onLike()
                        animateLike = true
                    }
                ) {
                    Icon(
                        imageVector = if (outfit.likesCount > 24) Icons.Default.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = "Votar ranking",
                        tint = FashionSecondary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "${outfit.likesCount} Votos",
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                }

                // Interactive share statistics visual
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = "Clasificación", tint = DarkPanelGold, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(2.dp))
                    Text("Trending", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = DarkPanelGold)
                }
            }
        }
    }
}


/**
 * SCREEN 5: Favorites & Order Tracking List screen (Combinaciones Guardadas + Rastreo Pedidos)
 */
@Composable
fun FavoritesAndOrdersView(
    viewModel: WardrobeViewModel,
    ownedClothes: List<ClotheItem>,
    modifier: Modifier = Modifier
) {
    val savedOutfits by viewModel.savedOutfits.collectAsState(initial = emptyList())
    val trackingOrders by viewModel.trackingOrders.collectAsState(initial = emptyList())

    var activeTab by remember { mutableStateOf(0) } // 0 = Combinaciones, 1 = Rastreo Pedidos

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        // HEADER TITLE
        Text(
            "Mi Rincón Personal",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Black,
            color = FashionPrimary,
            modifier = Modifier.padding(top = 16.dp)
        )

        // TABS CHIPS
        TabRow(
            selectedTabIndex = activeTab,
            containerColor = Color.Transparent,
            contentColor = FashionPrimary,
            modifier = Modifier.padding(vertical = 12.dp)
        ) {
            Tab(
                selected = activeTab == 0,
                onClick = { activeTab = 0 },
                text = { Text("Favoritos (${savedOutfits.size})", fontWeight = FontWeight.Bold) }
            )
            Tab(
                selected = activeTab == 1,
                onClick = { activeTab = 1 },
                text = { Text("Pedidos Directos (${trackingOrders.count { it.status != "Entregado" }})", fontWeight = FontWeight.Bold) }
            )
        }

        if (activeTab == 0) {
            // FAVORITES CONJUNTS LIST
            if (savedOutfits.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No tienes combinaciones guardadas aún.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 32.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .testTag("favorites_outfits_list")
                ) {
                    items(savedOutfits) { outfit ->
                        FavoriteOutfitRow(
                            outfit = outfit,
                            ownedClothes = ownedClothes,
                            onDelete = { viewModel.deleteOutfit(outfit) },
                            onToggleShare = { viewModel.toggleShareOutfit(outfit) }
                        )
                    }
                }
            }
        } else {
            // ORDER TRACKING PROGRESS STEPS
            if (trackingOrders.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No posees compras activas para rastrear.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(bottom = 32.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .testTag("orders_tracking_list")
                ) {
                    items(trackingOrders) { order ->
                        TrackingOrderCard(order = order)
                    }
                }
            }
        }
    }
}

@Composable
fun FavoriteOutfitRow(
    outfit: SavedOutfit,
    ownedClothes: List<ClotheItem>,
    onDelete: () -> Unit,
    onToggleShare: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f), RoundedCornerShape(28.dp))
            .testTag("fav_outfit_${outfit.id}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        outfit.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                    Text(
                        "Ocasión sugerida: ${outfit.occasion}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }

                // Delete outfit button icon
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Remover favorito", tint = Color.Red.copy(alpha = 0.8f))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Shared to network toggle
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.White.copy(alpha = 0.6f))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (outfit.isShared) Icons.Default.Public else Icons.Default.PublicOff,
                        contentDescription = null,
                        tint = if (outfit.isShared) OwnedGreen else Color.Gray,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (outfit.isShared) "Compartido en Red Social" else "Privado (Solo para ti)",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold
                    )
                }

                Switch(
                    checked = outfit.isShared,
                    onCheckedChange = { onToggleShare() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = OwnedGreen,
                        checkedTrackColor = OwnedGreen.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier.testTag("switch_share_${outfit.id}")
                )
            }
        }
    }
}

@Composable
fun TrackingOrderCard(order: TrackingOrder) {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("order_card_${order.orderId}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Order Header Title details
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = order.orderId,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = FashionPrimary
                    )
                    Text(
                        text = "Tienda: ${order.storeName}",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(
                            when (order.status) {
                                "Entregado" -> OwnedGreen.copy(alpha = 0.2f)
                                "En Camino" -> FashionPrimary.copy(alpha = 0.2f)
                                "Procesando" -> DarkPanelGold.copy(alpha = 0.2f)
                                else -> Color.LightGray
                            }
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = order.status,
                        color = when (order.status) {
                            "Entregado" -> OwnedGreen
                            "En Camino" -> FashionPrimary
                            "Procesando" -> DarkPanelGold
                            else -> Color.DarkGray
                        },
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Garments names bought
            Text(
                "Artículos en envío: ${order.itemsSummary}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Costo Total:", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                Text("$${order.totalAmount} USD", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tracking progress bar percentage indicator
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Progreso de Despacho", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Text("${(order.progressPercent * 100).toInt()}%", fontSize = 11.sp, fontWeight = FontWeight.Black)
            }

            LinearProgressIndicator(
                progress = order.progressPercent,
                color = if (order.status == "Entregado") OwnedGreen else FashionSecondary,
                trackColor = Color.LightGray.copy(alpha = 0.4f),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp))
            )

            // Dynamic Step map details
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                val stages = listOf("Verificado", "En bodega", "Tránsito", "Entregado")
                stages.forEachIndexed { idx, stage ->
                    val isDone = order.progressPercent >= (idx.toFloat() / 3f)
                    Text(
                        text = stage,
                        fontSize = 9.sp,
                        fontWeight = if (isDone) FontWeight.Black else FontWeight.Normal,
                        color = if (isDone) FashionPrimary else Color.LightGray
                    )
                }
            }
        }
    }
}

// --- NEW STYLIST AND VIRTUAL TRY-ON COMPOSABLES ---

@Composable
fun BeforeAfterSlider(
    beforeImage: String,
    afterImage: String,
    modifier: Modifier = Modifier
) {
    var sliderPosition by remember { mutableStateOf(0.5f) }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.DarkGray)
    ) {
        // After Image (bottom layer)
        AsyncImage(
            model = afterImage,
            contentDescription = "After Image",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // Before Image (top layer, clipped using a custom shape based on sliderPosition)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    clip = true
                    shape = object : androidx.compose.ui.graphics.Shape {
                        override fun createOutline(
                            size: androidx.compose.ui.geometry.Size,
                            layoutDirection: androidx.compose.ui.unit.LayoutDirection,
                            density: androidx.compose.ui.unit.Density
                        ): androidx.compose.ui.graphics.Outline {
                            return androidx.compose.ui.graphics.Outline.Rectangle(
                                androidx.compose.ui.geometry.Rect(
                                    0f, 0f, size.width * sliderPosition, size.height
                                )
                            )
                        }
                    }
                }
        ) {
            AsyncImage(
                model = beforeImage,
                contentDescription = "Before Image",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Overlay Divider Line
        Canvas(modifier = Modifier.fillMaxSize()) {
            val lineX = size.width * sliderPosition
            drawLine(
                color = Color.White,
                start = androidx.compose.ui.geometry.Offset(lineX, 0f),
                end = androidx.compose.ui.geometry.Offset(lineX, size.height),
                strokeWidth = 4f
            )
            drawCircle(
                color = FashionPrimary,
                radius = 16f,
                center = androidx.compose.ui.geometry.Offset(lineX, size.height / 2)
            )
            drawCircle(
                color = Color.White,
                radius = 10f,
                center = androidx.compose.ui.geometry.Offset(lineX, size.height / 2)
            )
        }

        // Drag Handler
        Slider(
            value = sliderPosition,
            onValueChange = { sliderPosition = it },
            valueRange = 0f..1f,
            colors = SliderDefaults.colors(
                thumbColor = Color.Transparent,
                activeTrackColor = Color.Transparent,
                inactiveTrackColor = Color.Transparent,
                activeTickColor = Color.Transparent,
                inactiveTickColor = Color.Transparent
            ),
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.Center)
                .alpha(0.01f) // virtually invisible but handles drag gestures
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IsaAdvisorChatDialog(
    viewModel: WardrobeViewModel,
    onDismiss: () -> Unit
) {
    val chatMessages by viewModel.chatMessages.collectAsState()
    val isChatLoading by viewModel.isChatLoading.collectAsState()
    var userInputText by remember { mutableStateOf("") }
    val lazyListState = rememberLazyListState()

    LaunchedEffect(chatMessages.size) {
        if (chatMessages.isNotEmpty()) {
            lazyListState.animateScrollToItem(chatMessages.size - 1)
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(FashionPrimary.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("✨", fontSize = 22.sp)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("Isa - Asesora de Estilo", fontWeight = FontWeight.Black, fontSize = 16.sp, color = FashionPrimary)
                    Text("Asistencia inteligente en tiempo real", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(380.dp)
            ) {
                // Messages List
                LazyColumn(
                    state = lazyListState,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                ) {
                    items(chatMessages) { msg ->
                        val isUser = msg.sender == "user"
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                        ) {
                            Surface(
                                color = if (isUser) FashionPrimary else MaterialTheme.colorScheme.surfaceColorAtElevation(2.dp),
                                shape = RoundedCornerShape(
                                    topStart = 16.dp,
                                    topEnd = 16.dp,
                                    bottomStart = if (isUser) 16.dp else 4.dp,
                                    bottomEnd = if (isUser) 4.dp else 16.dp
                                ),
                                modifier = Modifier.widthIn(max = 240.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = msg.text,
                                        color = if (isUser) Color.White else MaterialTheme.colorScheme.onSurface,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                            }
                        }
                    }

                    if (isChatLoading) {
                        item {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(vertical = 4.dp)
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = FashionPrimary)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Isa está pensando...", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            }
                        }
                    }
                }

                // Suggestions Chips Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val suggestions = listOf(
                        "¿Cómo combino mi ropa hoy?",
                        "¿Qué me pongo si llueve?",
                        "Sugiéreme un outfit elegante",
                        "¿Qué recomiendas comprar hoy?"
                    )
                    suggestions.forEach { promptText ->
                        SuggestionChip(
                            onClick = {
                                viewModel.sendMessageToIsa(promptText)
                            },
                            label = { Text(promptText, fontSize = 11.sp) }
                        )
                    }
                }

                // Input field
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = userInputText,
                        onValueChange = { userInputText = it },
                        placeholder = { Text("Pregúntale a Isa...", fontSize = 13.sp) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        colors = TextFieldDefaults.colors(focusedIndicatorColor = FashionPrimary),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (userInputText.isNotBlank()) {
                                viewModel.sendMessageToIsa(userInputText)
                                userInputText = ""
                            }
                        },
                        enabled = userInputText.isNotBlank() && !isChatLoading,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (userInputText.isNotBlank()) FashionPrimary else Color.LightGray)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Enviar", tint = Color.White)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cerrar")
            }
        }
    )
}
