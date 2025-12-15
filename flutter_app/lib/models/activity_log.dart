class ActivityLog {
  final String id;
  final String userId;
  final String userName;
  final String userRole;
  final String action;
  final String entity;
  final String? entityId;
  final String description;
  final String ipAddress;
  final String device;
  final String browser;
  final String status;
  final DateTime createdAt;

  ActivityLog({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userRole,
    required this.action,
    required this.entity,
    this.entityId,
    required this.description,
    this.ipAddress = '',
    this.device = '',
    this.browser = '',
    this.status = 'success',
    required this.createdAt,
  });

  factory ActivityLog.fromJson(Map<String, dynamic> json) {
    return ActivityLog(
      id: json['_id'],
      userId: json['userId']?['_id'] ?? json['userId'] ?? '',
      userName: json['userName'] ?? '',
      userRole: json['userRole'] ?? '',
      action: json['action'],
      entity: json['entity'],
      entityId: json['entityId'],
      description: json['description'],
      ipAddress: json['ipAddress'] ?? '',
      device: json['device'] ?? '',
      browser: json['browser'] ?? '',
      status: json['status'] ?? 'success',
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
