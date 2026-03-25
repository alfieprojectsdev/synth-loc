### **Building the Android Foreground Service**

Since your Samsung A07 runs Android 15/16, it is subject to Android's strict modern background execution limits. We have to declare a specific `FOREGROUND_SERVICE_LOCATION` permission.

Here is the step-by-step implementation for your `feature/osm-map` branch.

#### **Step 1: Update Android Permissions**
Open `android/app/src/main/AndroidManifest.xml`. We need to add permissions for the service and for posting notifications (required in Android 13+).

Add these inside the `<manifest>` tag, alongside your existing location permissions:
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Next, scroll down to the `<application>` tag. You need to register your new service here:
```xml
<application ...>
    <service
        android:name=".MockLocationService"
        android:enabled="true"
        android:exported="false"
        android:foregroundServiceType="location" />
</application>
```

#### **Step 2: Create the Service Class**
Create a new file at `android/app/src/main/java/com/mockgpsapp/MockLocationService.java`. 

This class creates a persistent notification, which is Android's requirement for keeping an app alive in the background.

```java
package com.mockgpsapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class MockLocationService extends Service {
    private static final String CHANNEL_ID = "MockLocationChannel";
    private static final int NOTIFICATION_ID = 1;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Build the persistent notification
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("GPS Spoofer Active")
                .setContentText("Running in background to maintain mock location.")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation) // Native Android icon
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        // This tells Android: "Do not kill this process!"
        startForeground(NOTIFICATION_ID, notification);

        return START_STICKY; 
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // We don't need to bind UI components to this service
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Mock Location Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
```

#### **Step 3: Trigger the Service from your Module**
Now we need to tell our existing bridge module to start this service when you push the "Set Location" button, and stop it when you press "Stop".

Open your existing `MockLocationModule.java` and update the `setMockLocation` and `stopMocking` methods:

```java
    @ReactMethod
    public void setMockLocation(double lat, double lng) {
        try {
            // ... [Keep all your existing location provider code here] ...
            locationManager.setTestProviderLocation(providerName, mockLocation);

            // START THE FOREGROUND SERVICE
            Intent serviceIntent = new Intent(getReactApplicationContext(), MockLocationService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getReactApplicationContext().startForegroundService(serviceIntent);
            } else {
                getReactApplicationContext().startService(serviceIntent);
            }

        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void stopMocking() {
        try {
            // ... [Keep your existing remove provider code here] ...
            locationManager.removeTestProvider(providerName);

            // STOP THE FOREGROUND SERVICE
            Intent serviceIntent = new Intent(getReactApplicationContext(), MockLocationService.class);
            getReactApplicationContext().stopService(serviceIntent);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
```

#### **Step 4: Request Notification Permission in React Native**
Because Android 13+ won't show the foreground notification without explicit permission, your app will crash if it tries to start the service without it. 

We need to request it in `App.tsx`. Add this standard React Native permission check near the top of your component:

```javascript
import { PermissionsAndroid, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';

// ... inside your App component ...

  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Warning", "Background spoofing requires notification permissions to stay alive.");
        }
      }
    };
    
    requestNotificationPermission();
  }, []);
```

---

### **The Result**
Rebuild your app (`npm run android`). 

Now, when you tap "Set Location", you should see a little location icon appear in your top status bar. You can completely minimize the app, open up Google Maps or a testing environment, and your fake location will remain rock solid because Android knows your service is actively running. 

Would you like to explore how to add a "Joystick" feature to this app so you can simulate walking around from the fake location, or are you happy with the static pin drop for now?