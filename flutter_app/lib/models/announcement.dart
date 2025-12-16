class Announcement {
  final String id;
  final String title;
  final String content;
  final String message;
  final String targetAudience;
  final String type;
  final String priority;
  final bool isPinned;
  final DateTime createdAt;

  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.message,
    required this.targetAudience,
    required this.type,
    required this.priority,
    required this.isPinned,
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      message: json['message'] ?? json['content'] ?? '',
      targetAudience: json['targetAudience'] ?? 'all',
      type: json['type'] ?? 'general',
      priority: json['priority'] ?? 'medium',
      isPinned: json['isPinned'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}