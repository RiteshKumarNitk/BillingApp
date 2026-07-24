import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../cart/presentation/cubit/cart_cubit.dart';
import '../../../cart/presentation/cubit/cart_state.dart';
import '../cubit/checkout_cubit.dart';
import '../cubit/checkout_state.dart';
import 'order_success_page.dart';

class CheckoutPage extends StatelessWidget {
  const CheckoutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<CheckoutCubit>(),
      child: BlocProvider.value(value: sl<CartCubit>(), child: const _CheckoutView()),
    );
  }
}

class _CheckoutView extends StatefulWidget {
  const _CheckoutView();

  @override
  State<_CheckoutView> createState() => _CheckoutViewState();
}

class _CheckoutViewState extends State<_CheckoutView> {
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return BlocListener<CheckoutCubit, CheckoutState>(
      listener: (context, state) {
        if (state.status == CheckoutStatus.success && state.placedOrder != null) {
          final order = state.placedOrder!;
          final cart = context.read<CartCubit>().state;
          final args = OrderSuccessArgs(orderId: order.id, tenantName: cart.tenantName ?? '', items: cart.items, netAmount: order.netAmount);
          context.read<CartCubit>().clear();
          context.pushReplacement('/order-success', extra: args);
        } else if (state.status == CheckoutStatus.error) {
          AppToast.error(context, state.errorMessage ?? 'Could not place your order');
        }
      },
      child: BlocBuilder<CartCubit, CartState>(
        builder: (context, cart) {
          if (cart.isEmpty) {
            return Scaffold(
              appBar: AppBar(title: const Text('Checkout')),
              body: const EmptyStateView(icon: Icons.shopping_bag_outlined, title: 'Cart is empty', message: 'Add something to your cart before checking out.'),
            );
          }

          return Scaffold(
            appBar: AppBar(title: const Text('Checkout')),
            body: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(cart.tenantName ?? '', style: theme.textTheme.headlineMedium),
                const SizedBox(height: 4),
                Text('${cart.itemCount} item${cart.itemCount == 1 ? '' : 's'}', style: theme.textTheme.bodyMedium),
                const SizedBox(height: 20),
                _OrderTypeCard(tableLabel: cart.tableLabel),
                const SizedBox(height: 20),
                Text('Order Notes (optional)', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                AppTextField(controller: _notesController, label: 'e.g. less sugar, no onions', maxLines: 2),
                const SizedBox(height: 24),
                Text('Order Summary', style: theme.textTheme.titleMedium),
                const SizedBox(height: 10),
                ...cart.items.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: Text('${item.quantity}x ${item.name}', style: theme.textTheme.bodyMedium)),
                          const SizedBox(width: 8),
                          Text(formatRupees(item.lineTotal), style: theme.textTheme.bodyMedium),
                        ],
                      ),
                    )),
                const Divider(height: 28),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Subtotal', style: theme.textTheme.titleMedium),
                    Text(formatRupees(cart.subtotal), style: theme.textTheme.titleMedium),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Any eligible discount and applicable tax are calculated by the cafe when you submit.',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            bottomNavigationBar: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: BlocBuilder<CheckoutCubit, CheckoutState>(
                  builder: (context, checkoutState) {
                    final submitting = checkoutState.status == CheckoutStatus.submitting;
                    return PrimaryButton(
                      label: submitting ? 'Placing Order...' : 'Place Order • ${formatRupees(cart.subtotal)}',
                      isLoading: submitting,
                      onPressed: submitting
                          ? null
                          : () => context.read<CheckoutCubit>().placeOrder(
                                tenantId: cart.tenantId!,
                                items: cart.items,
                                notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
                                tableToken: cart.tableToken,
                              ),
                    );
                  },
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _OrderTypeCard extends StatelessWidget {
  final String? tableLabel;
  const _OrderTypeCard({this.tableLabel});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDineIn = tableLabel != null;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(isDineIn ? Icons.table_restaurant_rounded : Icons.shopping_bag_outlined, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(isDineIn ? 'Dine-in' : 'Takeaway', style: theme.textTheme.titleMedium),
                Text(
                  isDineIn ? 'Table $tableLabel — from your QR scan' : 'Pick up your order at the counter',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
