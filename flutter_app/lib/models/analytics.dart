class DashboardStats {
  final int totalFaculty;
  final int totalSubjects;
  final int totalRooms;
  final int totalSections;
  final Overview overview;
  final SystemHealth systemHealth;

  DashboardStats({
    required this.totalFaculty,
    required this.totalSubjects,
    required this.totalRooms,
    required this.totalSections,
    required this.overview,
    required this.systemHealth,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalFaculty: json['totalFaculty'] ?? 0,
      totalSubjects: json['totalSubjects'] ?? 0,
      totalRooms: json['totalRooms'] ?? 0,
      totalSections: json['totalSections'] ?? 0,
      overview: Overview.fromJson(json['overview'] ?? {}),
      systemHealth: SystemHealth.fromJson(json['systemHealth'] ?? {}),
    );
  }
}

class Overview {
  final int totalFaculty;
  final int totalDepartments;
  final int totalRooms;
  final int totalSections;
  final int totalSubjects;
  final int totalClasses;
  final int activeAnnouncements;

  Overview({
    required this.totalFaculty,
    required this.totalDepartments,
    required this.totalRooms,
    required this.totalSections,
    required this.totalSubjects,
    required this.totalClasses,
    required this.activeAnnouncements,
  });

  factory Overview.fromJson(Map<String, dynamic> json) {
    return Overview(
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
  final String apiStatus;

  SystemHealth({required this.apiStatus});

  factory SystemHealth.fromJson(Map<String, dynamic> json) {
    return SystemHealth(
      apiStatus: json['apiStatus'] ?? 'operational',
    );
  }
}

class RoomUtilization {
  final String roomNumber;
  final String room;
  final double utilizationPercentage;
  final String utilizationPercent;
  final int totalHours;
  final int usedHours;
  final int weeklyHours;
  final String status;
  final String type;
  final int capacity;

  RoomUtilization({
    required this.roomNumber,
    required this.room,
    required this.utilizationPercentage,
    required this.utilizationPercent,
    required this.totalHours,
    required this.usedHours,
    required this.weeklyHours,
    required this.status,
    required this.type,
    required this.capacity,
  });

  factory RoomUtilization.fromJson(Map<String, dynamic> json) {
    return RoomUtilization(
      roomNumber: json['roomNumber'] ?? '',
      room: json['room'] ?? json['roomNumber'] ?? '',
      utilizationPercentage: (json['utilizationPercentage'] ?? 0).toDouble(),
      utilizationPercent: json['utilizationPercent'] ?? '0',
      totalHours: json['totalHours'] ?? 0,
      usedHours: json['usedHours'] ?? 0,
      weeklyHours: json['weeklyHours'] ?? 0,
      status: json['status'] ?? 'available',
      type: json['type'] ?? 'classroom',
      capacity: json['capacity'] ?? 0,
    );
  }
}

class FacultyWorkload {
  final String facultyName;
  final String name;
  final int totalClasses;
  final int totalHours;
  final int weeklyHours;
  final int maxWeeklyHours;
  final String department;
  final String loadStatus;
  final double utilizationPercent;
  final bool onLeave;

  FacultyWorkload({
    required this.facultyName,
    required this.name,
    required this.totalClasses,
    required this.totalHours,
    required this.weeklyHours,
    required this.maxWeeklyHours,
    required this.department,
    required this.loadStatus,
    required this.utilizationPercent,
    required this.onLeave,
  });

  factory FacultyWorkload.fromJson(Map<String, dynamic> json) {
    return FacultyWorkload(
      facultyName: json['facultyName'] ?? '',
      name: json['name'] ?? json['facultyName'] ?? '',
      totalClasses: json['totalClasses'] ?? 0,
      totalHours: json['totalHours'] ?? 0,
      weeklyHours: json['weeklyHours'] ?? 0,
      maxWeeklyHours: json['maxWeeklyHours'] ?? 40,
      department: json['department'] ?? '',
      loadStatus: json['loadStatus'] ?? 'normal',
      utilizationPercent: (json['utilizationPercent'] ?? 0).toDouble(),
      onLeave: json['onLeave'] ?? false,
    );
  }
}