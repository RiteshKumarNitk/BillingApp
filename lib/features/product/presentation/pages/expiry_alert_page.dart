import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/expiry_alert_bloc.dart';
import '../../domain/entities/expiry_alert.dart';

class ExpiryAlertListPage extends StatefulWidget {
  const ExpiryAlertListPage({Key? key}) : super(key: key);

  @override
  State<ExpiryAlertListPage> createState() => _ExpiryAlertListPageState();
}

class _ExpiryAlertListPageState extends State<ExpiryAlertListPage> {
  int _selectedTab = 0; // 0: Expiring Soon, 1: Expired

  @override
  void initState() {
    super.initState();
    context.read<ExpiryAlertBloc>().add(const LoadExpiringAlerts());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Expiry Alerts'),
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(label: Text('Expiring Soon'), value: 0),
                      ButtonSegment(label: Text('Expired'), value: 1),
                    ],
                    selected: {_selectedTab},
                    onSelectionChanged: (value) {
                      setState(() {
                        _selectedTab = value.first;
                      });
                      if (_selectedTab == 0) {
                        context
                            .read<ExpiryAlertBloc>()
                            .add(const LoadExpiringAlerts());
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: BlocBuilder<ExpiryAlertBloc, ExpiryState>(
              builder: (context, state) {
                if (state.status == ExpiryStatus.loading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.status == ExpiryStatus.error) {
                  return Center(
                    child: Text('Error: ${state.errorMessage}'),
                  );
                }

                final alerts = _selectedTab == 0
                    ? state.alerts.where((a) => a.daysUntilExpiry > 0).toList()
                    : state.alerts.where((a) => a.daysUntilExpiry <= 0).toList();

                if (alerts.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _selectedTab == 0
                              ? Icons.check_circle_outline
                              : Icons.info_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _selectedTab == 0
                              ? 'No items expiring soon'
                              : 'No expired items',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  itemCount: alerts.length,
                  itemBuilder: (context, index) {
                    final alert = alerts[index];
                    return _buildAlertTile(alert, context);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertTile(ExpiryAlert alert, BuildContext context) {
    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (alert.daysUntilExpiry <= 0) {
      statusColor = Colors.red;
      statusText = 'EXPIRED';
      statusIcon = Icons.error;
    } else if (alert.daysUntilExpiry <= 3) {
      statusColor = Colors.orange;
      statusText = 'URGENT';
      statusIcon = Icons.warning;
    } else {
      statusColor = Colors.amber;
      statusText = 'WARNING';
      statusIcon = Icons.info;
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: statusColor.withOpacity(0.1),
      child: ListTile(
        leading: Icon(statusIcon, color: statusColor),
        title: Text(alert.productName),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              'Expiry: ${_formatDate(alert.expiryDate)}',
              style: const TextStyle(fontSize: 12),
            ),
            Text(
              'Stock: ${alert.stockCount} units',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              statusText,
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${alert.daysUntilExpiry} days',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
