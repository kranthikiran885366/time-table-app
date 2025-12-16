class UniversityConfig {
  final String name;
  final String tagline;
  final String logoUrl;
  final String primaryColor;

  UniversityConfig({
    required this.name,
    required this.tagline,
    required this.logoUrl,
    required this.primaryColor,
  });

  factory UniversityConfig.fromJson(Map<String, dynamic> json) {
    return UniversityConfig(
      name: json['name'] ?? 'Timetable Management',
      tagline: json['tagline'] ?? 'Manage your schedule efficiently',
      logoUrl: json['logoUrl'] ?? '',
      primaryColor: json['primaryColor'] ?? '#673AB7',
    );
  }
}