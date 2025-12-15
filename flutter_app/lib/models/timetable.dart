class Faculty {
  final String id;
  final String name;
  final String department;
  final String email;

  Faculty({required this.id, required this.name, required this.department, required this.email});

  factory Faculty.fromJson(Map<String, dynamic> json) {
    return Faculty(
      id: json['_id'],
      name: json['name'],
      department: json['department'],
      email: json['email'],
    );
  }
}

class Subject {
  final String id;
  final String name;
  final String code;
  final String department;
  final int semester;

  Subject({required this.id, required this.name, required this.code, required this.department, required this.semester});

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['_id'],
      name: json['name'],
      code: json['code'],
      department: json['department'],
      semester: json['semester'],
    );
  }
}

class Room {
  final String id;
  final String number;
  final String block;
  final int capacity;
  final String type;

  Room({required this.id, required this.number, required this.block, required this.capacity, required this.type});

  factory Room.fromJson(Map<String, dynamic> json) {
    return Room(
      id: json['_id'],
      number: json['number'],
      block: json['block'],
      capacity: json['capacity'],
      type: json['type'],
    );
  }
}

class TimetableSection {
  final String id;
  final String name;
  final String department;
  final int year;
  final int semester;

  TimetableSection({required this.id, required this.name, required this.department, required this.year, required this.semester});

  factory TimetableSection.fromJson(Map<String, dynamic> json) {
    return TimetableSection(
      id: json['_id'],
      name: json['name'],
      department: json['department'],
      year: json['year'],
      semester: json['semester'],
    );
  }
}

class TimetableEntry {
  final String id;
  final String day;
  final String startTime;
  final String endTime;
  final Room room;
  final Faculty faculty;
  final Subject subject;
  final List<TimetableSection> sections;
  final String classType;
  final String status;

  TimetableEntry({
    required this.id,
    required this.day,
    required this.startTime,
    required this.endTime,
    required this.room,
    required this.faculty,
    required this.subject,
    required this.sections,
    required this.classType,
    required this.status,
  });

  factory TimetableEntry.fromJson(Map<String, dynamic> json) {
    return TimetableEntry(
      id: json['_id'],
      day: json['day'],
      startTime: json['startTime'],
      endTime: json['endTime'],
      room: Room.fromJson(json['roomId']),
      faculty: Faculty.fromJson(json['facultyId']),
      subject: Subject.fromJson(json['subjectId']),
      sections: (json['sections'] as List).map((s) => TimetableSection.fromJson(s)).toList(),
      classType: json['classType'],
      status: json['status'],
    );
  }
}