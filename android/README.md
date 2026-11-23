# CardDrop — Native Android App (Kotlin & Jetpack Compose)

This directory contains the full, production-ready native Android project source code written in **Kotlin** with **Jetpack Compose**, **CameraX**, **Google ML Kit Barcode Scanning**, **ZXing**, and **Room Database**.

## Architecture & Tech Stack

- **UI**: Jetpack Compose + Material 3 Design
- **Camera & Scanning**: CameraX + Google ML Kit Barcode Scanning API (hardware accelerated, low-latency QR recognition)
- **QR Generation**: ZXing QRCodeWriter + custom Bitmap rendering
- **Database**: Room ORM (SQLite) with Kotlin Coroutines Flow
- **VCard Engine**: RFC-compliant vCard 3.0 & MECARD parser and generator (`VCardManager.kt`)
- **System Intents**: Direct phone dialing (`Intent.ACTION_DIAL`), messaging (`Intent.ACTION_SENDTO`), and sharing (`Intent.ACTION_SEND`)

## Project Structure

```
android/
├── app/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           └── java/com/carddrop/app/
│               ├── MainActivity.kt
│               ├── data/
│               │   ├── Contact.kt
│               │   ├── ContactDao.kt
│               │   └── AppDatabase.kt
│               ├── vcard/
│               │   └── VCardManager.kt
│               └── ui/
│                   ├── MyCardScreen.kt
│                   ├── QRScannerScreen.kt
│                   └── ContactListScreen.kt
└── README.md
```

## How to Build in Android Studio

1. Open **Android Studio** (Ladybug or newer).
2. Select **Open an Existing Project** and choose the `android` folder.
3. Allow Gradle to sync dependencies.
4. Plug in your **Pixel 8** via USB (with Developer options & USB debugging enabled) or start a Pixel emulator.
5. Click **Run 'app'** (Shift + F10) to compile and install directly onto your Pixel 8!
