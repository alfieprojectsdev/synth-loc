package com.synthloc

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MockLocationModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MockLocationModule"
    }

    @ReactMethod
    fun startMocking(lat: Double, lng: Double) {
        val intent = Intent(reactContext, MockLocationService::class.java).apply {
            putExtra("LAT", lat)
            putExtra("LNG", lng)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopMocking() {
        val intent = Intent(reactContext, MockLocationService::class.java).apply {
            action = "STOP"
        }
        reactContext.startService(intent)
    }
}
