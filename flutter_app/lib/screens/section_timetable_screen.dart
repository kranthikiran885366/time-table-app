import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/timetable_provider.dart';
import '../models/timetable.dart';
import '../models/section.dart';
import '../widgets/class_card.dart';
import '../services/notification_service.dart';

class SectionTimetableScreen extends StatefulWidget {
  final Section section;

  SectionTimetableScreen({required this.section});

  @override
  _SectionTimetableScreenState createState() => _SectionTimetableScreenState();
}

class _SectionTimetableScreenState extends State<SectionTimetableScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = Provider.of<TimetableProvider>(context, listen: false);
      await provider.searchBySection(widget.section.id ?? '', 'today');
      
      // Schedule notifications for today's classes
      if (provider.timetable.isNotEmpty) {
        await NotificationService().scheduleAllClassNotifications(provider.timetable);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.section.name} Timetable'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Today'),
            Tab(text: 'Weekly'),
          ],
          onTap: (index) {
            final type = index == 0 ? 'today' : 'weekly';
            Provider.of<TimetableProvider>(context, listen: false)
                .searchBySection(widget.section.id ?? '', type);
          },
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTodayView(),
          _buildWeeklyView(),
        ],
      ),
    );
  }

  Widget _buildTodayView() {
    return Consumer<TimetableProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return Center(child: CircularProgressIndicator());
        }

        return SingleChildScrollView(
          padding: EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (provider.currentClass != null) ...[
                Card(
                  color: Colors.green.shade50,
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.play_circle, color: Colors.green),
                            SizedBox(width: 8),
                            Text(
                              'Current Class',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                        SizedBox(height: 8),
                        ClassCard(
                          timetableEntry: provider.currentClass!,
                          showCountdown: true,
                          isCurrentClass: true,
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 16),
              ],
              Text(
                'Today\'s Classes',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              SizedBox(height: 8),
              Expanded(
                child: provider.timetable.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.event_busy, size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text('No classes scheduled for today'),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: provider.timetable.length,
                        itemBuilder: (context, index) {
                          return Card(
                            margin: EdgeInsets.only(bottom: 8),
                            child: ClassCard(timetableEntry: provider.timetable[index]),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWeeklyView() {
    return Consumer<TimetableProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return Center(child: CircularProgressIndicator());
        }

        final weeklyTimetable = _groupByDay(provider.timetable);
        final days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return ListView.builder(
          padding: EdgeInsets.all(16.0),
          itemCount: days.length,
          itemBuilder: (context, index) {
            final day = days[index];
            final dayClasses = weeklyTimetable[day] ?? [];

            return Card(
              margin: EdgeInsets.only(bottom: 16),
              child: ExpansionTile(
                title: Text(
                  day,
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text('${dayClasses.length} classes'),
                children: dayClasses.isEmpty
                    ? [
                        Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text('No classes scheduled'),
                        )
                      ]
                    : dayClasses
                        .map((entry) => Padding(
                              padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                              child: ClassCard(timetableEntry: entry),
                            ))
                        .toList(),
              ),
            );
          },
        );
      },
    );
  }

  Map<String, List<TimetableEntry>> _groupByDay(List<TimetableEntry> timetable) {
    final Map<String, List<TimetableEntry>> grouped = {};
    for (final entry in timetable) {
      if (!grouped.containsKey(entry.day)) {
        grouped[entry.day] = [];
      }
      grouped[entry.day]!.add(entry);
    }
    return grouped;
  }
}