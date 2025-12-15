class Department {
  final String id;
  final String name;
  final String code;
  final String? hodId;
  final String? hodName;
  final String description;
  final String building;
  final String floor;
  final String contactEmail;
  final String contactPhone;
  final int? establishedYear;
  final int totalFaculty;
  final int totalStudents;
  final bool isActive;

  Department({
    required this.id,
    required this.name,
    required this.code,
    this.hodId,
    this.hodName,
    this.description = '',
    this.building = '',
    this.floor = '',
    this.contactEmail = '',
    this.contactPhone = '',
    this.establishedYear,
    this.totalFaculty = 0,
    this.totalStudents = 0,
    this.isActive = true,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['_id'],
      name: json['name'],
      code: json['code'],
      hodId: json['hodId']?['_id'],
      hodName: json['hodId']?['name'],
      description: json['description'] ?? '',
      building: json['building'] ?? '',
      floor: json['floor'] ?? '',
      contactEmail: json['contactEmail'] ?? '',
      contactPhone: json['contactPhone'] ?? '',
      establishedYear: json['establishedYear'],
      totalFaculty: json['totalFaculty'] ?? 0,
      totalStudents: json['totalStudents'] ?? 0,
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'code': code,
      'hodId': hodId,
      'description': description,
      'building': building,
      'floor': floor,
      'contactEmail': contactEmail,
      'contactPhone': contactPhone,
      'establishedYear': establishedYear,
      'totalFaculty': totalFaculty,
      'totalStudents': totalStudents,
      'isActive': isActive,
    };
  }
}
