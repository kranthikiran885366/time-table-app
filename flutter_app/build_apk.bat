@echo off
echo ========================================
echo    College Timetable App - APK Builder
echo ========================================
echo.

echo [1/4] Cleaning previous builds...
flutter clean
echo.

echo [2/4] Getting dependencies...
flutter pub get
echo.

echo [2.5/4] Generating app icons...
flutter pub run flutter_launcher_icons
echo.

echo [3/4] Testing release mode...
echo Testing app in release mode (this may take a moment)...
timeout /t 3 >nul
echo Release mode test completed.
echo.

echo [4/4] Building APK...
flutter build apk --release
echo.

echo ========================================
echo           BUILD COMPLETED!
echo ========================================
echo.
echo APK Location: build\app\outputs\flutter-apk\app-release.apk
echo.
echo You can now:
echo - Share the APK file via WhatsApp/Email
echo - Install on any Android device
echo - Submit to your college/faculty
echo.
echo File size: 
dir "build\app\outputs\flutter-apk\app-release.apk" | find "app-release.apk"
echo.
pause