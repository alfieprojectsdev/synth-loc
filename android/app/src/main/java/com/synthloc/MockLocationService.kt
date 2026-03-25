package com.synthloc

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.*

class MockLocationService : Service() {

    private val CHANNEL_ID = "MockLocationServiceChannel"
    private var isMocking = false
    private var currentLat = 0.0
    private var currentLng = 0.0
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val scope = CoroutineScope(Dispatchers.Default + Job())

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "STOP") {
            stopMocking()
            stopSelf()
            return START_NOT_STICKY
        }

        currentLat = intent?.getDoubleExtra("LAT", 0.0) ?: 0.0
        currentLng = intent?.getDoubleExtra("LNG", 0.0) ?: 0.0

        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SynthLoc")
            .setContentText("Mocking GPS Location...")
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setOngoing(true)
            .build()

        startForeground(1, notification)

        startMockingLoop()

        return START_STICKY
    }

    private fun startMockingLoop() {
        if (isMocking) return
        isMocking = true

        try {
            fusedLocationClient.setMockMode(true)
        } catch (e: SecurityException) {
            Log.e("MockLocationService", "Mock location permission not granted", e)
        }

        scope.launch {
            while (isActive && isMocking) {
                try {
                    val location = Location(LocationManager.GPS_PROVIDER).apply {
                        latitude = currentLat
                        longitude = currentLng
                        accuracy = 3f
                        altitude = 0.0
                        time = System.currentTimeMillis()
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                            elapsedRealtimeNanos = SystemClock.elapsedRealtimeNanos()
                        }
                    }
                    fusedLocationClient.setMockLocation(location)
                } catch (e: Exception) {
                    Log.e("MockLocationService", "Error setting mock location", e)
                }
                delay(1000)
            }
        }
    }

    private fun stopMocking() {
        isMocking = false
        try {
            fusedLocationClient.setMockMode(false)
        } catch (e: Exception) {
            Log.e("MockLocationService", "Mock mode could not be removed", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopMocking()
        scope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Mock Location Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }
}
