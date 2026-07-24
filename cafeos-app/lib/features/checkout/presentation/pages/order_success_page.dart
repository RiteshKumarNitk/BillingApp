import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../cart/domain/entities/cart_item.dart';

/// Bundles what the checkout screen already has in hand at the moment an order succeeds — no new
/// API call, no fabricated "estimated prep time" (that data doesn't exist on the backend).
class OrderSuccessArgs {
  final String orderId;
  final String tenantName;
  final List<CartItem> items;
  final double netAmount;

  const OrderSuccessArgs({required this.orderId, required this.tenantName, required this.items, required this.netAmount});
}

class OrderSuccessPage extends StatelessWidget {
  final OrderSuccessArgs args;
  const OrderSuccessPage({super.key, required this.args});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      Container(
                        width: 84,
                        height: 84,
                        decoration: BoxDecoration(color: const Color(0xFF2E9E5B).withValues(alpha: 0.12), shape: BoxShape.circle),
                        child: const Icon(Icons.check_rounded, color: Color(0xFF2E9E5B), size: 48),
                      ),
                      const SizedBox(height: 20),
                      Text('Order placed!', style: theme.textTheme.displayMedium, textAlign: TextAlign.center),
                      const SizedBox(height: 6),
                      Text(args.tenantName, style: theme.textTheme.bodyMedium, textAlign: TextAlign.center),
                      const SizedBox(height: 4),
                      Text('Order #${args.orderId.substring(0, 8).toUpperCase()}', style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
                      const SizedBox(height: 28),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: theme.colorScheme.outline),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Order Summary', style: theme.textTheme.titleMedium),
                            const SizedBox(height: 10),
                            ...args.items.map((item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Row(
                                    children: [
                                      Expanded(child: Text('${item.quantity}x ${item.name}', style: theme.textTheme.bodyMedium)),
                                      Text(formatRupees(item.lineTotal), style: theme.textTheme.bodyMedium),
                                    ],
                                  ),
                                )),
                            const Divider(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Total Paid', style: theme.textTheme.titleMedium),
                                PriceTag(salePrice: args.netAmount, fontSize: 16),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              PrimaryButton(label: 'View Order', onPressed: () => context.pushReplacement('/orders/${args.orderId}')),
              const SizedBox(height: 12),
              PrimaryButton(label: 'Continue Shopping', outlined: true, onPressed: () => context.go('/home')),
            ],
          ),
        ),
      ),
    );
  }
}
