import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../bloc/sales_history_bloc.dart';
import '../../domain/entities/transaction.dart';
import '../../../product/presentation/bloc/product_bloc.dart';

class SalesHistoryPage extends StatefulWidget {
  const SalesHistoryPage({super.key});

  @override
  State<SalesHistoryPage> createState() => _SalesHistoryPageState();
}

class _SalesHistoryPageState extends State<SalesHistoryPage> {
  final TextEditingController _searchController = TextEditingController();
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    context.read<SalesHistoryBloc>().add(const LoadAllTransactionsEvent());
    context.read<ProductBloc>().add(LoadProducts());
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Transaction> _applyFilters(List<Transaction> transactions) {
    final query = _searchController.text.trim().toLowerCase();
    return transactions.where((t) {
      final matchesSearch = query.isEmpty || t.id.toLowerCase().contains(query);
      final matchesDate = _dateRange == null ||
          (!t.timestamp.isBefore(_dateRange!.start) &&
              t.timestamp.isBefore(_dateRange!.end.add(const Duration(days: 1))));
      return matchesSearch && matchesDate;
    }).toList();
  }

  Future<void> _pickDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 2)),
      lastDate: DateTime.now(),
      initialDateRange: _dateRange,
    );
    if (range != null) {
      setState(() => _dateRange = range);
    }
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _dateRange = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales History'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: BlocBuilder<SalesHistoryBloc, SalesHistoryState>(
        builder: (context, state) {
          final filtered = _applyFilters(state.transactions);
          final filteredTotal = filtered
              .where((t) => !t.isRefunded)
              .fold<double>(0, (sum, t) => sum + t.totalAmount);

          return Column(
            children: [
              _buildFilterBar(),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _buildKpiCards(state, filtered, filteredTotal),
                      _buildAnalyticsSection(state.transactions),
                      _buildTransactionList(state, filtered),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterBar() {
    final hasFilters = _searchController.text.isNotEmpty || _dateRange != null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by bill number...',
                    prefixIcon: const Icon(Icons.search),
                    border: const OutlineInputBorder(),
                    isDense: true,
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () => _searchController.clear(),
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filledTonal(
                icon: const Icon(Icons.date_range),
                tooltip: 'Filter by date range',
                onPressed: _pickDateRange,
              ),
            ],
          ),
          if (hasFilters)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: _clearFilters,
                icon: const Icon(Icons.filter_alt_off, size: 16),
                label: Text(_dateRange == null
                    ? 'Clear search'
                    : 'Clear filters (${DateFormat('MMM d').format(_dateRange!.start)} - ${DateFormat('MMM d').format(_dateRange!.end)})'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildKpiCards(SalesHistoryState state, List<Transaction> filtered, double filteredTotal) {
    final today = DateTime.now();
    final todaySales = state.transactions
        .where((t) => !t.isRefunded &&
            t.timestamp.year == today.year &&
            t.timestamp.month == today.month &&
            t.timestamp.day == today.day)
        .fold<double>(0, (sum, t) => sum + t.totalAmount);

    final lowStockCount = context.watch<ProductBloc>().state.products.where((p) => p.isLowStock).length;

    final cards = [
      _KpiData('Total Sales', '₹${filteredTotal.toStringAsFixed(2)}', Colors.green),
      _KpiData('Transactions', filtered.length.toString(), Colors.blue),
      _KpiData('Today\'s Sales', '₹${todaySales.toStringAsFixed(2)}', Colors.teal),
      _KpiData('Low Stock', lowStockCount.toString(), lowStockCount > 0 ? Colors.red : Colors.grey),
    ];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 2.2,
        children: cards.map((c) => Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(c.label, style: const TextStyle(fontSize: 12)),
                const SizedBox(height: 4),
                Text(
                  c.value,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: c.color),
                ),
              ],
            ),
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildAnalyticsSection(List<Transaction> allTransactions) {
    if (allTransactions.isEmpty) return const SizedBox.shrink();

    final revenueByDay = <DateTime, double>{};
    final now = DateTime.now();
    for (int i = 6; i >= 0; i--) {
      final day = DateTime(now.year, now.month, now.day).subtract(Duration(days: i));
      revenueByDay[day] = 0;
    }
    for (final t in allTransactions) {
      if (t.isRefunded) continue;
      final day = DateTime(t.timestamp.year, t.timestamp.month, t.timestamp.day);
      if (revenueByDay.containsKey(day)) {
        revenueByDay[day] = revenueByDay[day]! + t.totalAmount;
      }
    }
    final days = revenueByDay.keys.toList()..sort();
    final maxRevenue = revenueByDay.values.fold<double>(0, (m, v) => v > m ? v : m);

    final productsById = {
      for (final p in context.watch<ProductBloc>().state.products) p.id: p,
    };
    final revenueByCategory = <String, double>{};
    for (final t in allTransactions) {
      if (t.isRefunded) continue;
      for (final item in t.items) {
        final category = productsById[item.productId]?.category ?? 'Uncategorized';
        revenueByCategory[category] = (revenueByCategory[category] ?? 0) + item.total;
      }
    }
    final sortedCategories = revenueByCategory.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topCategories = sortedCategories.take(5).toList();

    final chartColors = [Colors.indigo, Colors.teal, Colors.orange, Colors.purple, Colors.pink];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Revenue (Last 7 Days)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          SizedBox(
            height: 160,
            child: maxRevenue == 0
                ? const Center(child: Text('No sales in the last 7 days', style: TextStyle(color: Colors.grey)))
                : BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: maxRevenue * 1.2,
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final idx = value.toInt();
                              if (idx < 0 || idx >= days.length) return const SizedBox.shrink();
                              return Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(DateFormat('E').format(days[idx]), style: const TextStyle(fontSize: 10)),
                              );
                            },
                          ),
                        ),
                      ),
                      borderData: FlBorderData(show: false),
                      gridData: const FlGridData(show: false),
                      barGroups: days.asMap().entries.map((entry) {
                        return BarChartGroupData(
                          x: entry.key,
                          barRods: [
                            BarChartRodData(
                              toY: revenueByDay[entry.value]!,
                              color: Theme.of(context).primaryColor,
                              width: 18,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
          ),
          const SizedBox(height: 24),
          if (topCategories.isNotEmpty) ...[
            const Text('Revenue by Category', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            SizedBox(
              height: 160,
              child: Row(
                children: [
                  Expanded(
                    child: PieChart(
                      PieChartData(
                        sectionsSpace: 2,
                        centerSpaceRadius: 30,
                        sections: topCategories.asMap().entries.map((entry) {
                          final color = chartColors[entry.key % chartColors.length];
                          return PieChartSectionData(
                            value: entry.value.value,
                            color: color,
                            title: '',
                            radius: 45,
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: topCategories.asMap().entries.map((entry) {
                        final color = chartColors[entry.key % chartColors.length];
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            children: [
                              Container(width: 10, height: 10, color: color),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  entry.value.key,
                                  style: const TextStyle(fontSize: 11),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          const Divider(),
        ],
      ),
    );
  }

  Widget _buildTransactionList(SalesHistoryState state, List<Transaction> filtered) {
    if (state.isLoading) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (filtered.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: Text('No transactions found')),
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final transaction = filtered[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListTile(
            title: Text(
              'Transaction #${transaction.id.substring(0, 8)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(
                  DateFormat('MMM dd, yyyy HH:mm').format(transaction.timestamp),
                  style: const TextStyle(fontSize: 12),
                ),
                Text(
                  '${transaction.items.length} items',
                  style: const TextStyle(fontSize: 12),
                ),
                if (transaction.isRefunded)
                  const Text(
                    'REFUNDED',
                    style: TextStyle(
                      color: Colors.red,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
              ],
            ),
            trailing: Text(
              '₹${transaction.totalAmount.toStringAsFixed(2)}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            onTap: () {
              _showTransactionDetails(context, transaction);
            },
          ),
        );
      },
    );
  }

  void _showTransactionDetails(BuildContext context, Transaction transaction) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Transaction #${transaction.id.substring(0, 8)}'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Date: ${DateFormat('MMM dd, yyyy HH:mm').format(transaction.timestamp)}',
              ),
              const SizedBox(height: 16),
              const Text('Items:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              ..._buildItemsList(transaction.items),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Subtotal:'),
                        Text('₹${transaction.subtotal.toStringAsFixed(2)}'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tax:'),
                        Text('₹${transaction.taxAmount.toStringAsFixed(2)}'),
                      ],
                    ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total:',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('₹${transaction.totalAmount.toStringAsFixed(2)}',
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          if (!transaction.isRefunded)
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                context
                    .read<SalesHistoryBloc>()
                    .add(RefundTransactionEvent(transaction.id));
              },
              child: const Text('Refund', style: TextStyle(color: Colors.red)),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildItemsList(List<TransactionItem> items) {
    return items.map((item) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                '${item.productName} x${item.quantity}',
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text('₹${item.total.toStringAsFixed(2)}'),
          ],
        ),
      );
    }).toList();
  }
}

class _KpiData {
  final String label;
  final String value;
  final Color color;
  _KpiData(this.label, this.value, this.color);
}
