@echo off
echo Building Flutter Web App...
echo.

REM Clean previous builds
echo Cleaning previous builds...
flutter clean

REM Get dependencies
echo Getting dependencies...
flutter pub get

REM Build for web
echo Building for web...
flutter build web --release --web-renderer html

echo.
echo Build completed! Web files are in build\web directory
echo You can deploy the contents of build\web to any web hosting service
echo.
pause