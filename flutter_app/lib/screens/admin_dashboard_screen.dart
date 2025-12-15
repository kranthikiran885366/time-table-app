import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/analytics.dart';
import 'department_management_screen.dart';
import 'section_management_screen.dart';
import 'announcement_management_screen.dart';
import 'activity_log_screen.dart';
import 'analytics_dashboard_screen.dart';
import 'faculty_workload_screen.dart';
import 'room_utilization_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  final Map<String, dynamic>? user;

  const AdminDashboardScreen({Key? key, this.user}) : super(key: key);

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  DashboardStats? _stats;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDashboardStats();
  }

  Future<void> _loadDashboardStats() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final stats = await ApiService.getDashboardStats();
      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardStats,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ApiService.logout();
              if (mounted) {
                Navigator.pushReplacementNamed(context, '/');
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDashboardStats,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadDashboardStats,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Welcome Card
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 30,
                                  child: Text(
                                    widget.user?['name']?[0].toUpperCase() ?? 'A',
                                    style: const TextStyle(fontSize: 24),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Welcome, ${widget.user?['name'] ?? 'Admin'}',
                                        style: Theme.of(context).textTheme.titleLarge,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        widget.user?['role']?.toUpperCase() ?? 'ADMIN',
                                        style: Theme.of(context).textTheme.bodySmall,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Overview Statistics
                        Text(
                          'Overview',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 12),
                        _buildOverviewGrid(),
                        const SizedBox(height: 24),

                        // Quick Actions
                        Text(
                          'Quick Actions',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 12),
                        _buildQuickActions(),
                        const SizedBox(height: 24),

                        // Analytics Cards
                        Text(
                          'Analytics',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 12),
                        _buildAnalyticsCards(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildOverviewGrid() {
    if (_stats == null) return const SizedBox();

    final items = [
      {'icon': Icons.school, 'label': 'Faculty', 'value': _stats!.overview.totalFaculty, 'color': Colors.blue, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => FacultyWorkloadScreen()))},
      {'icon': Icons.business, 'label': 'Departments', 'value': _stats!.overview.totalDepartments, 'color': Colors.green, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DepartmentManagementScreen()))},
      {'icon': Icons.meeting_room, 'label': 'Rooms', 'value': _stats!.overview.totalRooms, 'color': Colors.orange, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => RoomUtilizationScreen()))},
      {'icon': Icons.class_, 'label': 'Sections', 'value': _stats!.overview.totalSections, 'color': Colors.purple, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SectionManagementScreen()))},
      {'icon': Icons.book, 'label': 'Subjects', 'value': _stats!.overview.totalSubjects, 'color': Colors.teal, 'onTap': () => Navigator.pushNamed(context, '/upload-timetable')},
      {'icon': Icons.calendar_today, 'label': 'Classes', 'value': _stats!.overview.totalClasses, 'color': Colors.indigo, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => AnalyticsDashboardScreen()))},
      {'icon': Icons.announcement, 'label': 'Announcements', 'value': _stats!.overview.activeAnnouncements, 'color': Colors.red, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnnouncementManagementScreen()))},
      {'icon': Icons.cloud_done, 'label': 'System', 'value': _stats!.systemHealth.apiStatus == 'operational' ? 'Online' : 'Offline', 'color': Colors.cyan, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ActivityLogScreen()))},
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: items.map((item) {
        return Card(
          elevation: 2,
          child: InkWell(
            onTap: item['onTap'] as VoidCallback,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    item['icon'] as IconData,
                    size: 32,
                    color: item['color'] as Color,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    item['value'].toString(),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item['label'] as String,
                    style: Theme.of(context).textTheme.bodySmall,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      {'icon': Icons.business, 'label': 'Departments', 'color': Colors.green, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DepartmentManagementScreen()))},
      {'icon': Icons.class_, 'label': 'Sections', 'color': Colors.purple, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SectionManagementScreen()))},
      {'icon': Icons.announcement, 'label': 'Announcements', 'color': Colors.red, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnnouncementManagementScreen()))},
      {'icon': Icons.history, 'label': 'Activity Logs', 'color': Colors.blue, 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ActivityLogScreen()))},
      {'icon': Icons.upload_file, 'label': 'Upload Timetable', 'color': Colors.orange, 'onTap': () => Navigator.pushNamed(context, '/upload-timetable')},
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: actions.map((action) {
        return Card(
          elevation: 2,
          color: action['color'] as Color,
          child: InkWell(
            onTap: action['onTap'] as VoidCallback,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  action['icon'] as IconData,
                  size: 40,
                  color: Colors.white,
                ),
                const SizedBox(height: 8),
                Text(
                  action['label'] as String,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAnalyticsCards() {
    final cards = [
      {'icon': Icons.insert_chart, 'label': 'Analytics Dashboard', 'subtitle': 'View detailed analytics', 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => AnalyticsDashboardScreen()))},
      {'icon': Icons.people, 'label': 'Faculty Workload', 'subtitle': 'Monitor faculty schedules', 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => FacultyWorkloadScreen()))},
      {'icon': Icons.meeting_room, 'label': 'Room Utilization', 'subtitle': 'Track room usage', 'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (_) => RoomUtilizationScreen()))},
    ];

    return Column(
      children: cards.map((card) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
              child: Icon(
                card['icon'] as IconData,
                color: Theme.of(context).primaryColor,
              ),
            ),
            title: Text(card['label'] as String),
            subtitle: Text(card['subtitle'] as String),
            trailing: const Icon(Icons.chevron_right),
            onTap: card['onTap'] as VoidCallback,
          ),
        );
      }).toList(),
    );
  }
}
