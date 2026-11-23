#!/bin/bash
set -e

echo "=== Building 100% Offline Standalone CardDrop Android APK with File System Access ==="

ROOT_DIR="$PWD"
BUILD_DIR="/tmp/carddrop_apk_build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/carddrop/app"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/gen"
mkdir -p "$BUILD_DIR/assets/www"

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
DX_JAR="/usr/share/java/com.android.dx.jar"

# Copy icons
cp "$ROOT_DIR/public/pwa-192x192.png" "$BUILD_DIR/res/mipmap-hdpi/ic_launcher.png"
cp "$ROOT_DIR/public/pwa-192x192.png" "$BUILD_DIR/res/mipmap-xhdpi/ic_launcher.png"
cp "$ROOT_DIR/public/pwa-512x512.png" "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"

# Copy compiled web app directly into APK assets for 100% offline local execution
echo "Copying compiled web app into APK assets..."
cp -r "$ROOT_DIR/dist/"* "$BUILD_DIR/assets/www/"
# Exclude any previously built APK / signature files copied from public/ into dist/
rm -f "$BUILD_DIR/assets/www/CardDrop.apk" "$BUILD_DIR/assets/www/CardDrop.apk.idsig"

# 1. AndroidManifest.xml
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.carddrop.app"
    android:versionCode="4"
    android:versionName="1.2.1">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FLASHLIGHT" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar">

        <activity
            android:name="com.carddrop.app.MainActivity"
            android:label="@string/app_name"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Allow opening .vcf files directly from Files, WhatsApp, Gmail, Downloads -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:mimeType="text/x-vcard" />
                <data android:mimeType="text/vcard" />
                <data android:mimeType="application/octet-stream" />
                <data android:pathPattern=".*\\.vcf" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 2. strings.xml
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">CardDrop</string>
</resources>
EOF

# 3. MainActivity.java - With onShowFileChooser for file picker & direct VCF intent reader
cat << 'EOF' > "$BUILD_DIR/src/com/carddrop/app/MainActivity.java"
package com.carddrop.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> uploadMessage;
    private PermissionRequest pendingPermissionRequest;
    private static final int FILECHOOSER_RESULTCODE = 101;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 201;

    public class WebAppInterface {
        MainActivity activity;
        WebAppInterface(MainActivity a) { activity = a; }

        @JavascriptInterface
        public boolean hasCameraPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                return activity.checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
            }
            return true;
        }

        @JavascriptInterface
        public void requestCameraPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (activity.checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    activity.requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
                }
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(0xFF0F172A);
        }

        FrameLayout container = new FrameLayout(this);
        container.setBackgroundColor(0xFF0F172A);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF0F172A);
        container.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));
        setContentView(container);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);

        // Bridge to JavaScript for camera permission check
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        // Proactively request camera permission on Android 6+ if not yet granted
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
            }
        }

        // Native Camera & File Chooser handlers
        webView.setWebChromeClient(new WebChromeClient() {
            // Camera permission for WebRTC / getUserMedia
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                request.grant(request.getResources());
                            }
                        });
                    } else {
                        pendingPermissionRequest = request;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            request.grant(request.getResources());
                        }
                    });
                }
            }

            // Android System File Picker for importing .vcf files
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                    uploadMessage = null;
                }
                uploadMessage = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                String[] mimeTypes = new String[]{"text/vcard", "text/x-vcard", "text/plain", "application/octet-stream", "*/*"};
                intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);

                try {
                    startActivityForResult(Intent.createChooser(intent, "Izaberi fajl / Select File"), FILECHOOSER_RESULTCODE);
                } catch (ActivityNotFoundException e) {
                    uploadMessage = null;
                    return false;
                }
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                handleIncomingIntent(getIntent());
            }
        });

        // 100% Offline Local Assets - NO Cloud Server, NO Google Login, NO Passwords!
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (pendingPermissionRequest != null) {
                    final PermissionRequest req = pendingPermissionRequest;
                    pendingPermissionRequest = null;
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            req.grant(req.getResources());
                        }
                    });
                }
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (webView != null) {
                            webView.evaluateJavascript("if (window.onCameraPermissionGranted) { window.onCameraPermissionGranted(); }", null);
                        }
                    }
                });
            } else {
                if (pendingPermissionRequest != null) {
                    final PermissionRequest req = pendingPermissionRequest;
                    pendingPermissionRequest = null;
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            req.deny();
                        }
                    });
                }
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (webView != null) {
                            webView.evaluateJavascript("if (window.onCameraPermissionDenied) { window.onCameraPermissionDenied(); }", null);
                        }
                    }
                });
            }
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        Uri uri = intent.getData();
        if (uri != null) {
            readVcfFromUri(uri);
        }
    }

    private void readVcfFromUri(Uri uri) {
        try {
            InputStream is = getContentResolver().openInputStream(uri);
            if (is == null) return;
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            reader.close();
            is.close();

            String vcfContent = sb.toString();
            final String base64 = Base64.encodeToString(vcfContent.getBytes("UTF-8"), Base64.NO_WRAP);
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (webView != null) {
                        webView.evaluateJavascript("if (window.onVcfFileReceived) { window.onVcfFileReceived(atob('" + base64 + "'), 'Imported VCF'); }", null);
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (uploadMessage == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                ClipData clipData = data.getClipData();
                if (clipData != null) {
                    results = new Uri[clipData.getItemCount()];
                    for (int i = 0; i < clipData.getItemCount(); i++) {
                        results[i] = clipData.getItemAt(i).getUri();
                    }
                } else if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                }
            }
            uploadMessage.onReceiveValue(results);
            uploadMessage = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }
}
EOF

echo "1. Compiling Android Resources with aapt..."
aapt package -f -m \
    -J "$BUILD_DIR/gen" \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR"

echo "2. Compiling Java Source Files..."
javac -source 1.8 -target 1.8 \
    -bootclasspath "$ANDROID_JAR" \
    -d "$BUILD_DIR/obj" \
    "$BUILD_DIR/gen/com/carddrop/app/R.java" \
    "$BUILD_DIR/src/com/carddrop/app/MainActivity.java"

echo "3. Converting to Dalvik Executable (classes.dex)..."
java -jar "$DX_JAR" --dex --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/obj"

echo "4. Packaging raw APK with aapt (including offline assets)..."
aapt package -f \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/unaligned.apk"

cd "$BUILD_DIR"
aapt add unaligned.apk classes.dex

echo "5. Zipaligning APK..."
zipalign -f -p 4 unaligned.apk aligned.apk

echo "6. Creating keystore & signing APK with apksigner..."
KEYSTORE="$BUILD_DIR/debug.keystore"
keytool -genkeypair -v -keystore "$KEYSTORE" -alias androiddebugkey \
    -keypass android -storepass android -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"

rm -f "$ROOT_DIR/public/CardDrop.apk" "$ROOT_DIR/public/CardDrop.apk.idsig"
apksigner sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android \
    --v4-signing-enabled false \
    --out "$ROOT_DIR/public/CardDrop.apk" aligned.apk

echo "7. Verifying APK signature..."
apksigner verify "$ROOT_DIR/public/CardDrop.apk"

echo "=== SUCCESS! Fully Offline Standalone APK with File System Access built at $ROOT_DIR/public/CardDrop.apk ==="
ls -lh "$ROOT_DIR/public/CardDrop.apk"
