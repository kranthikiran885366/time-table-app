import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/announcement.dart';

class AnnouncementManagementScreen extends StatefulWidget {
  const AnnouncementManagementScreen({Key? key}) : super(key: key);

  @override
  State<AnnouncementManagementScreen> createState() => _AnnouncementManagementScreenState();
}

class _AnnouncementManagementScreenState extends State<AnnouncementManagementScreen> {
  List<Announcement> _announcements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAnnouncements();
  }

  Future<void> _loadAnnouncements() async {
    setState(() => _isLoading = true);
    try {
      final announcements = await ApiService.getAnnouncements();
      setState(() {
        _announcements = announcements;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _showAnnouncementDialog({Announcement? announcement}) async {
    final titleController = TextEditingController(text: announcement?.title ?? '');
    final messageController = TextEditingController(text: announcement?.message ?? '');
    String type = announcement?.type ?? 'general';
    String priority = announcement?.priority ?? 'medium';
    String targetAudience = announcement?.targetAudience ?? 'all';

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(announcement == null ? 'New Announcement' : 'Edit Announcement'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(labelText: 'Title'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: messageController,
                  decoration: const InputDecoration(labelText: 'Message'),
                  maxLines: 4,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: ['info', 'warning', 'urgent', 'holiday', 'cancellation', 'general']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase())))
                      .toList(),
                  onChanged: (value) => setDialogState(() => type = value!),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: priority,
                  decoration: const InputDecoration(labelText: 'Priority'),
                  items: ['low', 'medium', 'high', 'critical']
                      .map((p) => DropdownMenuItem(value: p, child: Text(p.toUpperCase())))
                      .toList(),
                  onChanged: (value) => setDialogState(() => priority = value!),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: targetAudience,
                  decoration: const InputDecoration(labelText: 'Target Audience'),
                  items: ['all', 'students', 'faculty', 'department', 'section']
                      .map((a) => DropdownMenuItem(value: a, child: Text(a.toUpperCase())))
                      .toList(),
                  onChanged: (value) => setDialogState(() => targetAudience = value!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final data = {
                  'title': titleController.text,
                  'message': messageController.text,
                  'type': type,
                  'priority': priority,
                  'targetAudience': targetAudience,
                  'startDate': DateTime.now().toIso8601String(),
                };

                try {
                  if (announcement == null) {
                    await ApiService.createAnnouncement(data);
                  } else {
                    await ApiService.updateAnnouncement(announcement.id, data);
                  }
                  if (mounted) {
                    Navigator.pop(context);
                    _loadAnnouncements();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcements'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAnnouncementDialog(),
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAnnouncements,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _announcements.length,
                itemBuilder: (context, index) {
                  final announcement = _announcements[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getPriorityColor(announcement.priority),
                        child: Icon(
                          announcement.isPinned ? Icons.push_pin : Icons.announcement,
                          color: Colors.white,
                        ),
                      ),
                      title: Text(
                        announcement.title,
                        style: TextStyle(
                          fontWeight: announcement.isPinned ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(announcement.message, maxLines: 2, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Chip(
                                label: Text(announcement.type.toUpperCase()),
                                labelStyle: const TextStyle(fontSize: 10),
                                padding: EdgeInsets.zero,
                              ),
                              const SizedBox(width: 4),
                              Chip(
                                label: Text(announcement.priority.toUpperCase()),
                                labelStyle: const TextStyle(fontSize: 10),
                                backgroundColor: _getPriorityColor(announcement.priority).withOpacity(0.2),
                                padding: EdgeInsets.zero,
                              ),
                            ],
                          ),
                        ],
                      ),
                      isThreeLine: true,
                      trailing: PopupMenuButton(
                        itemBuilder: (context) => [
                          PopupMenuItem(
                            child: const Text('Edit'),
                            onTap: () => Future.delayed(
                              Duration.zero,
                              () => _showAnnouncementDialog(announcement: announcement),
                            ),
                          ),
                          PopupMenuItem(
                            child: Text(announcement.isPinned ? 'Unpin' : 'Pin'),
                            onTap: () async {
                              await ApiService.toggleAnnouncementPin(announcement.id);
                              _loadAnnouncements();
                            },
                          ),
                          PopupMenuItem(
                            child: const Text('Delete'),
                            onTap: () async {
                              await ApiService.deleteAnnouncement(announcement.id);
                              _loadAnnouncements();
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
