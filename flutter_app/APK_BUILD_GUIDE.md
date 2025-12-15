# 📱 APK Build Guide - College Timetable App

## 🚀 Quick Build (Recommended)

1. **Run the build script:**
   ```bash
   build_apk.bat
   ```

2. **APK Location:**
   ```
   build\app\outputs\flutter-apk\app-release.apk
   ```

## 📋 Manual Build Steps

### Prerequisites ✅
- Flutter SDK installed
- Android SDK installed
- `flutter doctor` shows no errors

### Step 1: Update Backend URL
**IMPORTANT:** Before building, update the API URL in:
```
lib\services\api_service.dart
```

Change:
```dart
static const String baseUrl = 'https://your-backend-url.com/api';
```

### Step 2: Build Commands
```bash
# Navigate to flutter_app directory
cd flutter_app

# Clean previous builds
flutter clean

# Get dependencies
flutter pub get

# Test release mode (optional)
flutter run --release

# Build APK
flutter build apk --release
```

### Step 3: APK Output
```
📁 build/app/outputs/flutter-apk/
   └── app-release.apk  ← Your APK file
```

## 🎯 For College Demo/Submission

### Installation Instructions:
1. **Transfer APK** to Android device
2. **Enable** "Install from unknown sources"
3. **Install** the APK
4. **Login** with demo credentials:
   - Admin: `admin@college.edu` / `admin123`
   - Faculty: `john@college.edu` / `faculty123`

### Demo Features:
- ✅ Room search functionality
- ✅ Section timetable viewing
- ✅ Excel upload (Admin only)
- ✅ Live class indicators
- ✅ Responsive design

## 🔧 Advanced: Signed APK (Optional)

For production deployment, create a signed APK:

1. **Generate keystore:**
   ```bash
   keytool -genkey -v -keystore timetable-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias timetable
   ```

2. **Create key.properties:**
   ```
   storePassword=your_password
   keyPassword=your_password
   keyAlias=timetable
   storeFile=timetable-key.jks
   ```

3. **Update build.gradle.kts** with signing config

## 📊 APK Details

- **Target SDK:** 34 (Android 14)
- **Min SDK:** 21 (Android 5.0+)
- **App ID:** com.college.timetable_app
- **Permissions:** Internet, Notifications
- **Size:** ~15-25 MB (typical)

## 🐛 Troubleshooting

### Common Issues:
1. **"flutter not found"** → Add Flutter to PATH
2. **"Android SDK not found"** → Set ANDROID_HOME
3. **"Build failed"** → Run `flutter doctor` and fix issues
4. **"Network error in app"** → Check backend URL in api_service.dart

### Build Errors:
```bash
# Clear cache and rebuild
flutter clean
flutter pub get
flutter build apk --release
```

## 📱 Testing Checklist

Before sharing APK:
- [ ] App launches successfully
- [ ] Login works with demo credentials
- [ ] Room search returns results
- [ ] Section search displays timetables
- [ ] UI is responsive on different screen sizes
- [ ] No network errors (if backend is running)

## 🎓 College Submission Ready!

Your APK is now ready for:
- Faculty demonstration
- Student testing
- College project submission
- Internship portfolio

**File to share:** `app-release.apk` (15-25 MB)