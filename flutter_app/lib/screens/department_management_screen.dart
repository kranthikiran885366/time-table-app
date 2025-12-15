import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/department.dart';

class DepartmentManagementScreen extends StatefulWidget {
  const DepartmentManagementScreen({Key? key}) : super(key: key);

  @override
  State<DepartmentManagementScreen> createState() => _DepartmentManagementScreenState();
}

class _DepartmentManagementScreenState extends State<DepartmentManagementScreen> {
  List<Department> _departments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDepartments();
  }

  Future<void> _loadDepartments() async {
    setState(() => _isLoading = true);
    try {
      final departments = await ApiService.getDepartments();
      setState(() {
        _departments = departments;
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

  Future<void> _showDepartmentDialog({Department? department}) async {
    final nameController = TextEditingController(text: department?.name ?? '');
    final codeController = TextEditingController(text: department?.code ?? '');
    final descController = TextEditingController(text: department?.description ?? '');
    final buildingController = TextEditingController(text: department?.building ?? '');
    final floorController = TextEditingController(text: department?.floor ?? '');
    final emailController = TextEditingController(text: department?.contactEmail ?? '');
    final phoneController = TextEditingController(text: department?.contactPhone ?? '');

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(department == null ? 'Add Department' : 'Edit Department'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              TextField(
                controller: codeController,
                decoration: const InputDecoration(labelText: 'Code'),
              ),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 2,
              ),
              TextField(
                controller: buildingController,
                decoration: const InputDecoration(labelText: 'Building'),
              ),
              TextField(
                controller: floorController,
                decoration: const InputDecoration(labelText: 'Floor'),
              ),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
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
              final data = {
                'name': nameController.text,
                'code': codeController.text,
                'description': descController.text,
                'building': buildingController.text,
                'floor': floorController.text,
                'contactEmail': emailController.text,
                'contactPhone': phoneController.text,
              };

              try {
                if (department == null) {
                  await ApiService.createDepartment(data);
                } else {
                  await ApiService.updateDepartment(department.id, data);
                }
                if (mounted) {
                  Navigator.pop(context);
                  _loadDepartments();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Department Management'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showDepartmentDialog(),
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDepartments,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _departments.length,
                itemBuilder: (context, index) {
                  final dept = _departments[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        child: Text(dept.code.substring(0, 2)),
                      ),
                      title: Text(dept.name),
                      subtitle: Text('Code: ${dept.code}\n${dept.description}'),
                      isThreeLine: true,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: () => _showDepartmentDialog(department: dept),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Confirm Delete'),
                                  content: Text('Delete ${dept.name}?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context, false),
                                      child: const Text('Cancel'),
                                    ),
                                    ElevatedButton(
                                      onPressed: () => Navigator.pop(context, true),
                                      child: const Text('Delete'),
                                    ),
                                  ],
                                ),
                              );

                              if (confirm == true) {
                                try {
                                  await ApiService.deleteDepartment(dept.id);
                                  _loadDepartments();
                                } catch (e) {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Error: $e')),
                                    );
                                  }
                                }
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
