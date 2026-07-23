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
                        if (item.isCombo) ...[
                          Icon(Icons.ramen_dining_rounded, size: 14, color: theme.colorScheme.primary),
                          const SizedBox(width: 4),
                        ],
                        Flexible(child: Text(item.name, style: theme.textTheme.titleMedium?.copyWith(fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis)),
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
