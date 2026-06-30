package com.example.data

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

// Estructuras para envolver peticiones y respuestas según el protocolo de Firebase HTTPS Callables
data class FirebaseCallableRequest<T>(val data: T)
data class FirebaseCallableResponse<T>(val result: T)

// Payloads de petición
data class StylistRequest(val message: String, val wardrobeSummary: String)
data class VtoRequest(val garmentImage: String, val userPhoto: String = "")
data class GeoRequest(val countryCode: String? = null)

// Payloads de respuesta
data class StylistResult(val status: String, val response: String? = null, val message: String? = null)
data class VtoResult(val status: String, val tryOnResultUrl: String? = null, val message: String? = null)
data class GeoResult(val status: String, val countryCode: String? = null, val stores: List<StoreItem>? = null, val message: String? = null)

data class StoreItem(
    val brand: String,
    val category: String,
    val website: String
)

interface FirebaseFunctionsApi {
    @POST("stylistAdvisor")
    suspend fun stylistAdvisor(
        @Body request: FirebaseCallableRequest<StylistRequest>
    ): Response<FirebaseCallableResponse<StylistResult>>

    @POST("virtualTryOn")
    suspend fun virtualTryOn(
        @Body request: FirebaseCallableRequest<VtoRequest>
    ): Response<FirebaseCallableResponse<VtoResult>>

    @POST("getRegionalStores")
    suspend fun getRegionalStores(
        @Body request: FirebaseCallableRequest<GeoRequest>
    ): Response<FirebaseCallableResponse<GeoResult>>
}

object FirebaseClient {
    // Apunta al proyecto dressyourself-app-v1 en us-central1 por defecto
    private const val BASE_URL = "https://us-central1-dressyourself-app-v1.cloudfunctions.net/"

    private val moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    val api: FirebaseFunctionsApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(FirebaseFunctionsApi::class.java)
    }
}
