class DashboardStats {
  final OverviewStats overview;
  final SystemHealth systemHealth;

  DashboardStats({
    required this.overview,
    required this.systemHealth,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      overview: OverviewStats.fromJson(json['overview']),
      systemHealth: SystemHealth.fromJson(json['systemHealth']),
    );
  }
}

class OverviewStats {
  final int totalFaculty;
  final int totalDepartments;
  final int totalRooms;
  final int totalSections;
  final int totalSubjects;
  final int totalClasses;
  final int activeAnnouncements;

  OverviewStats({
    required this.totalFaculty,
    required this.totalDepartments,
    required this.totalRooms,
    required this.totalSections,
    required this.totalSubjects,
    required this.totalClasses,
    required this.activeAnnouncements,
  });

  factory OverviewStats.fromJson(Map<String, dynamic> json) {
    return OverviewStats(
      totalFaculty: json['totalFaculty'] ?? 0,
      totalDepartments: json['totalDepartments'] ?? 0,
      totalRooms: json['totalRooms'] ?? 0,
      totalSections: json['totalSections'] ?? 0,
      totalSubjects: json['totalSubjects'] ?? 0,
      totalClasses: json['totalClasses'] ?? 0,
      activeAnnouncements: json['activeAnnouncements'] ?? 0,
    );
  }
}

class SystemHealth {
  final String databaseStatus;
  final String apiStatus;

  SystemHealth({
    required this.databaseStatus,
    required this.apiStatus,
  });

  factory SystemHealth.fromJson(Map<String, dynamic> json) {
    return SystemHealth(
      databaseStatus: json['databaseStatus'] ?? 'unknown',
      apiStatus: json['apiStatus'] ?? 'unknown',
    );
  }
}

class FacultyWorkload {
  final String id;
  final String name;
  final String department;
  final int totalClasses;
  final String weeklyHours;
  final int maxWeeklyHours;
  final String utilizationPercent;
  final String loadStatus;
  final bool onLeave;

  FacultyWorkload({
    required this.id,
    required this.name,
    required this.department,
    required this.totalClasses,
    required this.weeklyHours,
    required this.maxWeeklyHours,
    required this.utilizationPercent,
    required this.loadStatus,
    required this.onLeave,
  });

  factory FacultyWorkload.fromJson(Map<String, dynamic> json) {
    return FacultyWorkload(
      id: json['id'],
      name: json['name'],
      department: json['department'],
      totalClasses: json['totalClasses'] ?? 0,
      weeklyHours: json['weeklyHours'] ?? '0',
      maxWeeklyHours: json['maxWeeklyHours'] ?? 24,
      utilizationPercent: json['utilizationPercent'] ?? '0',
      loadStatus: json['loadStatus'] ?? 'light',
      onLeave: json['onLeave'] ?? false,
    );
  }
}

class RoomUtilization {
  final String room;
  final String type;
  final int capacity;
  final int totalClasses;
  final String weeklyHours;
  final String utilizationPercent;
  final String status;

  RoomUtilization({
    required this.room,
    required this.type,
    required this.capacity,
    required this.totalClasses,
    required this.weeklyHours,
    required this.utilizationPercent,
    required this.status,
  });

  factory RoomUtilization.fromJson(Map<String, dynamic> json) {
    return RoomUtilization(
      room: json['room'],
      type: json['type'],
      capacity: json['capacity'] ?? 0,
      totalClasses: json['totalClasses'] ?? 0,
      weeklyHours: json['weeklyHours'] ?? '0',
      utilizationPercent: json['utilizationPercent'] ?? '0',
      status: json['status'] ?? 'low',
    );
  }
}
