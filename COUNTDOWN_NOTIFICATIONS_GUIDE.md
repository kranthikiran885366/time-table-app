# 📱 Countdown Timer & Notification System - Setup Guide

## ✅ Implementation Complete

The timetable app now includes:
- ⏱️ **Live countdown timers** for current and next classes
- 🔔 **Push notification system** with class alerts
- 🚪 **Room change notifications**

---

## 🎯 Features Implemented

### 1. **Countdown Timer**
- Real-time countdown showing time left for current class
- Countdown showing when next class starts
- Auto-updates every second
- Visual styling with color-coded indicators (green for current, blue for next)

### 2. **Push Notifications**
- **15-minute alerts**: "Class starting in 15 minutes"
- **5-minute alerts**: "Class starting in 5 minutes"  
- **Room change alerts**: Notifies when moving to a different room
- Automatic scheduling for all daily classes
- Background notification support

---

## 📦 Installation Steps

### Step 1: Install Flutter Dependencies
```bash
cd flutter_app
flutter pub get
```

### Step 2: Run the App
```bash
# For Android
flutter run

# For iOS (requires Mac)
flutter run -d ios

# For Web
flutter run -d chrome
```

---

## 🔧 Configuration

### Android Setup (Already Configured)
The `AndroidManifest.xml` includes required permissions:
- `POST_NOTIFICATIONS` - Send notifications
- `SCHEDULE_EXACT_ALARM` - Schedule precise timing
- `RECEIVE_BOOT_COMPLETED` - Persist after device restart

### iOS Setup (If building for iOS)
Add to `ios/Runner/Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

---

## 🎨 User Experience

### Room Search Screen
- Shows **current class** with live countdown timer
- Shows **next class** with time until it starts
- Displays full day schedule

### Section Timetable Screen
- **Today tab**: Current class highlighted with countdown
- **Weekly tab**: Full week overview
- Auto-schedules notifications for all classes

### Notifications
When users view their timetable:
1. App automatically schedules notifications
2. Receives alert 15 minutes before class
3. Receives alert 5 minutes before class
4. Gets room change alert if moving buildings/rooms

---

## 🧪 Testing

### Test Countdown Timer
1. Search for a room or section
2. If there's a current class, you'll see a live countdown
3. Timer updates every second showing time remaining

### Test Notifications
1. View today's timetable
2. Grant notification permission when prompted
3. Notifications will be scheduled automatically
4. Test notifications appear 15 and 5 minutes before class time

**Note**: For testing, you can temporarily modify the `minutesBefore` parameter in the notification service to trigger sooner.

---

## 📁 Files Created/Modified

### New Files
- `lib/widgets/countdown_timer.dart` - Live countdown widget
- `lib/services/notification_service.dart` - Notification management
- `android/app/src/main/AndroidManifest.xml` - Android permissions

### Modified Files
- `pubspec.yaml` - Added dependencies
- `lib/main.dart` - Initialize notification service
- `lib/widgets/class_card.dart` - Added countdown support
- `lib/screens/room_details_screen.dart` - Integrated countdown & notifications
- `lib/screens/section_timetable_screen.dart` - Integrated countdown & notifications

---

## 🔔 Notification Settings

Users can:
- Enable/disable notifications in device settings
- Customize notification sounds
- See notification history

App automatically:
- Schedules notifications when viewing timetable
- Cancels old notifications
- Reschedules on app restart

---

## 🚀 Next Steps

1. **Install dependencies**: `flutter pub get`
2. **Run the app**: `flutter run`
3. **Test features**: Search for a room/section
4. **Grant permissions**: Allow notifications when prompted
5. **Enjoy**: Live countdowns and automatic alerts!

---

## 💡 Tips

- Notifications work best on physical devices
- iOS requires additional simulator setup for notifications
- Countdown timers work on all platforms (mobile, web, desktop)
- Check device notification settings if alerts don't appear

---

## 🐛 Troubleshooting

**Countdown not updating?**
- Ensure widget is using `showCountdown: true` parameter

**Notifications not appearing?**
- Check app permissions in device settings
- Verify notification channels are enabled
- Test on a physical device (emulators may have limitations)

**Build errors?**
- Run `flutter clean` then `flutter pub get`
- Update Flutter SDK: `flutter upgrade`
