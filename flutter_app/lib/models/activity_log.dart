class ActivityLog {
  final String id;
  final String userId;
  final String action;
  final String entity;
  final String details;
  final String description;
  final String userName;
  final String userRole;
  final String ipAddress;
  final String device;
  final String browser;
  final DateTime timestamp;
  final DateTime createdAt;

  ActivityLog({
    required this.id,
    required this.userId,
    required this.action,
    required this.entity,
    required this.details,
    required this.description,
    required this.userName,
    required this.userRole,
    required this.ipAddress,
    required this.device,
    required this.browser,
    required this.timestamp,
    required this.createdAt,
  });

  factory ActivityLog.fromJson(Map<String, dynamic> json) {
    return ActivityLog(
      id: json['_id'] ?? '',
      userId: json['userId'] ?? '',
      action: json['action'] ?? '',
      entity: json['entity'] ?? '',
      details: json['details'] ?? '',
      description: json['description'] ?? json['details'] ?? '',
      userName: json['userName'] ?? 'Unknown',
      userRole: json['userRole'] ?? 'user',
      ipAddress: json['ipAddress'] ?? '',
      device: json['device'] ?? 'Unknown',
      browser: json['browser'] ?? 'Unknown',
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      createdAt: DateTime.tryParse(json['createdAt'] ?? json['timestamp'] ?? '') ?? DateTime.now(),
    );
  }
}