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

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Global error handler
  FlutterError.onError = (FlutterErrorDetails details) {
    debugPrint('Flutter Error: ${details.exception}');
  };
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => TimetableProvider(),
          lazy: false,
        ),
      ],
      child: MaterialApp(
        title: 'Timetable Management System',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: const SafeArea(child: LandingScreen()),
        debugShowCheckedModeBanner: false,
        onGenerateRoute: (RouteSettings settings) {
          try {
            switch (settings.name) {
              case '/login':
                final userType = settings.arguments as String? ?? 'faculty';
                return MaterialPageRoute(
                  builder: (context) => LoginScreen(userType: userType),
                );
              case '/upload-timetable':
                return MaterialPageRoute(
                  builder: (context) => const TimetableUploadScreen(),
                );
              case '/admin-dashboard':
                return MaterialPageRoute(
                  builder: (context) => const AdminDashboardScreen(),
                );
              case '/department-management':
                return MaterialPageRoute(
                  builder: (context) => const DepartmentManagementScreen(),
                );
              case '/announcement-management':
                return MaterialPageRoute(
                  builder: (context) => const AnnouncementManagementScreen(),
                );
              case '/activity-log':
                return MaterialPageRoute(
                  builder: (context) => const ActivityLogScreen(),
                );
              case '/analytics-dashboard':
                return MaterialPageRoute(
                  builder: (context) => AnalyticsDashboardScreen(),
                );
              case '/faculty-workload':
                return MaterialPageRoute(
                  builder: (context) => FacultyWorkloadScreen(),
                );
              case '/room-utilization':
                return MaterialPageRoute(
                  builder: (context) => RoomUtilizationScreen(),
                );
              default:
                return MaterialPageRoute(
                  builder: (context) => LandingScreen(),
                );
            }
          } catch (e) {
            debugPrint('Route generation error: $e');
            return MaterialPageRoute(
              builder: (context) => LandingScreen(),
            );
          }
        },
      ),
    );
  }
}