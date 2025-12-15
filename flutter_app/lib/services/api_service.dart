import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/timetable.dart';
import '../models/university.dart';
import '../models/department.dart';
import '../models/section.dart';
import '../models/announcement.dart';
import '../models/activity_log.dart';
import '../models/analytics.dart';

class ApiService {
  // Backend URL Configuration
  // For development (localhost):
  // static const String baseUrl = 'http://localhost:5000/api';
  
  // For production APK:
  static const String baseUrl = 'https://time-table-app-exrd.onrender.com/api';
  
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, String>> getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      return data;
    } else {
      throw Exception('Login failed');
    }
  }

  static Future<Map<String, dynamic>> searchByRoom(String roomNo) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/room/$roomNo/current'),
        headers: await getHeaders(),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Request timed out');
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 404) {
        throw Exception('Room not found or no current class');
      } else if (response.statusCode == 401) {
        throw Exception('Authentication required. Please login.');
      } else {
        throw Exception('Failed to search room (Status: ${response.statusCode})');
      }
    } on http.ClientException {
      throw Exception('Network error: Cannot connect to server');
    } catch (e) {
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> searchBySection(String sectionId, String type) async {
    final response = await http.get(
      Uri.parse('$baseUrl/section/$sectionId/$type'),
      headers: await getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to search section');
    }
  }

  static Future<List<Room>> getRooms() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/room'),
        headers: await getHeaders(),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Request timed out');
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Room.fromJson(json)).toList();
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        throw Exception('Authentication required. Please login.');
      } else {
        throw Exception('Failed to load rooms (Status: ${response.statusCode})');
      }
    } on http.ClientException {
      throw Exception('Network error: Cannot connect to server');
    } catch (e) {
      rethrow;
    }
  }

  static Future<UniversityConfig> getUniversityConfig() async {
    final response = await http.get(
      Uri.parse('$baseUrl/university/config'),
    );

    if (response.statusCode == 200) {
      return UniversityConfig.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load university config');
    }
  }

  // Upload timetable from Excel file
  Future<Map<String, dynamic>> uploadTimetable({
    required List<int> fileBytes,
    required String fileName,
    bool dryRun = false,
    String mode = 'replace',
  }) async {
    try {
      final token = await getToken();
      
      if (token == null || token.isEmpty) {
        throw Exception('Authentication required. Please login again.');
      }
      
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/upload/timetable'),
      );
      
      request.headers['Authorization'] = 'Bearer $token';
      
      request.fields['dryRun'] = dryRun.toString();
      request.fields['mode'] = mode;
      
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
        ),
      );
      
      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw Exception('Upload timed out. Please try with a smaller file.');
        },
      );
      
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200 || response.statusCode == 400) {
        // Both success and validation errors return JSON
        try {
          final jsonResponse = jsonDecode(response.body);
          return jsonResponse ?? {'success': false, 'message': 'Empty response from server', 'errorCode': 'EMPTY_RESPONSE'};
        } catch (e) {
          throw Exception('Invalid response format from server: ${response.body.substring(0, 100)}');
        }
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        throw Exception('Authentication failed. Please login again.');
      } else if (response.statusCode == 413) {
        throw Exception('File too large. Maximum size is 5MB.');
      } else if (response.statusCode == 500) {
        try {
          final body = jsonDecode(response.body);
          throw Exception(body['message'] ?? 'Server error occurred');
        } catch (_) {
          throw Exception('Server error: ${response.body.substring(0, 100)}');
        }
      } else {
        throw Exception('Upload failed with status ${response.statusCode}: ${response.body}');
      }
    } on http.ClientException catch (e) {
      throw Exception('Network error: ${e.message}');
    } on FormatException catch (_) {
      throw Exception('Invalid response format from server');
    } catch (e) {
      rethrow;
    }
  }

  // Download timetable template
  Future<List<int>> downloadTimetableTemplate() async {
    try {
      final token = await getToken();
      
      if (token == null || token.isEmpty) {
        throw Exception('Authentication required. Please login again.');
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/upload/template'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Download timed out. Please try again.');
        },
      );
      
      if (response.statusCode == 200) {
        if (response.bodyBytes.isEmpty) {
          throw Exception('Received empty file from server');
        }
        return response.bodyBytes;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        throw Exception('Authentication failed. Please login again.');
      } else if (response.statusCode == 404) {
        throw Exception('Template not found on server');
      } else if (response.statusCode == 500) {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'Server error occurred');
      } else {
        throw Exception('Failed to download template (Status: ${response.statusCode})');
      }
    } on http.ClientException catch (e) {
      throw Exception('Network error: ${e.message}');
    } catch (e) {
      rethrow;
    }
  }

  // ============ DEPARTMENT ENDPOINTS ============
  
  static Future<List<Department>> getDepartments() async {
    final response = await http.get(
      Uri.parse('$baseUrl/department'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Department.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load departments');
    }
  }

  static Future<Department> createDepartment(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/department'),
      headers: await getHeaders(),
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 201) {
      return Department.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to create department');
    }
  }

  static Future<Department> updateDepartment(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/department/$id'),
      headers: await getHeaders(),
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200) {
      return Department.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update department');
    }
  }

  static Future<void> deleteDepartment(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/department/$id'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to delete department');
    }
  }

  // ============ SECTION ENDPOINTS ============
  
  static Future<List<Section>> getSections() async {
    final response = await http.get(
      Uri.parse('$baseUrl/section'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Section.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load sections');
    }
  }

  static Future<Section> createSection(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/section'),
      headers: await getHeaders(),
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 201) {
      return Section.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to create section');
    }
  }

  static Future<Section> updateSection(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/section/$id'),
      headers: await getHeaders(),
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200) {
      return Section.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update section');
    }
  }

  static Future<void> deleteSection(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/section/$id'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to delete section');
    }
  }

  // ============ ANNOUNCEMENT ENDPOINTS ============
  
  static Future<List<Announcement>> getAnnouncements({String? targetAudience}) async {
    String url = '$baseUrl/announcement';
    if (targetAudience != null) {
      url += '?targetAudience=$targetAudience';
    }
    
    final response = await http.get(
      Uri.parse(url),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Announcement.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load announcements');
    }
  }

  static Future<Announcement> createAnnouncement(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/announcement'),
      headers: await getHeaders(),
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 201) {
      return Announcement.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create announcement');
    }
  }

  static Future<Announcement> updateAnnouncement(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/announcement/$id'),
      headers: await getHeaders(),
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200) {
      return Announcement.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update announcement');
    }
  }

  static Future<void> deleteAnnouncement(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/announcement/$id'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete announcement');
    }
  }

  static Future<void> toggleAnnouncementPin(String id) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/announcement/$id/pin'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to toggle pin');
    }
  }

  // ============ ACTIVITY LOG ENDPOINTS ============
  
  static Future<Map<String, dynamic>> getActivityLogs({
    String? userId,
    String? action,
    String? entity,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (userId != null) queryParams['userId'] = userId;
    if (action != null) queryParams['action'] = action;
    if (entity != null) queryParams['entity'] = entity;
    
    final uri = Uri.parse('$baseUrl/activity-log').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: await getHeaders());
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'logs': (data['logs'] as List).map((json) => ActivityLog.fromJson(json)).toList(),
        'pagination': data['pagination'],
      };
    } else {
      throw Exception('Failed to load activity logs');
    }
  }

  // ============ ANALYTICS ENDPOINTS ============
  
  static Future<DashboardStats> getDashboardStats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/dashboard'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return DashboardStats.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load dashboard stats');
    }
  }

  static Future<Map<String, dynamic>> getRoomUtilization() async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/room-utilization'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'rooms': (data['rooms'] as List).map((json) => RoomUtilization.fromJson(json)).toList(),
        'summary': data['summary'],
      };
    } else {
      throw Exception('Failed to load room utilization');
    }
  }

  static Future<Map<String, dynamic>> getFacultyWorkload() async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/faculty-workload'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'faculty': (data['faculty'] as List).map((json) => FacultyWorkload.fromJson(json)).toList(),
        'summary': data['summary'],
      };
    } else {
      throw Exception('Failed to load faculty workload');
    }
  }

  static Future<List<dynamic>> getDepartmentAnalytics() async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/department-wise'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List;
    } else {
      throw Exception('Failed to load department analytics');
    }
  }

  static Future<Map<String, dynamic>> getConflictReport() async {
    final response = await http.get(
      Uri.parse('$baseUrl/analytics/conflicts'),
      headers: await getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load conflict report');
    }
  }

  // ============ AUTH ENDPOINTS ============
  
  static Future<void> changePassword(String currentPassword, String newPassword) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/change-password'),
      headers: await getHeaders(),
      body: jsonEncode({
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );
    
    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to change password');
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }
}