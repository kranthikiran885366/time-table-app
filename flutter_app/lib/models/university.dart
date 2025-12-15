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
      name: json['name'],
      tagline: json['tagline'],
      logoUrl: json['logoUrl'],
      primaryColor: json['primaryColor'],
    );
  }
}