class Announcement {
  final String id;
  final String title;
  final String message;
  final String type;
  final String priority;
  final String targetAudience;
  final List<String> targetDepartments;
  final List<String> targetSections;
  final String createdBy;
  final String createdByName;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isActive;
  final bool isPinned;
  final int viewCount;
  final DateTime createdAt;

  Announcement({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.priority,
    required this.targetAudience,
    this.targetDepartments = const [],
    this.targetSections = const [],
    required this.createdBy,
    this.createdByName = '',
    required this.startDate,
    this.endDate,
    this.isActive = true,
    this.isPinned = false,
    this.viewCount = 0,
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['_id'],
      title: json['title'],
      message: json['message'],
      type: json['type'] ?? 'general',
      priority: json['priority'] ?? 'medium',
      targetAudience: json['targetAudience'] ?? 'all',
      targetDepartments: List<String>.from(json['targetDepartments'] ?? []),
      targetSections: List<String>.from(json['targetSections'] ?? []),
      createdBy: json['createdBy']?['_id'] ?? json['createdBy'] ?? '',
      createdByName: json['createdBy']?['name'] ?? '',
      startDate: DateTime.parse(json['startDate']),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
      isActive: json['isActive'] ?? true,
      isPinned: json['isPinned'] ?? false,
      viewCount: json['viewCount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'message': message,
      'type': type,
      'priority': priority,
      'targetAudience': targetAudience,
      'targetDepartments': targetDepartments,
      'targetSections': targetSections,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'isActive': isActive,
      'isPinned': isPinned,
    };
  }
}
