import 'package:flutter/material.dart';
import 'price_tag.dart';

/// Persistent floating "View Cart" bar shown across Menu/Cafe-Details once the cart has items.
/// A pure UI component — callers (wrapped in a `BlocBuilder<CartCubit, CartState>`) pass in the
/// current count/total so this widget has no feature-layer dependency of its own.
class CartFabBadge extends StatelessWidget {
  final int itemCount;
  final double total;
  final VoidCallback onTap;

  const CartFabBadge({super.key, required this.itemCount, required this.total, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedSlide(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
      offset: itemCount > 0 ? Offset.zero : const Offset(0, 2),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: itemCount > 0 ? 1 : 0,
        child: IgnorePointer(
          ignoring: itemCount == 0,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Material(
              color: theme.colorScheme.primary,
              borderRadius: BorderRadius.circular(18),
              elevation: 6,
              shadowColor: theme.colorScheme.primary.withValues(alpha: 0.4),
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(18),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.onPrimary.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$itemCount',
                          style: TextStyle(color: theme.colorScheme.onPrimary, fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'View Cart',
                          style: TextStyle(color: theme.colorScheme.onPrimary, fontWeight: FontWeight.w700, fontSize: 15),
                        ),
                      ),
                      Text(
                        formatRupees(total),
                        style: TextStyle(color: theme.colorScheme.onPrimary, fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                      Icon(Icons.arrow_forward_rounded, color: theme.colorScheme.onPrimary, size: 18),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
