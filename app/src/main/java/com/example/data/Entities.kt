package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "clothes")
data class ClotheItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val category: String, // "Top", "Bottom", "Outerwear", "Footwear", "Accessory"
    val subcategory: String, // "Camiseta", "Jeans", "Abrigo", "Zapatillas", "Gorra", etc.
    val color: String, // hex string or name
    val colorName: String, // e.g., "Azul Marina", "Negro Profundo"
    val size: String, // "S", "M", "L", "XL", "Única"
    val style: String, // "Casual", "Formal", "Deportivo", "Elegante", "Fiesta"
    val imageUri: String, // URI path or predefined resource identifier/keyword
    val isPurchased: Boolean = true, // true = already owned, false = store item
    val price: Double = 0.0, // for shop items
    val storeName: String = "", // for shop items
    val storeUrl: String = "", // famous store website link
    val minTemp: Double = 0.0, // minimum comfort temperature
    val maxTemp: Double = 40.0, // maximum comfort temperature
    val rainFriendly: Boolean = true,
    val dateAdded: Long = System.currentTimeMillis()
)

@Entity(tableName = "saved_outfits")
data class SavedOutfit(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val topId: Int,
    val bottomId: Int,
    val outerId: Int?,
    val footwearId: Int,
    val accessoryId: Int?,
    val occasion: String,
    val isShared: Boolean = false,
    val authorName: String = "Tú",
    val likesCount: Int = 0,
    val dateSaved: Long = System.currentTimeMillis()
)

@Entity(tableName = "tracking_orders")
data class TrackingOrder(
    @PrimaryKey val orderId: String,
    val storeName: String,
    val totalAmount: Double,
    val itemsSummary: String,
    val status: String, // "Confirmando", "Procesando", "En Camino", "Entregado"
    val orderDateMillis: Long = System.currentTimeMillis(),
    val progressPercent: Float = 0.0f
)
