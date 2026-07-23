import 'package:flutter/material.dart';

/// Formats a rupee amount consistently everywhere a price appears (Menu, Cart, Checkout, Orders).
String formatRupees(num amount) {
  final rounded = amount.round();
  final str = rounded.abs().toString();
  final buffer = StringBuffer();
  for (int i = 0; i < str.length; i++) {
    final posFromEnd = str.length - i;
    buffer.write(str[i]);
    final isLastThree = posFromEnd <= 3;
    if (!isLastThree && (posFromEnd - 3) % 2 == 0) buffer.write(',');
  }
  return '${rounded < 0 ? '-' : ''}₹$buffer';
}

/// Sale price, with an optional strikethrough MRP and a discount-percentage badge — the same
/// visual language on Menu cards, the product detail sheet, and Cart/Checkout line items.
class PriceTag extends StatelessWidget {
  final double salePrice;
  final double? mrp;
  final double? discountPercentage;
  final double fontSize;

  const PriceTag({
    super.key,
    required this.salePrice,
    this.mrp,
    this.discountPercentage,
    this.fontSize = 15,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final showMrp = mrp != null && mrp! > salePrice;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          formatRupees(salePrice),
          style: theme.textTheme.titleMedium?.copyWith(fontSize: fontSize, fontWeight: FontWeight.w700),
        ),
        if (showMrp) ...[
          const SizedBox(width: 6),
          Text(
            formatRupees(mrp!),
            style: theme.textTheme.bodySmall?.copyWith(
              fontSize: fontSize - 3,
              decoration: TextDecoration.lineThrough,
              color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.6),
            ),
          ),
        ],
        if (discountPercentage != null && discountPercentage! > 0) ...[
          const SizedBox(width: 6),
          DiscountBadge(percentage: discountPercentage!),
        ],
      ],
    );
  }
}

class DiscountBadge extends StatelessWidget {
  final double percentage;
  const DiscountBadge({super.key, required this.percentage});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFF2E9E5B).withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '${percentage.toStringAsFixed(percentage.truncateToDouble() == percentage ? 0 : 1)}% OFF',
        style: const TextStyle(color: Color(0xFF2E9E5B), fontSize: 10, fontWeight: FontWeight.w800),
      ),
    );
  }
}
