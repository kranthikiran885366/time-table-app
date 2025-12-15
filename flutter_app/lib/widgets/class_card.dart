import 'package:flutter/material.dart';
import '../models/timetable.dart';
import 'countdown_timer.dart';

class ClassCard extends StatelessWidget {
  final TimetableEntry timetableEntry;
  final bool showCountdown;
  final bool isCurrentClass;

  ClassCard({
    required this.timetableEntry,
    this.showCountdown = false,
    this.isCurrentClass = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${timetableEntry.startTime} - ${timetableEntry.endTime}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: timetableEntry.classType == 'lab' ? Colors.orange : Colors.blue,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  timetableEntry.classType.toUpperCase(),
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (showCountdown) ...[
            SizedBox(height: 12),
            CountdownTimer(
              endTime: timetableEntry.endTime,
              startTime: timetableEntry.startTime,
              isCurrentClass: isCurrentClass,
            ),
          ],
          SizedBox(height: 8),
          Text(
            timetableEntry.subject.name,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Faculty: ${timetableEntry.faculty.name}',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Room: ${timetableEntry.room.number} (${timetableEntry.room.block})',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Sections: ${timetableEntry.sections.map((s) => s.name).join(', ')}',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Department: ${timetableEntry.subject.department}',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}