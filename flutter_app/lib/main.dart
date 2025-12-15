import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/timetable_provider.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/timetable_upload_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/department_management_screen.dart';
import 'screens/announcement_management_screen.dart';
import 'screens/activity_log_screen.dart';
import 'screens/analytics_dashboard_screen.dart';
import 'screens/faculty_workload_screen.dart';
import 'screens/room_utilization_screen.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize notification service
  await NotificationService().initialize();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => TimetableProvider()),
      ],
      child: MaterialApp(
        title: 'Timetable Management System',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: LandingScreen(),
        debugShowCheckedModeBanner: false,
        onGenerateRoute: (settings) {
          if (settings.name == '/login') {
            final userType = settings.arguments as String? ?? 'faculty';
            return MaterialPageRoute(
              builder: (context) => LoginScreen(userType: userType),
            );
          } else if (settings.name == '/upload-timetable') {
            return MaterialPageRoute(
              builder: (context) => const TimetableUploadScreen(),
            );
          } else if (settings.name == '/admin-dashboard') {
            return MaterialPageRoute(
              builder: (context) => AdminDashboardScreen(),
            );
          } else if (settings.name == '/department-management') {
            return MaterialPageRoute(
              builder: (context) => const DepartmentManagementScreen(),
            );
          } else if (settings.name == '/announcement-management') {
            return MaterialPageRoute(
              builder: (context) => const AnnouncementManagementScreen(),
            );
          } else if (settings.name == '/activity-log') {
            return MaterialPageRoute(
              builder: (context) => const ActivityLogScreen(),
            );
          } else if (settings.name == '/analytics-dashboard') {
            return MaterialPageRoute(
              builder: (context) => AnalyticsDashboardScreen(),
            );
          } else if (settings.name == '/faculty-workload') {
            return MaterialPageRoute(
              builder: (context) => FacultyWorkloadScreen(),
            );
          } else if (settings.name == '/room-utilization') {
            return MaterialPageRoute(
              builder: (context) => RoomUtilizationScreen(),
            );
          }
          return null;
        },
      ),
    );
  }
}