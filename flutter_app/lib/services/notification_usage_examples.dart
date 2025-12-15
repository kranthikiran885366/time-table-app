// Example usage of Notification Service

import 'package:flutter/material.dart';
import '../services/notification_service.dart';
import '../models/timetable.dart';
import '../widgets/countdown_timer.dart';
import '../widgets/class_card.dart';
import '../main.dart';

// ============================================
// 1. INITIALIZE NOTIFICATIONS (Done in main.dart)
// ============================================
void exampleMain() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService().initialize();
  runApp(MyApp());
}

// ============================================
// 2. SCHEDULE SINGLE CLASS NOTIFICATION
// ============================================
void scheduleClassAlert(TimetableEntry classEntry) async {
  // Schedule 15-minute alert
  await NotificationService().scheduleClassStartNotification(
    classEntry: classEntry,
    minutesBefore: 15,
  );
  
  // Schedule 5-minute alert
  await NotificationService().scheduleClassStartNotification(
    classEntry: classEntry,
    minutesBefore: 5,
  );
}

// ============================================
// 3. SCHEDULE ALL CLASSES (Auto-schedules everything)
// ============================================
void scheduleAllClassesForDay(List<TimetableEntry> timetable) async {
  await NotificationService().scheduleAllClassNotifications(timetable);
  // This automatically:
  // - Cancels old notifications
  // - Schedules 15-min and 5-min alerts for each class
  // - Detects room changes and schedules room alerts
}

// ============================================
// 4. SCHEDULE ROOM CHANGE NOTIFICATION
// ============================================
void notifyRoomChange(String previousRoom, TimetableEntry nextClass) async {
  await NotificationService().scheduleRoomChangeNotification(
    previousRoom: previousRoom,
    nextClass: nextClass,
  );
}

// ============================================
// 5. SEND IMMEDIATE NOTIFICATION
// ============================================
void sendInstantNotification() async {
  await NotificationService().showImmediateNotification(
    title: '🎓 Important Update',
    body: 'Your next class has been rescheduled',
  );
}

// ============================================
// 6. CANCEL NOTIFICATIONS
// ============================================
void cancelNotifications() async {
  // Cancel all notifications
  await NotificationService().cancelAllNotifications();
  
  // Cancel specific notification by ID
  await NotificationService().cancelNotification(12345);
}

// ============================================
// 7. REQUEST NOTIFICATION PERMISSIONS
// ============================================
void checkPermissions() async {
  bool granted = await NotificationService().requestPermissions();
  if (granted) {
    print('Notifications enabled');
  } else {
    print('Notifications denied');
  }
}

// ============================================
// NOTIFICATION CHANNELS
// ============================================
// The app uses three notification channels:
// 
// 1. "class_alerts" - Class starting notifications
//    - 15-minute warning
//    - 5-minute warning
//
// 2. "room_alerts" - Room change notifications
//    - 5-minute warning before room change
//
// 3. "immediate_alerts" - Instant notifications
//    - Urgent updates
//    - Schedule changes

// ============================================
// COUNTDOWN TIMER WIDGET USAGE
// ============================================

// For current class (shows time remaining)
Widget buildCurrentClass(TimetableEntry entry) {
  return CountdownTimer(
    endTime: entry.endTime,      // "14:30"
    startTime: entry.startTime,   // "13:30"
    isCurrentClass: true,         // Shows "Time left"
  );
}

// For next class (shows time until start)
Widget buildNextClass(TimetableEntry entry) {
  return CountdownTimer(
    endTime: entry.endTime,
    startTime: entry.startTime,
    isCurrentClass: false,        // Shows "Starts in"
  );
}

// ============================================
// CLASS CARD WITH COUNTDOWN
// ============================================

// Show class card with countdown timer
Widget buildClassWithTimer(TimetableEntry entry, bool isCurrent) {
  return ClassCard(
    timetableEntry: entry,
    showCountdown: true,          // Enable countdown
    isCurrentClass: isCurrent,    // Current vs next class
  );
}

// Show regular class card (no countdown)
Widget buildRegularClass(TimetableEntry entry) {
  return ClassCard(
    timetableEntry: entry,
    showCountdown: false,         // No countdown
  );
}
