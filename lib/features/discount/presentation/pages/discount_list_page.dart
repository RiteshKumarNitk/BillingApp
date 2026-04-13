import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/discount_bloc.dart';
import '../../domain/entities/discount.dart';

class DiscountListPage extends StatefulWidget {
  const DiscountListPage({Key? key}) : super(key: key);

  @override
  State<DiscountListPage> createState() => _DiscountListPageState();
}

class _DiscountListPageState extends State<DiscountListPage> {
  @override
  void initState() {
    super.initState();
    context.read<DiscountBloc>().add(const LoadTodayDiscounts());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Discounts'),
        centerTitle: true,
        elevation: 0,
      ),
      body: BlocBuilder<DiscountBloc, DiscountState>(
        builder: (context, state) {
          if (state.status == DiscountStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.status == DiscountStatus.error) {
            return Center(
              child: Text('Error: ${state.errorMessage}'),
            );
          }

          if (state.discounts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.local_offer_outlined,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No active discounts',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            itemCount: state.discounts.length,
            itemBuilder: (context, index) {
              final discount = state.discounts[index];
              return _buildDiscountCard(discount, context);
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.push('/discounts/add');
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildDiscountCard(Discount discount, BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        discount.name,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        discount.description,
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${discount.discountPercentage.toStringAsFixed(0)}%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: Colors.grey[300]),
            const SizedBox(height: 8),
            if (discount.applicableCategory != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Chip(
                  label: Text('Category: ${discount.applicableCategory}'),
                  backgroundColor: Colors.blue[100],
                ),
              ),
            if (discount.minimumQuantity != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  'Min Qty: ${discount.minimumQuantity}',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            Text(
              'Valid: ${_formatDate(discount.startDate)} to ${_formatDate(discount.endDate)}',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
