import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/analytics.dart';

class RoomUtilizationScreen extends StatefulWidget {
  const RoomUtilizationScreen({Key? key}) : super(key: key);

  @override
  State<RoomUtilizationScreen> createState() => _RoomUtilizationScreenState();
}

class _RoomUtilizationScreenState extends State<RoomUtilizationScreen> {
  List<RoomUtilization> _rooms = [];
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
      final result = await ApiService.getRoomUtilization();
      setState(() {
        _rooms = result['rooms'];
        _summary = result['summary'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'high':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      default:
        return Colors.green;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Room Utilization'),
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
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  _buildSummaryItem('Avg Utilization', '${_summary!['averageUtilization']}%'),
                                  _buildSummaryItem('Highly Utilized', _summary!['highlyUtilized'].toString(), Colors.red),
                                  _buildSummaryItem('Underutilized', _summary!['underutilized'].toString(), Colors.green),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    Text(
                      'Room List',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _rooms.length,
                      itemBuilder: (context, index) {
                        final room = _rooms[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: _getStatusColor(room.status),
                              child: Text(room.room.substring(0, 1)),
                            ),
                            title: Text(room.room),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${room.type} • Capacity: ${room.capacity}'),
                                const SizedBox(height: 4),
                                LinearProgressIndicator(
                                  value: double.parse(room.utilizationPercent) / 100,
                                  backgroundColor: Colors.grey[300],
                                  color: _getStatusColor(room.status),
                                ),
                                const SizedBox(height: 4),
                                Text('${room.utilizationPercent}% utilized • ${room.weeklyHours}h/week'),
                              ],
                            ),
                            isThreeLine: true,
                            trailing: Chip(
                              label: Text(room.status.toUpperCase()),
                              backgroundColor: _getStatusColor(room.status).withOpacity(0.2),
                            ),
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
}
