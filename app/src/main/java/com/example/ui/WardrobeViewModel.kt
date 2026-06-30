package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AppDatabase
import com.example.data.ClotheItem
import com.example.data.SavedOutfit
import com.example.data.TrackingOrder
import com.example.data.WardrobeRepository
import com.example.data.FirebaseClient
import com.example.data.FirebaseCallableRequest
import com.example.data.StylistRequest
import com.example.data.VtoRequest
import com.example.data.GeoRequest
import com.example.data.StoreItem
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

// Weather state definition
data class WeatherInfo(
    val city: String,
    val country: String,
    val tempCelsius: Double,
    val condition: String, // "Soleado", "Lluvia", "Nublado", "Nieve"
    val icon: String,
    val windSpeedKmh: Double,
    val humidityPercent: Int
)

// Notification definition
data class PushNotification(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val message: String,
    val timestampMs: Long = System.currentTimeMillis()
)

class WardrobeViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: WardrobeRepository
    
    // Core Flows from Room DB
    val ownedClothes: StateFlow<List<ClotheItem>>
    val shopClothes: StateFlow<List<ClotheItem>>
    val savedOutfits: StateFlow<List<SavedOutfit>>
    val trackingOrders: StateFlow<List<TrackingOrder>>

    init {
        val database = AppDatabase.getDatabase(application)
        repository = WardrobeRepository(database.wardrobeDao())

        // Initial launch initialization & prepopulate
        viewModelScope.launch {
            repository.prepopulateIfEmpty()
        }

        ownedClothes = repository.ownedClothes.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        shopClothes = repository.shopClothes.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        savedOutfits = repository.allOutfits.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        trackingOrders = repository.allOrders.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        // Launch simulation loop for order tracking updates in real-time
        startOrderTrackingSimulation()
    }

    // Current location/weather simulations
    val cities = listOf(
        WeatherInfo("Bogotá", "Colombia", 14.5, "Nublado", "☁️", 12.0, 78),
        WeatherInfo("Madrid", "España", 24.0, "Soleado", "☀️", 8.0, 42),
        WeatherInfo("Buenos Aires", "Argentina", 18.0, "Nublado", "☁️", 15.0, 60),
        WeatherInfo("Ciudad de México", "México", 21.5, "Lluvia", "🌧️", 10.0, 85),
        WeatherInfo("Nueva York", "EE.UU.", 8.0, "Nieve", "❄️", 22.0, 90),
        WeatherInfo("Londres", "Reino Unido", 12.0, "Lluvia", "🌧️", 18.0, 92)
    )

    private val _selectedCityIndex = MutableStateFlow(0)
    val selectedCityIndex: StateFlow<Int> = _selectedCityIndex

    val currentWeather: StateFlow<WeatherInfo> = _selectedCityIndex
        .combine(MutableStateFlow(cities)) { index, list ->
            list.getOrElse(index) { list[0] }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), cities[0])

    fun setCityIndex(index: Int) {
        _selectedCityIndex.value = index
        // Trigger notification when weather updates
        viewModelScope.launch {
            val weather = cities[index]
            val alertTitle = "Clima actualizado en ${weather.city}"
            val advice = when {
                weather.condition == "Lluvia" -> "Lloverá hoy. Te recomendamos llevar un abrigo impermeable y calzado impermeable."
                weather.tempCelsius < 10.0 -> "Hace frío (${weather.tempCelsius}°C). Ponte abrigo pesado como parka o bufanda."
                weather.tempCelsius > 22.0 -> "Clima muy agradable y soleado. Usa polera fresca, pantalones y lentes de sol."
                else -> "Temperatura templada. Un blazer o chaqueta denim es la combinación perfecta hoy."
            }
            sendNotification(alertTitle, advice)
        }
    }

    // Selected occasion for suggestions
    private val _selectedOccasion = MutableStateFlow("Casual")
    val selectedOccasion: StateFlow<String> = _selectedOccasion

    fun setOccasion(occasion: String) {
        _selectedOccasion.value = occasion
    }

    // Simulated local Notifications Queue
    private val _notifications = MutableStateFlow<List<PushNotification>>(
        listOf(
            PushNotification(
                title = "¡Bienvenida a Dressyourself!",
                message = "Tu vestuario inteligente está configurado. Comienza añadiendo fotos de tu ropa o explora las tiendas integradas."
            ),
            PushNotification(
                title = "Outfit Recomendado del Día",
                message = "El clima hoy está templado, ideal para lucir tus Jeans Slim con tu Camiseta de Algodón Blanca."
            )
        )
    )
    val notifications: StateFlow<List<PushNotification>> = _notifications

    fun sendNotification(title: String, message: String) {
        val newNotification = PushNotification(title = title, message = message)
        _notifications.value = listOf(newNotification) + _notifications.value
    }

    fun clearNotifications() {
        _notifications.value = emptyList()
    }

    // --- MACHINE LEARNING & INTEGRATED ON-DEVICE VISION ALGORITHM SIMULATOR ---
    data class VisionAnalysisResult(
        val category: String,
        val subcategory: String,
        val detectedColorHex: String,
        val detectedColorName: String,
        val style: String,
        val comfortTempText: String,
        val confidencePercent: Int,
        val secondaryColors: List<String>,
        val textilePattern: String // "Liso", "Rayas", "Cuadros", "Estampado"
    )

    private val _visionScanning = MutableStateFlow(false)
    val visionScanning: StateFlow<Boolean> = _visionScanning

    private val _visionResult = MutableStateFlow<VisionAnalysisResult?>(null)
    val visionResult: StateFlow<VisionAnalysisResult?> = _visionResult

    // Standard clothing stock images that represent user selection for uploading
    val predefinedImportImages = listOf(
        Pair("Top - Crop Top Negro", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop"),
        Pair("Bottom - Pantalones Cargo", "https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=600&auto=format&fit=crop"),
        Pair("Outerwear - Gabardina Beige", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop"),
        Pair("Footwear - Botas de Ante Clásico", "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=600&auto=format&fit=crop"),
        Pair("Top - Polera Amarilla", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop"),
        Pair("Bottom - Faldas Escocesas Plisadas", "https://images.unsplash.com/photo-1582142407894-ec85a1268a4e?w=600&auto=format&fit=crop")
    )

    fun runOnDeviceVisionAnalysis(imageUri: String, itemLabel: String) {
        viewModelScope.launch {
            _visionScanning.value = true
            _visionResult.value = null
            
            // Wait 2 seconds to simulate local vision processing algorithms
            delay(2000)

            // Pure deterministic classification based on image selection
            val result = when {
                itemLabel.contains("Crop Top") || itemLabel.contains("Polera") -> {
                    VisionAnalysisResult(
                        category = "Top",
                        subcategory = if (itemLabel.contains("Crop Top")) "Top Deportivo" else "Camiseta",
                        detectedColorHex = if (itemLabel.contains("Crop Top")) "#121212" else "#F4D03F",
                        detectedColorName = if (itemLabel.contains("Crop Top")) "Negro Charcoal" else "Amarillo Canario",
                        style = if (itemLabel.contains("Crop Top")) "Deportivo" else "Casual",
                        comfortTempText = "16°C a 35°C",
                        confidencePercent = 94,
                        secondaryColors = listOf("#CCCCCC"),
                        textilePattern = "Liso"
                    )
                }
                itemLabel.contains("Pantalones") || itemLabel.contains("Faldas") -> {
                    VisionAnalysisResult(
                        category = "Bottom",
                        subcategory = if (itemLabel.contains("Pantalones")) "Pantalón Cargo" else "Falda Plisada",
                        detectedColorHex = if (itemLabel.contains("Pantalones")) "#556B2F" else "#A52A2A",
                        detectedColorName = if (itemLabel.contains("Pantalones")) "Verde Oliva" else "Marrón Terracota",
                        style = "Casual",
                        comfortTempText = "10°C a 28°C",
                        confidencePercent = 91,
                        secondaryColors = listOf("#FFFFFF"),
                        textilePattern = if (itemLabel.contains("Faldas")) "Cuadros" else "Liso"
                    )
                }
                itemLabel.contains("Gabardina") -> {
                    VisionAnalysisResult(
                        category = "Outerwear",
                        subcategory = "Gabardina",
                        detectedColorHex = "#F5F5DC",
                        detectedColorName = "Beige Crema",
                        style = "Elegante",
                        comfortTempText = "5°C a 18°C",
                        confidencePercent = 97,
                        secondaryColors = listOf("#8B4513"),
                        textilePattern = "Liso"
                    )
                }
                itemLabel.contains("Botas") -> {
                    VisionAnalysisResult(
                        category = "Footwear",
                        subcategory = "Botas",
                        detectedColorHex = "#8B4513",
                        detectedColorName = "Café Ante",
                        style = "Casual",
                        comfortTempText = "-5°C a 20°C",
                        confidencePercent = 93,
                        secondaryColors = listOf("#000000"),
                        textilePattern = "Textura Cuero"
                    )
                }
                else -> {
                    // Default random fallback
                    VisionAnalysisResult(
                        category = "Top",
                        subcategory = "Camiseta",
                        detectedColorHex = "#4682B4",
                        detectedColorName = "Azul Ártico",
                        style = "Casual",
                        comfortTempText = "15°C a 32°C",
                        confidencePercent = 89,
                        secondaryColors = emptyList(),
                        textilePattern = "Liso"
                    )
                }
            }
            
            _visionResult.value = result
            _visionScanning.value = false
        }
    }

    fun saveAnalyzedClotheToWardrobe(name: String, size: String, style: String, result: VisionAnalysisResult, imageUri: String) {
        viewModelScope.launch {
            val minTemp = when(result.category) {
                "Outerwear" -> 4.0
                "Footwear" -> -5.0
                else -> 15.0
            }
            val maxTemp = when(result.category) {
                "Top" -> 35.0
                "Outerwear" -> 18.0
                else -> 30.0
            }

            val newClothe = ClotheItem(
                name = name.ifEmpty { "Prenda ${result.subcategory}" },
                category = result.category,
                subcategory = result.subcategory,
                color = result.detectedColorHex,
                colorName = result.detectedColorName,
                size = size,
                style = style,
                imageUri = imageUri,
                isPurchased = true,
                minTemp = minTemp,
                maxTemp = maxTemp,
                rainFriendly = result.category != "Top" || style != "Elegante"
            )
            repository.insertClothe(newClothe)
            _visionResult.value = null // clear result state
            sendNotification("Nueva prenda en armario", "Añadiste exitosamente: $name ($size). La clasificación de visión ML la etiquetó como ${result.subcategory}.")
        }
    }

    fun cancelAnalysis() {
        _visionResult.value = null
        _visionScanning.value = false
    }

    // Delete custom items
    fun deleteClothe(item: ClotheItem) {
        viewModelScope.launch {
            repository.deleteClothe(item)
            sendNotification("Prenda removida", "Eliminaste '${item.name}' de tu colección.")
        }
    }

    // --- FAVORITES & OUTFIT CREATION ---
    fun saveCustomOutfit(name: String, top: ClotheItem, bottom: ClotheItem, outer: ClotheItem?, shoes: ClotheItem, accessory: ClotheItem?, occasion: String) {
        viewModelScope.launch {
            val outfit = SavedOutfit(
                name = name.ifEmpty { "Outfit para $occasion" },
                topId = top.id,
                bottomId = bottom.id,
                outerId = outer?.id,
                footwearId = shoes.id,
                accessoryId = accessory?.id,
                occasion = occasion,
                isShared = false
            )
            repository.insertOutfit(outfit)
            sendNotification("Outfit Guardado", "Añadiste '$name' a tus combinaciones favoritas.")
        }
    }

    fun deleteOutfit(outfit: SavedOutfit) {
        viewModelScope.launch {
            repository.deleteOutfit(outfit)
        }
    }

    fun toggleShareOutfit(outfit: SavedOutfit) {
        viewModelScope.launch {
            val updated = outfit.copy(
                isShared = !outfit.isShared,
                authorName = "Tú",
                likesCount = if (!outfit.isShared) 0 else outfit.likesCount
            )
            repository.updateOutfit(updated)
            if (updated.isShared) {
                sendNotification("Outfit Compartido", "¡Tu outfit '${outfit.name}' ha sido compartido en la red social!")
            }
        }
    }

    fun upvoteOutfit(outfit: SavedOutfit) {
        viewModelScope.launch {
            val updated = outfit.copy(likesCount = outfit.likesCount + 1)
            repository.updateOutfit(updated)
        }
    }

    // --- PURCHASE & ORDER TRACKING SERVICES ---
    fun purchaseStoreItem(item: ClotheItem) {
        viewModelScope.launch {
            val orderId = "DRESS-${(1000..9999).random()}-${('A'..'Z').random()}${('A'..'Z').random()}"
            val newOrder = TrackingOrder(
                orderId = orderId,
                storeName = item.storeName,
                totalAmount = item.price,
                itemsSummary = item.name,
                status = "Confirmando",
                progressPercent = 0.1f
            )
            repository.insertOrder(newOrder)
            sendNotification("Pedido Registrado", "Compraste '${item.name}' en ${item.storeName}. Código de rastreo: $orderId.")
        }
    }

    private fun startOrderTrackingSimulation() {
        viewModelScope.launch {
            while (true) {
                delay(8000) // update progress every 8 seconds for visual dynamic feel
                val orders = trackingOrders.value
                for (order in orders) {
                    if (order.status != "Entregado") {
                        val nextProgress = order.progressPercent + 0.15f
                        val newStatus = when {
                            nextProgress >= 1.0f -> "Entregado"
                            nextProgress >= 0.70f -> "En Camino"
                            nextProgress >= 0.35f -> "Procesando"
                            else -> "Confirmando"
                        }
                        val updatedOrder = order.copy(
                            status = newStatus,
                            progressPercent = nextProgress.coerceAtMost(1.0f)
                        )
                        repository.updateOrder(updatedOrder)

                        if (updatedOrder.status == "Entregado") {
                            sendNotification(
                                "¡Pedido Entregado!",
                                "Tu pedido ${order.orderId} de ${order.storeName} ha sido entregado en tu dirección registrada. ¡Ya está disponible en tu perchero principal!"
                            )
                        }
                    }
                }
            }
        }
    }

    // --- AI STYLIST & CHAT CONTEXT AGENT ("ISA") ---
    data class ChatMessage(
        val sender: String, // "user" or "isa"
        val text: String,
        val timestampMs: Long = System.currentTimeMillis()
    )

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(listOf(
        ChatMessage("isa", "¡Hola! Soy Isa, tu asesora de estilo inteligente. ¿En qué te puedo ayudar hoy? Pregúntame cómo combinar tu ropa o qué ponerte según el clima.")
    ))
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages

    private val _isChatLoading = MutableStateFlow(false)
    val isChatLoading: StateFlow<Boolean> = _isChatLoading

    fun sendMessageToIsa(message: String) {
        if (message.isBlank()) return
        val userMsg = ChatMessage("user", message)
        _chatMessages.value = _chatMessages.value + userMsg
        _isChatLoading.value = true

        viewModelScope.launch {
            try {
                val clothes = ownedClothes.value
                val summary = if (clothes.isEmpty()) {
                    "El armario está vacío."
                } else {
                    clothes.joinToString(separator = ", ") { "${it.name} (${it.category}, ${it.colorName}, estilo ${it.style})" }
                }

                val req = FirebaseCallableRequest(StylistRequest(message, summary))
                val response = FirebaseClient.api.stylistAdvisor(req)
                if (response.isSuccessful) {
                    val apiResult = response.body()?.result
                    if (apiResult?.status == "success" && apiResult.response != null) {
                        _chatMessages.value = _chatMessages.value + ChatMessage("isa", apiResult.response)
                    } else {
                        _chatMessages.value = _chatMessages.value + ChatMessage("isa", "Isa: " + (apiResult?.message ?: "Error desconocido en el servidor de IA."))
                    }
                } else {
                    _chatMessages.value = _chatMessages.value + ChatMessage("isa", "No se pudo comunicar con el agente de IA. Código HTTP: ${response.code()}")
                }
            } catch (e: Exception) {
                _chatMessages.value = _chatMessages.value + ChatMessage("isa", "Error de red al consultar el agente de IA: ${e.localizedMessage}")
            } finally {
                _isChatLoading.value = false
            }
        }
    }

    // --- VIRTUAL TRY-ON (VTO) ---
    private val _vtoResultUrl = MutableStateFlow<String?>(null)
    val vtoResultUrl: StateFlow<String?> = _vtoResultUrl

    private val _isVtoLoading = MutableStateFlow(false)
    val isVtoLoading: StateFlow<Boolean> = _isVtoLoading

    fun runVirtualTryOn(garmentImage: String) {
        _isVtoLoading.value = true
        _vtoResultUrl.value = null

        viewModelScope.launch {
            try {
                val req = FirebaseCallableRequest(VtoRequest(garmentImage = garmentImage))
                val response = FirebaseClient.api.virtualTryOn(req)
                if (response.isSuccessful) {
                    val apiResult = response.body()?.result
                    if (apiResult?.status == "success" && apiResult.tryOnResultUrl != null) {
                        _vtoResultUrl.value = apiResult.tryOnResultUrl
                        sendNotification("Prueba Virtual Lista", "¡La visualización virtual se ha generado con éxito en el probador!")
                    } else {
                        sendNotification("Error de Probador", "No se pudo procesar la prueba virtual: ${apiResult?.message}")
                    }
                } else {
                    sendNotification("Error de Conexión", "Error en el servidor de probador virtual. Código HTTP: ${response.code()}")
                }
            } catch (e: Exception) {
                sendNotification("Error de Red", "Error de conexión con el probador: ${e.localizedMessage}")
            } finally {
                _isVtoLoading.value = false
            }
        }
    }

    fun clearVtoResult() {
        _vtoResultUrl.value = null
    }

    // --- REGIONAL STORE SEARCH ---
    private val _regionalStores = MutableStateFlow<List<StoreItem>>(emptyList())
    val regionalStores: StateFlow<List<StoreItem>> = _regionalStores

    private val _isStoresLoading = MutableStateFlow(false)
    val isStoresLoading: StateFlow<Boolean> = _isStoresLoading

    fun loadRegionalStores(countryCode: String? = null) {
        _isStoresLoading.value = true
        _regionalStores.value = emptyList()

        viewModelScope.launch {
            try {
                val req = FirebaseCallableRequest(GeoRequest(countryCode))
                val response = FirebaseClient.api.getRegionalStores(req)
                if (response.isSuccessful) {
                    val apiResult = response.body()?.result
                    if (apiResult?.status == "success" && apiResult.stores != null) {
                        _regionalStores.value = apiResult.stores
                        sendNotification("Tiendas de Moda", "Cargadas ${apiResult.stores.size} tiendas correspondientes a tu región (${apiResult.countryCode ?: "Global"}).")
                    } else {
                        sendNotification("Geolocalización", "Error al obtener tiendas: ${apiResult?.message}")
                    }
                } else {
                    sendNotification("Geolocalización", "Error de servidor al consultar tiendas.")
                }
            } catch (e: Exception) {
                sendNotification("Error de Red", "No se pudo obtener el listado de tiendas locales.")
            } finally {
                _isStoresLoading.value = false
            }
        }
    }
}
