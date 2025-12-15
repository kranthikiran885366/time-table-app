class Section {
  final String? id;
  final String sectionCode;
  final String name;
  final String department;
  final int year;
  final int semester;
  final int strength;
  final String? academicYear;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Section({
    this.id,
    required this.sectionCode,
    required this.name,
    required this.department,
    required this.year,
    required this.semester,
    this.strength = 60,
    this.academicYear,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory Section.fromJson(Map<String, dynamic> json) {
    return Section(
      id: json['_id'],
      sectionCode: json['sectionCode'] ?? '',
      name: json['name'] ?? '',
      department: json['department'] ?? '',
      year: json['year'] ?? 1,
      semester: json['semester'] ?? 1,
      strength: json['strength'] ?? 60,
      academicYear: json['academicYear'],
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'sectionCode': sectionCode,
      'name': name,
      'department': department,
      'year': year,
      'semester': semester,
      'strength': strength,
      'academicYear': academicYear,
      'isActive': isActive,
    };
  }
}
