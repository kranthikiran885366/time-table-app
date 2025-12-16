import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/section.dart';
import 'room_details_screen.dart';
import 'section_timetable_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _roomController = TextEditingController();
  List<Section> _sections = [];
  Section? _selectedSection;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSections();
  }

  Future<void> _loadSections() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final sections = await ApiService.getSections();
      if (mounted) {
        setState(() {
          _sections = sections;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        final errorMessage = e.toString();
        if (errorMessage.contains('401') || errorMessage.contains('Authentication')) {
          // Navigate back to login
          Navigator.of(context).pushReplacementNamed('/login');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please login to continue')),
          );
        } else {
          setState(() {
            _error = errorMessage;
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Timetable System', style: TextStyle(fontSize: 18)),
            StreamBuilder(
              stream: Stream.periodic(Duration(seconds: 1)),
              builder: (context, snapshot) {
                final now = DateTime.now();
                return Text(
                  '${now.day}/${now.month}/${now.year} ${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.normal),
                );
              },
            ),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Search by Room Number',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 18),
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _roomController,
                      decoration: InputDecoration(
                        labelText: 'Room Number',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.room),
                      ),
                    ),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => _searchRoom(),
                      child: Text('Search Room'),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 20),
            Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Search by Section',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    SizedBox(height: 16),
                    if (_isLoading)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (_error != null)
                      Container(
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.error, color: Colors.red),
                                SizedBox(width: 8),
                                Text(
                                  'Failed to load sections',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red.shade900,
                                  ),
                                ),
                                Spacer(),
                                IconButton(
                                  icon: Icon(Icons.refresh),
                                  onPressed: _loadSections,
                                  tooltip: 'Retry',
                                ),
                              ],
                            ),
                            SizedBox(height: 4),
                            Text(
                              _error!.replaceAll('Exception: ', ''),
                              style: TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      )
                    else
                      DropdownButtonFormField<Section>(
                        value: _selectedSection,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: 'Select Section',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.class_),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                        ),
                        items: _sections.map((section) {
                          return DropdownMenuItem(
                            value: section,
                            child: Text(
                              '${section.name} - ${section.department}',
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          );
                        }).toList(),
                        onChanged: (section) {
                          setState(() {
                            _selectedSection = section;
                          });
                        },
                      ),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _selectedSection != null ? () => _searchSection() : null,
                      child: Text('View Timetable'),
                    ),
                  ],
                ),
              ),
            ),
          ],
          ),
        ),
      ),
    );
  }

  void _searchRoom() {
    final roomNo = _roomController.text.trim();
    
    if (roomNo.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a room number'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    // Basic validation - room numbers should be alphanumeric
    if (!RegExp(r'^[a-zA-Z0-9\-]+$').hasMatch(roomNo)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid room number format'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RoomDetailsScreen(roomNumber: roomNo),
      ),
    );
  }

  void _searchSection() {
    if (_selectedSection != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => SectionTimetableScreen(section: _selectedSection!),
        ),
      );
    }
  }
}