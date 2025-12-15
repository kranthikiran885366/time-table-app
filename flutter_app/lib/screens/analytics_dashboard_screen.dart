import 'package:flutter/material.dart';
import 'faculty_workload_screen.dart';
import 'room_utilization_screen.dart';

class AnalyticsDashboardScreen extends StatelessWidget {
  const AnalyticsDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics Dashboard'),
      ),
      body: GridView.count(
        crossAxisCount: 2,
        padding: const EdgeInsets.all(16),
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: [
          _buildAnalyticsCard(
            context,
            'Faculty Workload',
            Icons.people,
            Colors.blue,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const FacultyWorkloadScreen()),
            ),
          ),
          _buildAnalyticsCard(
            context,
            'Room Utilization',
            Icons.meeting_room,
            Colors.green,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const RoomUtilizationScreen()),
            ),
          ),
          _buildAnalyticsCard(
            context,
            'Department Stats',
            Icons.business,
            Colors.purple,
            () {
              // Navigate to department analytics
            },
          ),
          _buildAnalyticsCard(
            context,
            'Conflicts',
            Icons.warning,
            Colors.orange,
            () {
              // Navigate to conflict report
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 48, color: color),
              const SizedBox(height: 12),
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
