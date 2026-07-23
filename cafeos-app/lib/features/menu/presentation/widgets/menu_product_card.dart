import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../domain/entities/menu_item.dart';

class MenuProductCard extends StatelessWidget {
  final MenuItem item;
  final VoidCallback onTap;

  const MenuProductCard({super.key, required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final outOfStock = item.isOutOfStock;

    return Opacity(
      opacity: outOfStock ? 0.55 : 1,
      child: InkWell(
        onTap: outOfStock ? null : onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (item.foodType != null) ...[
                          _FoodTypeIndicator(isVeg: item.isVeg),
                          const SizedBox(width: 6),
                        ],
                        if (item.isCombo) ...[
                          Icon(Icons.ramen_dining_rounded, size: 14, color: theme.colorScheme.primary),
                          const SizedBox(width: 4),
                        ],
                        Flexible(child: Text(item.name, style: theme.textTheme.titleMedium?.copyWith(fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        if (item.isFeatured) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.star_rounded, size: 14, color: Color(0xFFE8A93B)),
                        ],
                      ],
                    ),
                    if (item.description != null && item.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(item.description!, style: theme.textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                    if (item.isCombo && item.comboComponents.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        item.comboComponents.map((c) => '${c.quantity}x ${c.name}${c.variantName != null ? ' (${c.variantName})' : ''}').join(' • '),
                        style: theme.textTheme.bodySmall?.copyWith(fontStyle: FontStyle.italic),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 10),
                    PriceTag(
                      salePrice: item.hasVariants ? item.variants.map((v) => v.salePrice).reduce((a, b) => a < b ? a : b) : item.salePrice,
                      mrp: item.hasVariants ? null : item.mrp,
                      discountPercentage: item.activeDiscount?.discountPercentage,
                    ),
                    if (outOfStock) ...[
                      const SizedBox(height: 4),
                      Text('Out of stock', style: TextStyle(color: theme.colorScheme.error, fontSize: 11, fontWeight: FontWeight.w700)),
                    ] else if (item.hasVariants) ...[
                      const SizedBox(height: 4),
                      Text('${item.variants.length} sizes available', style: theme.textTheme.bodySmall),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: item.imageUrl != null
                    ? CachedNetworkImage(imageUrl: item.imageUrl!, width: 84, height: 84, fit: BoxFit.cover)
                    : Container(
                        width: 84,
                        height: 84,
                        color: theme.colorScheme.primary.withValues(alpha: 0.1),
                        child: Icon(item.isCombo ? Icons.ramen_dining_rounded : Icons.local_cafe_rounded, color: theme.colorScheme.primary, size: 32),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The familiar green-square/brown-square-with-a-dot veg/non-veg mark used by every Indian food
/// delivery app (Zomato/Swiggy) — instantly recognizable, so it's used here rather than inventing
/// a new symbol.
class _FoodTypeIndicator extends StatelessWidget {
  final bool isVeg;
  const _FoodTypeIndicator({required this.isVeg});

  @override
  Widget build(BuildContext context) {
    final color = isVeg ? const Color(0xFF2E9E5B) : const Color(0xFF8B4513);
    return Container(
      width: 14,
      height: 14,
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(border: Border.all(color: color, width: 1.3), borderRadius: BorderRadius.circular(3)),
      child: Center(child: Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle))),
    );
  }
}
