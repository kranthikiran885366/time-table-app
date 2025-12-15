# 📱 Android APK Build Guide
## University Timetable Management App

This guide will help you build a production-ready Android APK for demo, testing, or deployment.

---

## ✅ Prerequisites

Before building the APK, ensure you have:

- ✔ Flutter installed (run `flutter --version`)
- ✔ Android Studio with Android SDK installed
- ✔ `flutter doctor` shows no critical errors
- ✔ App runs successfully on emulator/device

**Check your setup:**
```bash
flutter doctor
```

---

## 🔧 Configuration Checklist

### ✅ STEP 1: Android Configuration (DONE ✓)

The following are already configured:

- **minSdkVersion**: 21 (Supports Android 5.0+)
- **targetSdkVersion**: 34 (Android 14)
- **Internet Permission**: Added in AndroidManifest.xml
- **Notification Permissions**: Added for countdown reminders

**Files:**
- `android/app/build.gradle.kts`
- `android/app/src/main/AndroidManifest.xml`

---

### ⚙️ STEP 2: Backend URL Configuration

**IMPORTANT:** Before building APK, update the backend URL!

**File:** `lib/services/api_service.dart`

```dart
class ApiService {
  // For development (localhost):
  // static const String baseUrl = 'http://localhost:5000/api';
  
  // For production APK:
  static const String baseUrl = 'https://your-backend-url.com/api';
}
```

**Options:**

1. **Use hosted backend** (Recommended):
   - Deploy backend to Render/Railway/Heroku/AWS
   - Update baseUrl with production URL
   - Example: `'https://timetable-backend.onrender.com/api'`

2. **Use local network** (Demo on same WiFi):
   - Find your PC IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update baseUrl: `'http://192.168.x.x:5000/api'`
   - Ensure backend is running on your PC
   - Both phone and PC must be on same WiFi

3. **Use ngrok** (Temporary public URL):
   ```bash
   ngrok http 5000
   ```
   - Copy forwarding URL (e.g., `https://abc123.ngrok.io`)
   - Update baseUrl: `'https://abc123.ngrok.io/api'`

---

## 🧪 STEP 3: Test Release Mode

**Test the app in release mode before building APK:**

```bash
cd flutter_app
flutter run --release
```

**Fix any errors** before proceeding. Common issues:
- Missing dependencies
- API connection errors
- Asset loading issues

---

## 📦 STEP 4: Build APK

### Option A: Universal APK (Recommended for Demo)

This creates a single APK that works on all devices:

```bash
cd flutter_app
flutter build apk --release
```

**Output:**
```
build/app/outputs/flutter-apk/app-release.apk
```

**File size:** ~40-60 MB

---

### Option B: Split APKs (Smaller Size)

Creates separate APKs for different CPU architectures:

```bash
flutter build apk --split-per-abi
```

**Output:**
```
build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk (ARM 32-bit)
build/app/outputs/flutter-apk/app-arm64-v8a-release.apk   (ARM 64-bit)
build/app/outputs/flutter-apk/app-x86_64-release.apk      (Intel 64-bit)
```

**File size:** ~20-30 MB each

**Note:** Use `app-arm64-v8a-release.apk` for most modern phones.

---

## 🔐 STEP 5: APK Signing (Optional - Professional)

For better security and Google Play upload, sign your APK.

### Generate Keystore

```bash
keytool -genkey -v -keystore android/app/timetable-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias timetable
```

**Enter details:**
- Password: (Choose strong password)
- Name, Organization, etc.
- **Save this password!** You'll need it later.

### Create key.properties

**File:** `android/key.properties`

```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=timetable
storeFile=timetable-key.jks
```

### Update build.gradle.kts

**File:** `android/app/build.gradle.kts`

Add before `android {`:

```kotlin
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Add inside `android {`:

```kotlin
signingConfigs {
    create("release") {
        keyAlias = keystoreProperties['keyAlias']
        keyPassword = keystoreProperties['keyPassword']
        storeFile = file(keystoreProperties['storeFile'])
        storePassword = keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
    }
}
```

Then rebuild:

```bash
flutter build apk --release
```

---

## 📤 STEP 6: Share & Install APK

### Locate APK

```
flutter_app/build/app/outputs/flutter-apk/app-release.apk
```

### Share Options

1. **Google Drive / Dropbox**
   - Upload APK
   - Share link with faculty/testers

2. **WhatsApp / Telegram**
   - Send APK directly (rename to .zip if blocked)

3. **USB Transfer**
   - Copy to phone storage
   - Use file manager to install

4. **GitHub Release**
   - Create release tag
   - Upload APK as release asset

### Installation on Android Phone

1. Copy APK to phone
2. Open APK file
3. If prompted, enable **"Install from unknown sources"**
4. Tap **Install**
5. Open app and test!

---

## 🏫 For College Demo / Submission

### Test Login Credentials

**Admin Account:**
```
Email: admin@college.edu
Password: admin123
```

**Student Account:**
```
Email: student@college.edu
Password: student123
```

### Demo Checklist

- [ ] App launches without crashes
- [ ] Login works for admin and student
- [ ] Can upload Excel timetable
- [ ] Timetable displays correctly
- [ ] Section management works
- [ ] Countdown notifications work
- [ ] Search functionality works

### Sample Data

Ensure backend has:
- ✔ 19 sections (SEC1-SEC19)
- ✔ Sample timetable data
- ✔ Faculty and room data

---

## 🐛 Troubleshooting

### Build Fails

```bash
flutter clean
flutter pub get
flutter build apk --release
```

### APK Installs but Crashes

- Check `flutter run --release` works first
- Verify backend URL is correct and accessible
- Check logcat: `adb logcat | grep Flutter`

### "App not installed" Error

- Uninstall old version first
- Check if signatures match (if previously signed)
- Ensure phone has enough storage

### Network Errors

- Verify backend URL in `api_service.dart`
- Check backend is running and accessible
- Test URL in browser first

---

## 📊 App Info

**Current Configuration:**

- **Package Name:** `com.college.timetable_management`
- **Version:** 1.0.0
- **Min SDK:** 21 (Android 5.0+)
- **Target SDK:** 34 (Android 14)
- **Permissions:**
  - Internet
  - Notifications
  - Exact Alarms
  - Boot Completed

---

## 🚀 Quick Build Command

**One command to build release APK:**

```bash
cd flutter_app && flutter build apk --release
```

**Output location:**
```
build/app/outputs/flutter-apk/app-release.apk
```

---

## 📝 Notes

- APK is **NOT signed** by default (uses debug keystore)
- For Google Play Store, you **MUST** sign with release keystore
- For internal college use, unsigned APK is fine
- Backend must be accessible from internet for app to work
- Test on multiple devices before final demo

---

## ✅ Final Checklist

Before sharing APK:

- [ ] Backend URL updated to production
- [ ] Tested in release mode
- [ ] APK builds without errors
- [ ] Installed and tested on real device
- [ ] Login works
- [ ] Excel upload works
- [ ] All features functional
- [ ] No crashes or major bugs

---

**You're ready to share your APK! 🎉**

For questions or issues, check the main README.md or consult Flutter documentation.
