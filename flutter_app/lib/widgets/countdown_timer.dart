import 'dart:async';
import 'package:flutter/material.dart';

class CountdownTimer extends StatefulWidget {
  final String endTime;
  final bool isCurrentClass;
  final String startTime;

  const CountdownTimer({
    Key? key,
    required this.endTime,
    this.isCurrentClass = false,
    required this.startTime,
  }) : super(key: key);

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer> {
  late Timer _timer;
  String _displayText = '';
  // Note: _remainingTime is updated but the value itself isn't read elsewhere

  @override
  void initState() {
    super.initState();
    _calculateRemainingTime();
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      _calculateRemainingTime();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _calculateRemainingTime() {
    final now = DateTime.now();
    final targetTimeStr = widget.isCurrentClass ? widget.endTime : widget.startTime;
    
    try {
      // Parse time in HH:mm format
      final timeParts = targetTimeStr.split(':');
      final targetTime = DateTime(
        now.year,
        now.month,
        now.day,
        int.parse(timeParts[0]),
        int.parse(timeParts[1]),
      );

      final difference = targetTime.difference(now);

      if (difference.isNegative) {
        setState(() {
          if (widget.isCurrentClass) {
            _displayText = 'Class ended';
          } else {
            _displayText = 'Class started';
          }
        });
        return;
      }

      setState(() {
        _displayText = _formatDuration(difference);
      });
    } catch (e) {
      setState(() {
        _displayText = 'Invalid time';
      });
    }
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    } else {
      return '$minutes:${seconds.toString().padLeft(2, '0')}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final label = widget.isCurrentClass ? 'Time left' : 'Starts in';
    final color = widget.isCurrentClass ? Colors.green : Colors.blue;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color, width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            widget.isCurrentClass ? Icons.hourglass_bottom : Icons.schedule,
            size: 16,
            color: color,
          ),
          SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                _displayText,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
