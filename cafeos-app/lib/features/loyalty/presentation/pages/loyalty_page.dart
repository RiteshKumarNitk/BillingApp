import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../data/loyalty_remote_datasource.dart';

/// Read-only "Loyalty Points" screen: one balance per cafe (each cafe runs its own programme).
/// Points are redeemed by the cashier at the counter — the online checkout has no redeem step.
class LoyaltyPage extends StatefulWidget {
  const LoyaltyPage({super.key});

  @override
  State<LoyaltyPage> createState() => _LoyaltyPageState();
}

class _LoyaltyPageState extends State<LoyaltyPage> {
  LoyaltySummary? _summary;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final summary = await sl<LoyaltyRemoteDataSource>().getLoyalty();
      if (!mounted) return;
      setState(() {
        _summary = summary;
        _loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = mapDioExceptionToFailure(e).message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Loyalty Points')),
      body: _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return ErrorStateView(message: _error!, onRetry: _load);

    final summary = _summary!;
    final theme = Theme.of(context);
    if (summary.cafes.isEmpty) {
      return EmptyStateView(
        icon: Icons.stars_rounded,
        title: 'No points yet',
        message: 'Earn 1 point for every ₹${summary.earnRupeesPerPoint} you spend at a cafe.',
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total points', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onPrimary)),
                const SizedBox(height: 4),
                Text('${summary.totalPoints}', style: theme.textTheme.headlineMedium?.copyWith(color: theme.colorScheme.onPrimary)),
                const SizedBox(height: 8),
                Text(
                  'Earn 1 point per ₹${summary.earnRupeesPerPoint} spent. Ask the cashier to redeem them at the counter.',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onPrimary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ...summary.cafes.map(
            (cafe) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: const Icon(Icons.local_cafe_outlined),
                title: Text(cafe.cafeName),
                subtitle: Text('Spent ${formatRupees(cafe.totalSpent)}'),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('${cafe.points} pts', style: theme.textTheme.titleMedium),
                    Text('worth ${formatRupees(cafe.valueRupees)}', style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
