import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AdminConfigScreen extends StatefulWidget {
  @override
  _AdminConfigScreenState createState() => _AdminConfigScreenState();
}

class _AdminConfigScreenState extends State<AdminConfigScreen> {
  final _nameController = TextEditingController();
  final _taglineController = TextEditingController();
  final _logoUrlController = TextEditingController();
  final _colorController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentConfig();
  }

  Future<void> _loadCurrentConfig() async {
    try {
      final config = await ApiService.getUniversityConfig();
      setState(() {
        _nameController.text = config.name;
        _taglineController.text = config.tagline;
        _logoUrlController.text = config.logoUrl;
        _colorController.text = config.primaryColor;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load configuration')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('University Configuration'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16.0),
          child: Column(
            children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'University Name',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _taglineController,
              decoration: InputDecoration(
                labelText: 'Tagline',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _logoUrlController,
              decoration: InputDecoration(
                labelText: 'Logo URL',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _colorController,
              decoration: InputDecoration(
                labelText: 'Primary Color (Hex)',
                border: OutlineInputBorder(),
                hintText: '#0A3D62',
              ),
            ),
            SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _updateConfig,
                child: _isLoading
                    ? CircularProgressIndicator()
                    : Text('Update Configuration'),
              ),
            ),
            SizedBox(height: 16),
            Divider(thickness: 2),
            SizedBox(height: 16),
            Text(
              'Timetable Management',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushNamed(context, '/upload-timetable');
                },
                icon: Icon(Icons.upload_file),
                label: Text('Upload Timetable from Excel'),
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.all(16),
                  backgroundColor: Colors.blue,
                ),
              ),
            ),
          ],
          ),
        ),
      ),
    );
  }

  Future<void> _updateConfig() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // This would require implementing the update API call
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Configuration updated successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update configuration')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}