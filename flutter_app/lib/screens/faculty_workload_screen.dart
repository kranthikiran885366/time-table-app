import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/analytics.dart';

class FacultyWorkloadScreen extends StatefulWidget {
  const FacultyWorkloadScreen({Key? key}) : super(key: key);

  @override
  State<FacultyWorkloadScreen> createState() => _FacultyWorkloadScreenState();
}

class _FacultyWorkloadScreenState extends State<FacultyWorkloadScreen> {
  List<FacultyWorkload> _workload = [];
  Map<String, dynamic>? _summary;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getFacultyWorkload();
      setState(() {
        _workload = result['faculty'];
        _summary = result['summary'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Color _getLoadStatusColor(String status) {
    switch (status) {
      case 'overloaded':
        return Colors.red;
      case 'optimal':
        return Colors.green;
      case 'moderate':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Faculty Workload'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_summary != null) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Summary',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildSummaryItem('Avg Hours', _summary!['averageHours'].toString()),
                                  _buildSummaryItem('Overloaded', _summary!['overloaded'].toString(), Colors.red),
                                  _buildSummaryItem('Optimal', _summary!['optimal'].toString(), Colors.green),
                                  _buildSummaryItem('Light', _summary!['underutilized'].toString(), Colors.grey),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    Text(
                      'Faculty List',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _workload.length,
                      itemBuilder: (context, index) {
                        final faculty = _workload[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ExpansionTile(
                            leading: CircleAvatar(
                              backgroundColor: _getLoadStatusColor(faculty.loadStatus),
                              child: Text(faculty.name.substring(0, 1)),
                            ),
                            title: Text(faculty.name),
                            subtitle: Text('${faculty.department} • ${faculty.weeklyHours}h / ${faculty.maxWeeklyHours}h'),
                            trailing: Chip(
                              label: Text(faculty.loadStatus.toUpperCase()),
                              backgroundColor: _getLoadStatusColor(faculty.loadStatus).withOpacity(0.2),
                            ),
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  children: [
                                    _buildInfoRow('Total Classes', faculty.totalClasses.toString()),
                                    _buildInfoRow('Weekly Hours', faculty.weeklyHours),
                                    _buildInfoRow('Utilization', '${faculty.utilizationPercent}%'),
                                    _buildInfoRow('On Leave', faculty.onLeave ? 'Yes' : 'No'),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryItem(String label, String value, [Color? color]) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
