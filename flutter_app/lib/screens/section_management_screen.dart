import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../models/section.dart';

class SectionManagementScreen extends StatefulWidget {
  const SectionManagementScreen({Key? key}) : super(key: key);

  @override
  State<SectionManagementScreen> createState() => _SectionManagementScreenState();
}

class _SectionManagementScreenState extends State<SectionManagementScreen> {
  List<Section> _sections = [];
  List<Section> _filteredSections = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSections();
    _searchController.addListener(_filterSections);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterSections() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredSections = _sections.where((section) {
        return section.sectionCode.toLowerCase().contains(query) ||
               section.name.toLowerCase().contains(query) ||
               section.department.toLowerCase().contains(query);
      }).toList();
    });
  }

  Future<void> _loadSections() async {
    setState(() => _isLoading = true);
    try {
      final sections = await ApiService.getSections();
      setState(() {
        _sections = sections;
        _filteredSections = sections;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _showSectionDialog({Section? section}) async {
    final codeController = TextEditingController(text: section?.sectionCode ?? '');
    final nameController = TextEditingController(text: section?.name ?? '');
    final deptController = TextEditingController(text: section?.department ?? '');
    final yearController = TextEditingController(text: section?.year.toString() ?? '1');
    final semesterController = TextEditingController(text: section?.semester.toString() ?? '1');
    final strengthController = TextEditingController(text: section?.strength.toString() ?? '60');
    final academicYearController = TextEditingController(text: section?.academicYear ?? '');
    bool isActive = section?.isActive ?? true;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(section == null ? 'Add Section' : 'Edit Section'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: codeController,
                  decoration: const InputDecoration(
                    labelText: 'Section Code *',
                    hintText: 'e.g., SEC1, CSE-A',
                  ),
                  textCapitalization: TextCapitalization.characters,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Section Name *',
                    hintText: 'e.g., Computer Science - Section A',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: deptController,
                  decoration: const InputDecoration(
                    labelText: 'Department *',
                    hintText: 'e.g., Computer Science',
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: yearController,
                        decoration: const InputDecoration(
                          labelText: 'Year *',
                          hintText: '1-4',
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(1),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: semesterController,
                        decoration: const InputDecoration(
                          labelText: 'Semester *',
                          hintText: '1-8',
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(1),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: strengthController,
                  decoration: const InputDecoration(
                    labelText: 'Strength',
                    hintText: 'Number of students',
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: academicYearController,
                  decoration: const InputDecoration(
                    labelText: 'Academic Year',
                    hintText: 'e.g., 2024-2025',
                  ),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Active'),
                  value: isActive,
                  onChanged: (value) {
                    setDialogState(() {
                      isActive = value;
                    });
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (codeController.text.isEmpty ||
                    nameController.text.isEmpty ||
                    deptController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please fill required fields')),
                  );
                  return;
                }

                try {
                  final data = {
                    'sectionCode': codeController.text.toUpperCase(),
                    'name': nameController.text,
                    'department': deptController.text,
                    'year': int.tryParse(yearController.text) ?? 1,
                    'semester': int.tryParse(semesterController.text) ?? 1,
                    'strength': int.tryParse(strengthController.text) ?? 60,
                    'academicYear': academicYearController.text,
                    'isActive': isActive,
                  };

                  if (section == null) {
                    await ApiService.createSection(data);
                  } else {
                    await ApiService.updateSection(section.id!, data);
                  }

                  Navigator.pop(context);
                  _loadSections();
                  
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Section ${section == null ? 'created' : 'updated'} successfully')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                }
              },
              child: Text(section == null ? 'Add' : 'Save'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteSection(Section section) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Section'),
        content: Text('Are you sure you want to delete ${section.sectionCode}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ApiService.deleteSection(section.id!);
        _loadSections();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Section deleted successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _showBulkCreateDialog() async {
    final prefixController = TextEditingController(text: 'SEC');
    final startController = TextEditingController(text: '1');
    final endController = TextEditingController(text: '19');
    final nameTemplateController = TextEditingController(text: 'Section {N}');
    final deptController = TextEditingController(text: 'Computer Science');
    final yearController = TextEditingController(text: '1');
    final semesterController = TextEditingController(text: '1');
    final strengthController = TextEditingController(text: '60');
    final academicYearController = TextEditingController(text: '2024-2025');

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Bulk Create Sections'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'This will create multiple sections at once.\nExample: SEC1, SEC2, ..., SEC19',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: prefixController,
                decoration: const InputDecoration(
                  labelText: 'Prefix',
                  hintText: 'SEC, CSE-A, etc.',
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: startController,
                      decoration: const InputDecoration(labelText: 'Start'),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Text('to'),
                  ),
                  Expanded(
                    child: TextField(
                      controller: endController,
                      decoration: const InputDecoration(labelText: 'End'),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameTemplateController,
                decoration: const InputDecoration(
                  labelText: 'Name Template',
                  hintText: 'Use {N} for number',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: deptController,
                decoration: const InputDecoration(labelText: 'Department'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: yearController,
                      decoration: const InputDecoration(labelText: 'Year'),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: semesterController,
                      decoration: const InputDecoration(labelText: 'Semester'),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: strengthController,
                decoration: const InputDecoration(labelText: 'Strength'),
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: academicYearController,
                decoration: const InputDecoration(labelText: 'Academic Year'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                final prefix = prefixController.text;
                final start = int.parse(startController.text);
                final end = int.parse(endController.text);
                final nameTemplate = nameTemplateController.text;

                if (start > end) {
                  throw Exception('Start must be less than or equal to End');
                }

                Navigator.pop(context);
                
                // Show progress dialog
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) => const AlertDialog(
                    content: Row(
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(width: 16),
                        Text('Creating sections...'),
                      ],
                    ),
                  ),
                );

                int created = 0;
                int failed = 0;

                for (int i = start; i <= end; i++) {
                  try {
                    final sectionCode = '$prefix$i';
                    final name = nameTemplate.replaceAll('{N}', i.toString());
                    
                    final data = {
                      'sectionCode': sectionCode.toUpperCase(),
                      'name': name,
                      'department': deptController.text,
                      'year': int.tryParse(yearController.text) ?? 1,
                      'semester': int.tryParse(semesterController.text) ?? 1,
                      'strength': int.tryParse(strengthController.text) ?? 60,
                      'academicYear': academicYearController.text,
                      'isActive': true,
                    };

                    await ApiService.createSection(data);
                    created++;
                  } catch (e) {
                    failed++;
                  }
                }

                Navigator.pop(context); // Close progress dialog
                _loadSections();

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Created $created sections, $failed failed'),
                      duration: const Duration(seconds: 3),
                    ),
                  );
                }
              } catch (e) {
                Navigator.pop(context);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Section Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSections,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search sections...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
          
          // Stats
          if (!_isLoading && _sections.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total: ${_sections.length} sections',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(
                    'Active: ${_sections.where((s) => s.isActive).length}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 8),
          
          // List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredSections.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.folder_open, size: 64, color: Colors.grey),
                            const SizedBox(height: 16),
                            Text(
                              _sections.isEmpty 
                                  ? 'No sections yet' 
                                  : 'No matching sections',
                              style: const TextStyle(fontSize: 18, color: Colors.grey),
                            ),
                            if (_sections.isEmpty) ...[
                              const SizedBox(height: 8),
                              const Text(
                                'Create sections before uploading timetables',
                                style: TextStyle(fontSize: 14, color: Colors.grey),
                              ),
                            ],
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadSections,
                        child: ListView.builder(
                          itemCount: _filteredSections.length,
                          itemBuilder: (context, index) {
                            final section = _filteredSections[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: section.isActive 
                                      ? Colors.green 
                                      : Colors.grey,
                                  child: Text(
                                    section.sectionCode.substring(0, 1),
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                                title: Text(
                                  section.sectionCode,
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(section.name),
                                    Text(
                                      '${section.department} • Year ${section.year} • Sem ${section.semester}',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    if (section.academicYear != null)
                                      Text(
                                        'AY: ${section.academicYear}',
                                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                                      ),
                                  ],
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit, size: 20),
                                      onPressed: () => _showSectionDialog(section: section),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                                      onPressed: () => _deleteSection(section),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            onPressed: _showBulkCreateDialog,
            heroTag: 'bulk',
            child: const Icon(Icons.add_box),
          ),
          const SizedBox(height: 12),
          FloatingActionButton(
            onPressed: () => _showSectionDialog(),
            heroTag: 'single',
            child: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}
