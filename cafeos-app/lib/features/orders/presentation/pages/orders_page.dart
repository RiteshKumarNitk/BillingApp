import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../../authentication/presentation/cubit/auth_cubit.dart';
import '../../../authentication/presentation/cubit/auth_state.dart';
import '../../domain/entities/order.dart';
import '../cubit/orders_cubit.dart';
import '../cubit/orders_state.dart';
import '../widgets/order_status_chip.dart';

const _orderFilters = <String?, String>{
  null: 'All',
  OrdersFilter.upcoming: 'Upcoming',
  OrdersFilter.active: 'Active',
  OrdersFilter.completed: 'Completed',
  OrdersFilter.cancelled: 'Cancelled',
};

class OrdersPage extends StatelessWidget {
  const OrdersPage({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthCubit>().state;
    if (authState.status != AuthStatus.authenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Your Orders')),
        body: const EmptyStateView(
          icon: Icons.receipt_long_outlined,
          title: 'Sign in to see your orders',
          message: 'Track your orders and reorder favourites once you sign in.',
        ),
      );
    }

    return BlocProvider(
      create: (_) => sl<OrdersCubit>()..loadOrders(),
      child: const _OrdersView(),
    );
  }
}

class _OrdersView extends StatelessWidget {
  const _OrdersView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Your Orders')),
      body: Column(
        children: [
          BlocBuilder<OrdersCubit, OrdersState>(
            buildWhen: (a, b) => a.filter != b.filter,
            builder: (context, state) => SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                children: _orderFilters.entries
                    .map((e) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: AppChip(
                            label: e.value,
                            selected: state.filter == e.key,
                            onTap: () => context.read<OrdersCubit>().loadOrders(filter: e.key),
                          ),
                        ))
                    .toList(),
              ),
            ),
          ),
          Expanded(
            child: BlocBuilder<OrdersCubit, OrdersState>(
              builder: (context, state) {
                if (state.status == OrdersStatus.loading || state.status == OrdersStatus.initial) {
                  return AppShimmer(
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: 4,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, __) => ShimmerBox(height: 96, borderRadius: BorderRadius.circular(18)),
                    ),
                  );
                }
                if (state.status == OrdersStatus.error) {
                  return ErrorStateView(
                    message: state.errorMessage ?? 'Could not load your orders',
                    onRetry: () => context.read<OrdersCubit>().loadOrders(filter: state.filter),
                  );
                }
                if (state.orders.isEmpty) {
                  return EmptyStateView(
                    icon: Icons.receipt_long_outlined,
                    title: state.filter == null ? 'No orders yet' : 'No ${_orderFilters[state.filter]!.toLowerCase()} orders',
                    message: 'Your order history will show up here.',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => context.read<OrdersCubit>().loadOrders(filter: state.filter),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.orders.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) => _OrderCard(order: state.orders[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: () => context.push('/orders/${order.id}'),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: theme.colorScheme.outline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: order.tenantLogoUrl != null
                      ? CachedNetworkImage(imageUrl: order.tenantLogoUrl!, width: 40, height: 40, fit: BoxFit.cover)
                      : Container(
                          width: 40,
                          height: 40,
                          color: theme.colorScheme.primary.withValues(alpha: 0.1),
                          child: Icon(Icons.storefront_rounded, color: theme.colorScheme.primary, size: 20),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(order.tenantName, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(DateFormat('MMM d, h:mm a').format(order.createdAt), style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                OrderStatusChip(status: order.status),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${order.items.fold<double>(0, (s, i) => s + i.quantity).toStringAsFixed(0)} items',
                  style: theme.textTheme.bodyMedium,
                ),
                PriceTag(salePrice: order.netAmount, fontSize: 14),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
