# 📱 App Icon Setup Guide

## Current Status ✅
- App name updated to "Timetable Management"
- SVG icon created at: `assets/images/app_icon.svg`
- Android configuration updated

## 🎨 Icon Design
The created icon features:
- Blue circular background (#2196F3)
- White calendar grid
- Colorful time slots (Green, Orange, Purple, Red, Blue)
- Clock symbol for time management
- Professional, clean design

## 📋 To Use Custom Icon:

### Option 1: Use Flutter Launcher Icons Package
1. Add to pubspec.yaml:
```yaml
dev_dependencies:
  flutter_launcher_icons: ^0.13.1

flutter_icons:
  android: true
  ios: true
  image_path: "assets/images/app_icon.svg"
  adaptive_icon_background: "#2196F3"
  adaptive_icon_foreground: "assets/images/app_icon.svg"
```

2. Run:
```bash
flutter pub get
flutter pub run flutter_launcher_icons
```

### Option 2: Manual Icon Replacement
Replace existing icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`

Required sizes:
- mdpi: 48x48px
- hdpi: 72x72px  
- xhdpi: 96x96px
- xxhdpi: 144x144px
- xxxhdpi: 192x192px

## 🚀 Build APK with New Icon
```bash
flutter clean
flutter pub get
flutter build apk --release
```

Your APK will now show "Timetable Management" with the custom calendar icon! 📅