@echo off
echo Fixing Flutter build issues...

echo Step 1: Cleaning project...
flutter clean

echo Step 2: Getting dependencies...
flutter pub get

echo Step 3: Killing any running processes...
taskkill /f /im dart.exe 2>nul
taskkill /f /im java.exe 2>nul

echo Step 4: Removing build directory...
if exist build rmdir /s /q build

echo Step 5: Building APK...
flutter build apk --release

echo Build process completed!
pause