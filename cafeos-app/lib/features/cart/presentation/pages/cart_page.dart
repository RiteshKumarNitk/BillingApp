import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../../../shared/widgets/quantity_stepper.dart';
import '../../domain/entities/cart_item.dart';
import '../cubit/cart_cubit.dart';
import '../cubit/cart_state.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: sl<CartCubit>(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Your Cart')),
        body: BlocBuilder<CartCubit, CartState>(
          builder: (context, state) {
            if (state.isEmpty) {
              return const EmptyStateView(
                icon: Icons.shopping_bag_outlined,
                title: 'Your cart is empty',
                message: 'Browse a cafe and add something delicious to get started.',
              );
            }

            return Column(
              children: [
                if (state.tenantName != null) _CafeHeader(state: state),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    itemCount: state.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) => _CartLine(item: state.items[i]),
                  ),
                ),
                _CartSummaryBar(state: state),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _CafeHeader extends StatelessWidget {
  final CartState state;
  const _CafeHeader({required this.state});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      color: theme.colorScheme.primary.withValues(alpha: 0.06),
      child: Row(
        children: [
          if (state.tenantLogoUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(imageUrl: state.tenantLogoUrl!, width: 32, height: 32, fit: BoxFit.cover),
            )
          else
            Icon(Icons.storefront_rounded, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(child: Text(state.tenantName!, style: theme.textTheme.titleMedium)),
          if (state.tableLabel != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: theme.colorScheme.primary, borderRadius: BorderRadius.circular(8)),
              child: Text(
                'Table ${state.tableLabel}',
                style: TextStyle(color: theme.colorScheme.onPrimary, fontSize: 11, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
    );
  }
}

class _CartLine extends StatelessWidget {
  final CartItem item;
  const _CartLine({required this.item});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Dismissible(
      key: ValueKey(item.key),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => context.read<CartCubit>().removeItem(item.key),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(color: theme.colorScheme.error, borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
      ),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outline),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: item.imageUrl != null
                  ? CachedNetworkImage(imageUrl: item.imageUrl!, width: 52, height: 52, fit: BoxFit.cover)
                  : Container(
                      width: 52,
                      height: 52,
                      color: theme.colorScheme.primary.withValues(alpha: 0.1),
                      child: Icon(item.isCombo ? Icons.ramen_dining_rounded : Icons.local_cafe_rounded, color: theme.colorScheme.primary),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name, style: theme.textTheme.titleMedium?.copyWith(fontSize: 14)),
                  if (item.comboComponentLabels.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        item.comboComponentLabels.join(' • '),
                        style: theme.textTheme.bodySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      PriceTag(salePrice: item.lineTotal, fontSize: 14),
                      QuantityStepper(
                        compact: true,
                        value: item.quantity,
                        onChanged: (q) => context.read<CartCubit>().updateQuantity(item.key, q),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartSummaryBar extends StatelessWidget {
  final CartState state;
  const _CartSummaryBar({required this.state});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Subtotal', style: theme.textTheme.bodyMedium),
                Text(formatRupees(state.subtotal), style: theme.textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Taxes and any eligible discount are calculated at checkout',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 14),
            PrimaryButton(
              label: 'Proceed to Checkout',
              icon: Icons.arrow_forward_rounded,
              onPressed: () => context.push('/checkout'),
            ),
          ],
        ),
      ),
    );
  }
}
