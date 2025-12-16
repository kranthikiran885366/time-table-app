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
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  '${timetableEntry.startTime} - ${timetableEntry.endTime}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: timetableEntry.classType == 'lab' ? Colors.orange : Colors.blue,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  timetableEntry.classType.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (showCountdown) ...[
            const SizedBox(height: 8),
            CountdownTimer(
              endTime: timetableEntry.endTime,
              startTime: timetableEntry.startTime,
              isCurrentClass: isCurrentClass,
            ),
          ],
          const SizedBox(height: 2),
          Text(
            timetableEntry.subject.name,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
          Text(
            'Faculty: ${timetableEntry.faculty.name}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            'Room: ${timetableEntry.room.number} (${timetableEntry.room.block})',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            'Sections: ${timetableEntry.sections.map((s) => s.name).join(', ')}',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[600],
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ],
      );
  }
}