import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import '../models/timetable.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    
    try {
      // Initialize timezone data
      tz.initializeTimeZones();
      
      // Android initialization settings
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      
      // iOS initialization settings
      const DarwinInitializationSettings initializationSettingsIOS =
          DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
      
      // Combined initialization settings
      const InitializationSettings initializationSettings =
          InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsIOS,
      );
      
      // Initialize the plugin
      await _notifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );
      
      _initialized = true;
    } catch (e) {
      print('Notification initialization failed: $e');
      _initialized = false;
    }
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Handle notification tap
    print('Notification tapped: ${response.payload}');
  }

  Future<bool> requestPermissions() async {
    if (await Permission.notification.isGranted) {
      return true;
    }

    final status = await Permission.notification.request();
    return status.isGranted;
  }

  Future<void> scheduleClassStartNotification({
    required TimetableEntry classEntry,
    int minutesBefore = 15,
  }) async {
    if (!_initialized) await initialize();
    if (!await requestPermissions()) return;

    try {
      final now = DateTime.now();
      final timeParts = classEntry.startTime.split(':');
      
      // Null safety check
      if (timeParts.length < 2) {
        print('Invalid time format: ${classEntry.startTime}');
        return;
      }
      
      final classStartTime = DateTime(
        now.year,
        now.month,
        now.day,
        int.parse(timeParts[0]),
        int.parse(timeParts[1]),
      );

      final notificationTime =
          classStartTime.subtract(Duration(minutes: minutesBefore));

      // Only schedule if notification time is in the future
      if (notificationTime.isAfter(now)) {
        await _notifications.zonedSchedule(
          classEntry.id.hashCode, // Unique ID based on class
          '📚 Class Starting Soon',
          '${classEntry.subject.name} starts in $minutesBefore minutes at ${classEntry.room.number}',
          tz.TZDateTime.from(notificationTime, tz.local),
          NotificationDetails(
            android: AndroidNotificationDetails(
              'class_alerts',
              'Class Alerts',
              channelDescription: 'Notifications for upcoming classes',
              importance: Importance.high,
              priority: Priority.high,
              icon: '@mipmap/ic_launcher',
            ),
            iOS: const DarwinNotificationDetails(
              presentAlert: true,
              presentBadge: true,
              presentSound: true,
            ),
          ),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          payload: 'class_start_${classEntry.id}',
        );
      }
    } catch (e) {
      print('Error scheduling notification: $e');
    }
  }

  Future<void> scheduleRoomChangeNotification({
    required String previousRoom,
    required TimetableEntry nextClass,
  }) async {
    if (!_initialized) await initialize();
    if (!await requestPermissions()) return;

    try {
      final now = DateTime.now();
      final timeParts = nextClass.startTime.split(':');
      final classStartTime = DateTime(
        now.year,
        now.month,
        now.day,
        int.parse(timeParts[0]),
        int.parse(timeParts[1]),
      );

      final notificationTime = classStartTime.subtract(Duration(minutes: 5));

      if (notificationTime.isAfter(now)) {
        await _notifications.zonedSchedule(
          nextClass.id.hashCode + 1000, // Different ID for room change
          '🚪 Room Change Alert',
          'Next class in ${nextClass.room.number} (was in $previousRoom)',
          tz.TZDateTime.from(notificationTime, tz.local),
          NotificationDetails(
            android: AndroidNotificationDetails(
              'room_alerts',
              'Room Change Alerts',
              channelDescription: 'Notifications for room changes',
              importance: Importance.high,
              priority: Priority.high,
              icon: '@mipmap/ic_launcher',
            ),
            iOS: const DarwinNotificationDetails(
              presentAlert: true,
              presentBadge: true,
              presentSound: true,
            ),
          ),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          payload: 'room_change_${nextClass.id}',
        );
      }
    } catch (e) {
      print('Error scheduling room change notification: $e');
    }
  }

  Future<void> showImmediateNotification({
    required String title,
    required String body,
  }) async {
    if (!_initialized) await initialize();
    if (!await requestPermissions()) return;

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch % 100000,
      title,
      body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'immediate_alerts',
          'Immediate Alerts',
          channelDescription: 'Immediate notifications',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
    );
  }

  Future<void> scheduleAllClassNotifications(
      List<TimetableEntry> timetable) async {
    // Cancel all existing notifications
    await cancelAllNotifications();

    for (var classEntry in timetable) {
      // Schedule 15-minute alert
      await scheduleClassStartNotification(
        classEntry: classEntry,
        minutesBefore: 15,
      );

      // Schedule 5-minute alert
      await scheduleClassStartNotification(
        classEntry: classEntry,
        minutesBefore: 5,
      );
    }

    // Check for room changes
    for (int i = 0; i < timetable.length - 1; i++) {
      final currentClass = timetable[i];
      final nextClass = timetable[i + 1];

      if (currentClass.room.number != nextClass.room.number) {
        await scheduleRoomChangeNotification(
          previousRoom: currentClass.room.number,
          nextClass: nextClass,
        );
      }
    }
  }

  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }

  Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }
}
