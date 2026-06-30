package com.example.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class WardrobeRepository(private val wardrobeDao: WardrobeDao) {

    val allClothes: Flow<List<ClotheItem>> = wardrobeDao.getAllClothesFlow()
    val ownedClothes: Flow<List<ClotheItem>> = wardrobeDao.getOwnedClothesFlow()
    val shopClothes: Flow<List<ClotheItem>> = wardrobeDao.getShopClothesFlow()
    val allOutfits: Flow<List<SavedOutfit>> = wardrobeDao.getAllOutfitsFlow()
    val allOrders: Flow<List<TrackingOrder>> = wardrobeDao.getAllOrdersFlow()

    suspend fun getClotheById(id: Int): ClotheItem? {
        return wardrobeDao.getClotheById(id)
    }

    suspend fun insertClothe(clothe: ClotheItem) {
        wardrobeDao.insertClothe(clothe)
    }

    suspend fun deleteClothe(clothe: ClotheItem) {
        wardrobeDao.deleteClothe(clothe)
    }

    suspend fun insertOutfit(outfit: SavedOutfit) {
        wardrobeDao.insertOutfit(outfit)
    }

    suspend fun deleteOutfit(outfit: SavedOutfit) {
        wardrobeDao.deleteOutfit(outfit)
    }

    suspend fun updateOutfit(outfit: SavedOutfit) {
        wardrobeDao.updateOutfit(outfit)
    }

    suspend fun insertOrder(order: TrackingOrder) {
        wardrobeDao.insertOrder(order)
    }

    suspend fun updateOrder(order: TrackingOrder) {
        wardrobeDao.updateOrder(order)
    }

    /**
     * Prepopulates the database with real clothing sample images from Unsplash to make the
     * application immediately dynamic and gorgeous!
     */
    suspend fun prepopulateIfEmpty() {
        withContext(Dispatchers.IO) {
            val currentClotheList = wardrobeDao.getAllClothesFlow().first()
            if (currentClotheList.isEmpty()) {
                val sampleClothes = listOf(
                    // --- OWNED ITEMS (CLOTHES USER ALREADY HAS AVAILABLE) ---
                    ClotheItem(
                        name = "Camiseta de Algodón Blanca",
                        category = "Top",
                        subcategory = "Camiseta",
                        color = "#FFFFFF",
                        colorName = "Blanco Clásico",
                        size = "M",
                        style = "Casual",
                        imageUri = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = 18.0,
                        maxTemp = 35.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Camisa de Lino Celeste",
                        category = "Top",
                        subcategory = "Camisa",
                        color = "#ADD8E6",
                        colorName = "Celeste Suave",
                        size = "L",
                        style = "Elegante",
                        imageUri = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = 15.0,
                        maxTemp = 30.0,
                        rainFriendly = false
                    ),
                    ClotheItem(
                        name = "Chaqueta Denim Clásica",
                        category = "Outerwear",
                        subcategory = "Chaqueta",
                        color = "#4682B4",
                        colorName = "Azul Mezclilla",
                        size = "M",
                        style = "Casual",
                        imageUri = "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = 10.0,
                        maxTemp = 22.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Jeans Slim Fit Azul Oscuro",
                        category = "Bottom",
                        subcategory = "Jeans",
                        color = "#000080",
                        colorName = "Azul Índigo",
                        size = "32",
                        style = "Casual",
                        imageUri = "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = 5.0,
                        maxTemp = 28.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Abrigo Impermeable de Invierno",
                        category = "Outerwear",
                        subcategory = "Abrigo",
                        color = "#2F4F4F",
                        colorName = "Verde Musgo",
                        size = "L",
                        style = "Deportivo",
                        imageUri = "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = -5.0,
                        maxTemp = 12.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Zapatillas Urbanas de Cuero",
                        category = "Footwear",
                        subcategory = "Zapatillas",
                        color = "#FFFFFF",
                        colorName = "Blanco Puro",
                        size = "40",
                        style = "Casual",
                        imageUri = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = 5.0,
                        maxTemp = 35.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Vestido de Cóctel Rojo",
                        category = "Top",
                        subcategory = "Vestido",
                        color = "#FF0000",
                        colorName = "Rojo Carmín",
                        size = "S",
                        style = "Fiesta",
                        imageUri = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = 15.0,
                        maxTemp = 30.0,
                        rainFriendly = false
                    ),
                    ClotheItem(
                        name = "Bolso de Cuero Elegante",
                        category = "Accessory",
                        subcategory = "Bolso",
                        color = "#8B4513",
                        colorName = "Marrón Tabaco",
                        size = "Única",
                        style = "Elegante",
                        imageUri = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80",
                        isPurchased = true,
                        minTemp = -10.0,
                        maxTemp = 45.0,
                        rainFriendly = true
                    ),

                    // --- SHOP ITEMS (NOT YET PURCHASED - STORE ITEMS) ---
                    ClotheItem(
                        name = "Cardigan de Algodón Trenzado",
                        category = "Outerwear",
                        subcategory = "Cardigan",
                        color = "#D2B48C",
                        colorName = "Beige Café",
                        size = "L",
                        style = "Casual",
                        imageUri = "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=80",
                        isPurchased = false,
                        price = 49.95,
                        storeName = "Zara",
                        storeUrl = "https://www.zara.com",
                        minTemp = 8.0,
                        maxTemp = 18.0,
                        rainFriendly = false
                    ),
                    ClotheItem(
                        name = "Botas de Cuero de Alta Gama",
                        category = "Footwear",
                        subcategory = "Botas",
                        color = "#000000",
                        colorName = "Negro Mate",
                        size = "39",
                        style = "Elegante",
                        imageUri = "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500&auto=format&fit=crop&q=80",
                        isPurchased = false,
                        price = 89.90,
                        storeName = "H&M",
                        storeUrl = "https://www2.hm.com",
                        minTemp = -5.0,
                        maxTemp = 15.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Gafas de Sol Carey Aviador",
                        category = "Accessory",
                        subcategory = "Gafas de Sol",
                        color = "#A0522D",
                        colorName = "Carey Jaspeado",
                        size = "Única",
                        style = "Fiesta",
                        imageUri = "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=80",
                        isPurchased = false,
                        price = 19.99,
                        storeName = "Mango",
                        storeUrl = "https://shop.mango.com",
                        minTemp = 10.0,
                        maxTemp = 40.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Pantalón Chino de Terciopelo",
                        category = "Bottom",
                        subcategory = "Pantalón",
                        color = "#006400",
                        colorName = "Verde Pino",
                        size = "34",
                        style = "Formal",
                        imageUri = "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=500&auto=format&fit=crop&q=80",
                        isPurchased = false,
                        price = 39.99,
                        storeName = "Zara",
                        storeUrl = "https://www.zara.com",
                        minTemp = 8.0,
                        maxTemp = 22.0,
                        rainFriendly = true
                    ),
                    ClotheItem(
                        name = "Sudadera Oversize con Capucha",
                        category = "Outerwear",
                        subcategory = "Sudadera",
                        color = "#808080",
                        colorName = "Gris Jaspe",
                        size = "XL",
                        style = "Deportivo",
                        imageUri = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=80",
                        isPurchased = false,
                        price = 29.95,
                        storeName = "Pull&Bear",
                        storeUrl = "https://www.pullandbear.com",
                        minTemp = 10.0,
                        maxTemp = 20.0,
                        rainFriendly = true
                    )
                )

                sampleClothes.forEach { wardrobeDao.insertClothe(it) }

                // Insert a couple matching outfits as samples
                val savedOutfits = listOf(
                    SavedOutfit(
                        name = "Atuendo de Primavera Casual",
                        topId = 1, // Camiseta de Algodón Blanca
                        bottomId = 4, // Jeans Slim Fit Azul Oscuro
                        outerId = 3, // Chaqueta Denim Clásica
                        footwearId = 6, // Zapatillas Urbanas
                        accessoryId = 8, // Bolso de Cuero
                        occasion = "Casual",
                        isShared = true,
                        authorName = "Lucía_Style",
                        likesCount = 24
                    ),
                    SavedOutfit(
                        name = "Look de Invierno Elegante",
                        topId = 2, // Lino Celeste
                        bottomId = 4, // Jeans
                        outerId = 5, // Abrigo Impermeable
                        footwearId = 6, // Zapatillas
                        accessoryId = null,
                        occasion = "Formal",
                        isShared = true,
                        authorName = "Mateo_Vogue",
                        likesCount = 42
                    )
                )

                savedOutfits.forEach { wardrobeDao.insertOutfit(it) }

                // Insert a sample order in shipping
                val sampleOrder = TrackingOrder(
                    orderId = "DRESS-2026-X83K",
                    storeName = "Zara",
                    totalAmount = 89.94,
                    itemsSummary = "Cardigan Beige + Pantalón Pino",
                    status = "En Camino",
                    progressPercent = 0.65f
                )
                wardrobeDao.insertOrder(sampleOrder)
            }
        }
    }
}
