import 'package:flutter/material.dart';

class ErrorHandler {
  static void showError(BuildContext context, String message) {
    if (!context.mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'OK',
          textColor: Colors.white,
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
          },
        ),
      ),
    );
  }

  static void showSuccess(BuildContext context, String message) {
    if (!context.mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  static String getReadableError(dynamic error) {
    String errorMessage = error.toString();
    
    if (errorMessage.contains('SocketException')) {
      return 'No internet connection. Please check your network.';
    } else if (errorMessage.contains('TimeoutException')) {
      return 'Connection timeout. Please try again.';
    } else if (errorMessage.contains('FormatException')) {
      return 'Server response error. Please try again.';
    } else if (errorMessage.contains('Exception:')) {
      return errorMessage.replaceFirst('Exception: ', '');
    }
    
    return errorMessage;
  }
}