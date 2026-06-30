package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import kotlinx.coroutines.flow.Flow

@Dao
interface WardrobeDao {

    @Query("SELECT * FROM clothes ORDER BY dateAdded DESC")
    fun getAllClothesFlow(): Flow<List<ClotheItem>>

    @Query("SELECT * FROM clothes WHERE isPurchased = 1 ORDER BY dateAdded DESC")
    fun getOwnedClothesFlow(): Flow<List<ClotheItem>>

    @Query("SELECT * FROM clothes WHERE isPurchased = 0 ORDER BY dateAdded DESC")
    fun getShopClothesFlow(): Flow<List<ClotheItem>>

    @Query("SELECT * FROM clothes WHERE id = :id")
    suspend fun getClotheById(id: Int): ClotheItem?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClothe(clothe: ClotheItem)

    @Delete
    suspend fun deleteClothe(clothe: ClotheItem)

    // Saved Outfits
    @Query("SELECT * FROM saved_outfits ORDER BY dateSaved DESC")
    fun getAllOutfitsFlow(): Flow<List<SavedOutfit>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOutfit(outfit: SavedOutfit)

    @Delete
    suspend fun deleteOutfit(outfit: SavedOutfit)

    @Update
    suspend fun updateOutfit(outfit: SavedOutfit)

    // Tracking Orders
    @Query("SELECT * FROM tracking_orders ORDER BY orderDateMillis DESC")
    fun getAllOrdersFlow(): Flow<List<TrackingOrder>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: TrackingOrder)

    @Update
    suspend fun updateOrder(order: TrackingOrder)
}
