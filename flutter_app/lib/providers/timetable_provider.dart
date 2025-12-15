import 'package:flutter/material.dart';
import '../models/timetable.dart';
import '../services/api_service.dart';

class TimetableProvider with ChangeNotifier {
  List<TimetableEntry> _timetable = [];
  TimetableEntry? _currentClass;
  TimetableEntry? _nextClass;
  bool _isLoading = false;
  String _error = '';

  List<TimetableEntry> get timetable => _timetable;
  TimetableEntry? get currentClass => _currentClass;
  TimetableEntry? get nextClass => _nextClass;
  bool get isLoading => _isLoading;
  String get error => _error;

  Future<void> searchByRoom(String roomNo) async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final data = await ApiService.searchByRoom(roomNo);
      
      _currentClass = data['currentClass'] != null 
          ? TimetableEntry.fromJson(data['currentClass']) 
          : null;
      
      _nextClass = data['nextClass'] != null 
          ? TimetableEntry.fromJson(data['nextClass']) 
          : null;
      
      _timetable = (data['todayClasses'] as List)
          .map((json) => TimetableEntry.fromJson(json))
          .toList();
      
    } catch (e) {
      String errorMsg = e.toString().replaceAll('Exception: ', '');
      if (errorMsg.contains('404') || errorMsg.contains('not found')) {
        _error = 'Room "$roomNo" not found or has no classes scheduled today.';
      } else if (errorMsg.contains('Network')) {
        _error = 'Cannot connect to server. Please check your connection.';
      } else {
        _error = errorMsg;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> searchBySection(String sectionId, String type) async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final data = await ApiService.searchBySection(sectionId, type);
      
      _currentClass = data['currentClass'] != null 
          ? TimetableEntry.fromJson(data['currentClass']) 
          : null;
      
      _timetable = (data['timetable'] as List)
          .map((json) => TimetableEntry.fromJson(json))
          .toList();
      
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearData() {
    _timetable = [];
    _currentClass = null;
    _nextClass = null;
    _error = '';
    notifyListeners();
  }
}