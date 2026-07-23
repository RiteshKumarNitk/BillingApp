import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../cafes/domain/usecases/get_cafe_by_id_usecase.dart';
import '../../domain/entities/order.dart';
import '../cubit/order_detail_cubit.dart';
import '../cubit/order_detail_state.dart';
import '../widgets/order_status_chip.dart';
import '../widgets/order_status_timeline.dart';

class OrderDetailPage extends StatelessWidget {
  final String orderId;
  const OrderDetailPage({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<OrderDetailCubit>(param1: orderId)..loadOrder(),
      child: const _OrderDetailView(),
    );
  }
}

class _OrderDetailView extends StatefulWidget {
  const _OrderDetailView();

  @override
  State<_OrderDetailView> createState() => _OrderDetailViewState();
}

class _OrderDetailViewState extends State<_OrderDetailView> {
  bool _reordering = false;

  Future<void> _reorder(Order order) async {
    setState(() => _reordering = true);
    final result = await sl<GetCafeByIdUseCase>()(order.tenantId);
    if (!mounted) return;
    setState(() => _reordering = false);
    result.match(
      (failure) => AppToast.error(context, 'Could not open ${order.tenantName}: ${failure.message}'),
      (cafe) => context.push('/cafes/${cafe.id}/menu', extra: cafe),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: BlocBuilder<OrderDetailCubit, OrderDetailState>(
        builder: (context, state) {
          if (state.status == OrderDetailStatus.loading || state.status == OrderDetailStatus.initial) {
            return AppShimmer(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  ShimmerBox(height: 140, borderRadius: BorderRadius.circular(18)),
                  const SizedBox(height: 12),
                  ShimmerBox(height: 220, borderRadius: BorderRadius.circular(18)),
                ],
              ),
            );
          }
          if (state.status == OrderDetailStatus.error || state.order == null) {
            return ErrorStateView(message: state.errorMessage ?? 'Could not load this order', onRetry: () => context.read<OrderDetailCubit>().loadOrder());
          }

          final order = state.order!;
          final theme = Theme.of(context);

          return RefreshIndicator(
            onRefresh: () => context.read<OrderDetailCubit>().loadOrder(),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(order.tenantName, style: theme.textTheme.headlineMedium),
                          Text(DateFormat('MMM d, y • h:mm a').format(order.createdAt), style: theme.textTheme.bodySmall),
                        ],
                      ),
                    ),
                    OrderStatusChip(status: order.status),
                  ],
                ),
                const SizedBox(height: 24),
                OrderStatusTimeline(status: order.status),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.colorScheme.outline),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (order.orderType != null) ...[
                        Row(
                          children: [
                            Icon(order.orderType == 'DINE_IN' ? Icons.table_restaurant_rounded : Icons.shopping_bag_outlined, size: 16, color: theme.colorScheme.primary),
                            const SizedBox(width: 8),
                            Text(
                              order.orderType == 'DINE_IN' ? 'Dine-in${order.tableLabel != null ? ' • Table ${order.tableLabel}' : ''}' : 'Takeaway',
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                      ],
                      Text('Items', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ...order.items.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('${item.quantity.toStringAsFixed(0)}x ${item.name}', style: theme.textTheme.bodyMedium),
                                      if (item.comboComponents.isNotEmpty)
                                        Text(
                                          item.comboComponents.map((c) => '${c.quantity}x ${c.name}${c.variantName != null ? " (${c.variantName})" : ""}').join(' • '),
                                          style: theme.textTheme.bodySmall,
                                        ),
                                    ],
                                  ),
                                ),
                                Text(formatRupees(item.itemTotal), style: theme.textTheme.bodyMedium),
                              ],
                            ),
                          )),
                      const Divider(height: 24),
                      _SummaryRow(label: 'Subtotal', value: order.totalAmount),
                      if (order.discountAmount > 0) _SummaryRow(label: order.discountLabel ?? 'Discount', value: -order.discountAmount, isDiscount: true),
                      if (order.taxAmount > 0) _SummaryRow(label: 'Tax', value: order.taxAmount),
                      const SizedBox(height: 4),
                      _SummaryRow(label: 'Total', value: order.netAmount, isTotal: true),
                      if (order.notes != null && order.notes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text('Notes: ${order.notes}', style: theme.textTheme.bodySmall),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                PrimaryButton(
                  label: 'Reorder from ${order.tenantName}',
                  icon: Icons.replay_rounded,
                  isLoading: _reordering,
                  onPressed: () => _reorder(order),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final double value;
  final bool isTotal;
  final bool isDiscount;
  const _SummaryRow({required this.label, required this.value, this.isTotal = false, this.isDiscount = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = isTotal ? theme.textTheme.titleMedium : theme.textTheme.bodyMedium;
    final color = isDiscount ? const Color(0xFF2E9E5B) : null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style?.copyWith(color: color)),
          Text('${value < 0 ? '-' : ''}${formatRupees(value.abs())}', style: style?.copyWith(color: color)),
        ],
      ),
    );
  }
}
