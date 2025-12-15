import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:typed_data';
import '../services/api_service.dart';

class TimetableUploadScreen extends StatefulWidget {
  const TimetableUploadScreen({Key? key}) : super(key: key);

  @override
  State<TimetableUploadScreen> createState() => _TimetableUploadScreenState();
}

class _TimetableUploadScreenState extends State<TimetableUploadScreen> {
  final ApiService _apiService = ApiService();
  
  String? _fileName;
  Uint8List? _fileBytes;
  bool _isUploading = false;
  bool _isDownloading = false;
  bool _isDryRun = true;
  String _uploadMode = 'replace'; // 'replace' or 'merge'
  
  Map<String, dynamic>? _uploadResult;
  bool _showResults = false;
  String? _uploadProgress;

  Future<void> _pickFile() async {
    try {
      setState(() {
        _uploadProgress = 'Opening file picker...';
      });

      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'xls', 'xlsm', 'xlsb', 'xltx', 'xltm'],
        withData: true,
      );

      setState(() {
        _uploadProgress = null;
      });

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          _showErrorDialog(
            'File Too Large',
            'The selected file exceeds the 5MB size limit. Please choose a smaller file.',
          );
          return;
        }

        if (file.size == 0) {
          _showErrorDialog(
            'Empty File',
            'The selected file is empty. Please choose a valid Excel file.',
          );
          return;
        }

        setState(() {
          _fileName = file.name;
          _fileBytes = file.bytes;
          _showResults = false;
          _uploadResult = null;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('Selected: $_fileName (${_formatFileSize(file.size)})'),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _uploadProgress = null;
      });
      _showErrorDialog(
        'File Selection Error',
        'Failed to select file: ${e.toString()}',
      );
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.error, color: Colors.red),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.green),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadFile() async {
    if (_fileBytes == null) {
      _showErrorDialog(
        'No File Selected',
        'Please select an Excel file before uploading.',
      );
      return;
    }

    // Show confirmation for non-dry-run uploads
    if (!_isDryRun) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Confirm Upload'),
          content: Text(
            _uploadMode == 'replace'
                ? 'This will DELETE all existing timetable entries for the sections in this file and replace them with new data. Continue?'
                : 'This will ADD new timetable entries while keeping existing ones. Duplicates may occur. Continue?'
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Confirm'),
            ),
          ],
        ),
      );
      
      if (confirmed != true) return;
    }

    setState(() {
      _isUploading = true;
      _uploadResult = null;
      _uploadProgress = _isDryRun ? 'Validating timetable...' : 'Uploading timetable...';
    });

    try {
      setState(() {
        _uploadProgress = 'Parsing Excel file...';
      });

      final result = await _apiService.uploadTimetable(
        fileBytes: _fileBytes!,
        fileName: _fileName!,
        dryRun: _isDryRun,
        mode: _uploadMode,
      );

      setState(() {
        _uploadResult = result;
        _showResults = true;
        _uploadProgress = null;
      });

      if (result['success'] == true) {
        final summary = result['summary'] ?? {};
        final saved = result['saved'] ?? {};
        final message = _isDryRun 
          ? '✅ Validation successful!\n\nTotal: ${summary['totalEntries'] ?? 0} entries\nValid: ${summary['validEntries'] ?? 0}\nReady to upload.'
          : '✅ Upload successful!\n\nInserted: ${saved['inserted'] ?? 0}\nDeleted: ${saved['deleted'] ?? 0}\nFailed: ${saved['failed'] ?? 0}';
        
        _showSuccessDialog(
          _isDryRun ? 'Validation Complete' : 'Upload Complete',
          message,
        );
      } else {
        final errorCode = result['errorCode'] ?? 'UNKNOWN';
        final hint = result['hint'] ?? '';
        final message = result['message'] ?? 'Upload failed';
        
        _showErrorDialog(
          'Upload Failed',
          '$message\n\n${hint.isNotEmpty ? 'Hint: $hint' : ''}\n\nError Code: $errorCode',
        );
      }
    } on Exception catch (e) {
      setState(() {
        _uploadProgress = null;
      });
      
      String errorMessage = e.toString();
      if (errorMessage.contains('SocketException')) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (errorMessage.contains('TimeoutException')) {
        errorMessage = 'Upload timed out. The file might be too large or the server is slow.';
      } else if (errorMessage.contains('FormatException')) {
        errorMessage = 'Invalid response from server. Please try again.';
      }
      
      _showErrorDialog('Upload Error', errorMessage);
    } catch (e) {
      setState(() {
        _uploadProgress = null;
      });
      _showErrorDialog('Unexpected Error', 'An unexpected error occurred: ${e.toString()}');
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }

  Future<void> _downloadTemplate() async {
    setState(() {
      _isDownloading = true;
      _uploadProgress = 'Downloading template...';
    });

    try {
      await _apiService.downloadTimetableTemplate();
      
      setState(() {
        _uploadProgress = null;
        _isDownloading = false;
      });

      _showSuccessDialog(
        'Template Downloaded',
        'The template file has been downloaded successfully!\n\nCheck your downloads folder for "timetable_template.xlsx".',
      );
    } on Exception catch (e) {
      setState(() {
        _uploadProgress = null;
        _isDownloading = false;
      });
      
      String errorMessage = e.toString();
      if (errorMessage.contains('401') || errorMessage.contains('403')) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (errorMessage.contains('SocketException')) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      }
      
      _showErrorDialog('Download Failed', errorMessage);
    } catch (e) {
      setState(() {
        _uploadProgress = null;
        _isDownloading = false;
      });
      _showErrorDialog('Download Error', 'Failed to download template: ${e.toString()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Timetable'),
        elevation: 2,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Card
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.upload_file, size: 32, color: Theme.of(context).primaryColor),
                        const SizedBox(width: 12),
                        const Text(
                          'Upload Excel Timetable',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Upload a multi-sheet Excel file where each sheet represents a section timetable.',
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // File Selection
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select File',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // File picker button
                    OutlinedButton.icon(
                      onPressed: _isUploading ? null : _pickFile,
                      icon: const Icon(Icons.folder_open),
                      label: const Text('Choose Excel File (.xlsx, .xls, .xlsm, etc.)'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                        minimumSize: const Size(double.infinity, 50),
                      ),
                    ),
                    
                    if (_fileName != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.green.shade700),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _fileName!,
                                style: TextStyle(
                                  fontWeight: FontWeight.w500,
                                  color: Colors.green.shade900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Options
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Upload Options',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Dry Run Switch
                    SwitchListTile(
                      title: const Text('Dry Run (Validate Only)'),
                      subtitle: const Text('Check for errors without saving to database'),
                      value: _isDryRun,
                      onChanged: (value) {
                        setState(() {
                          _isDryRun = value;
                        });
                      },
                    ),
                    const Divider(),
                    
                    // Upload Mode
                    const Text(
                      'Upload Mode',
                      style: TextStyle(fontWeight: FontWeight.w500),
                    ),
                    RadioListTile<String>(
                      title: const Text('Replace'),
                      subtitle: const Text('Delete existing timetable and upload new'),
                      value: 'replace',
                      groupValue: _uploadMode,
                      onChanged: (value) {
                        setState(() {
                          _uploadMode = value!;
                        });
                      },
                    ),
                    RadioListTile<String>(
                      title: const Text('Merge'),
                      subtitle: const Text('Keep existing entries, add new ones'),
                      value: 'merge',
                      groupValue: _uploadMode,
                      onChanged: (value) {
                        setState(() {
                          _uploadMode = value!;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isUploading ? null : _uploadFile,
                    icon: _isUploading 
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Icon(_isDryRun ? Icons.verified : Icons.cloud_upload),
                    label: Text(_isUploading 
                      ? 'Processing...' 
                      : (_isDryRun ? 'Validate' : 'Upload & Save')
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      minimumSize: const Size(double.infinity, 54),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: (_isUploading || _isDownloading) ? null : _downloadTemplate,
                  icon: _isDownloading 
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.download),
                  label: const Text('Template'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                    backgroundColor: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
            
            // Results Section
            if (_showResults && _uploadResult != null) ...[
              const SizedBox(height: 24),
              _buildResultsSection(),
            ],
          ],
        ),
      ),
          
          // Loading Overlay
          if (_isUploading || _isDownloading)
            Container(
              color: Colors.black54,
              child: Center(
                child: Card(
                  margin: const EdgeInsets.all(24),
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 60,
                          height: 60,
                          child: CircularProgressIndicator(strokeWidth: 6),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          _uploadProgress ?? 'Processing...',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Please wait...',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildResultsSection() {
    final result = _uploadResult!;
    final summary = result['summary'];
    final success = result['success'] == true;
    
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  success ? Icons.check_circle : Icons.error,
                  color: success ? Colors.green : Colors.red,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    result['message'] ?? 'Processing completed',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Summary Stats
            if (summary != null) ...[
              _buildStatRow('Total Sheets', (summary['totalSheets'] ?? 0).toString(), Icons.table_chart),
              _buildStatRow('Total Entries', (summary['totalEntries'] ?? 0).toString(), Icons.grid_on),
              _buildStatRow('Valid Entries', (summary['validEntries'] ?? 0).toString(), Icons.check, Colors.green),
              if ((summary['invalidEntries'] as int? ?? 0) > 0)
                _buildStatRow('Invalid Entries', (summary['invalidEntries'] ?? 0).toString(), Icons.warning, Colors.orange),
              if ((summary['errors'] as int? ?? 0) > 0)
                _buildStatRow('Errors', (summary['errors'] ?? 0).toString(), Icons.error, Colors.red),
              if ((summary['warnings'] as int? ?? 0) > 0)
                _buildStatRow('Warnings', (summary['warnings'] ?? 0).toString(), Icons.info, Colors.orange),
              if ((summary['conflicts'] as int? ?? 0) > 0)
                _buildStatRow('Conflicts', (summary['conflicts'] ?? 0).toString(), Icons.priority_high, Colors.red),
            ],
            
            // Errors
            if (result['errors'] != null && (result['errors'] as List).isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              const Text(
                'Errors',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.red),
              ),
              const SizedBox(height: 8),
              ...(result['errors'] as List).take(5).map((error) => 
                _buildErrorCard(error, Colors.red)
              ),
              if ((result['errors'] as List).length > 5)
                Text('... and ${(result['errors'] as List).length - 5} more errors'),
            ],
            
            // Conflicts
            if (result['conflicts'] != null && (result['conflicts'] as List).isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              const Text(
                'Conflicts',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.orange),
              ),
              const SizedBox(height: 8),
              ...(result['conflicts'] as List).take(5).map((conflict) => 
                _buildErrorCard(conflict, Colors.orange)
              ),
              if ((result['conflicts'] as List).length > 5)
                Text('... and ${(result['conflicts'] as List).length - 5} more conflicts'),
            ],
            
            // Warnings
            if (result['warnings'] != null && (result['warnings'] as List).isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              const Text(
                'Warnings',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue),
              ),
              const SizedBox(height: 8),
              ...(result['warnings'] as List).take(3).map((warning) => 
                _buildErrorCard(warning, Colors.blue)
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon, [Color? color]) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color ?? Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard(Map<String, dynamic> error, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            error['message'] ?? error['error'] ?? 'Unknown error',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          if (error['day'] != null || error['time'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '${error['day'] ?? ''} ${error['time'] ?? ''}',
                style: TextStyle(
                  fontSize: 12,
                  color: color.withOpacity(0.8),
                ),
              ),
            ),
          if (error['details'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                error['details'].toString(),
                style: TextStyle(
                  fontSize: 11,
                  color: color.withOpacity(0.6),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
