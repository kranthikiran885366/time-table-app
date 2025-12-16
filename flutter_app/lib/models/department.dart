class Department {
  final String id;
  final String name;
  final String code;
  final String description;
  final String building;
  final String floor;
  final String contactEmail;
  final String contactPhone;

  Department({
    required this.id,
    required this.name,
    required this.code,
    required this.description,
    required this.building,
    required this.floor,
    required this.contactEmail,
    required this.contactPhone,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'] ?? '',
      building: json['building'] ?? '',
      floor: json['floor'] ?? '',
      contactEmail: json['contactEmail'] ?? '',
      contactPhone: json['contactPhone'] ?? '',
    );
  }
}