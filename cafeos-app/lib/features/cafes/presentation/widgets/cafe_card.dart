import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/cafe.dart';

class CafeCard extends StatelessWidget {
  final Cafe cafe;
  final VoidCallback onTap;

  const CafeCard({super.key, required this.cafe, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: theme.colorScheme.outline),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  cafe.coverImageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: cafe.coverImageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: theme.colorScheme.outline.withValues(alpha: 0.3)),
                          errorWidget: (_, __, ___) => _fallbackCover(theme),
                        )
                      : _fallbackCover(theme),
                  if (cafe.distanceLabel.isNotEmpty)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(20)),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.location_on_rounded, size: 12, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(cafe.distanceLabel, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  if (cafe.logoUrl != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: CachedNetworkImage(imageUrl: cafe.logoUrl!, width: 40, height: 40, fit: BoxFit.cover),
                    )
                  else
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.storefront_rounded, color: AppColors.primary, size: 20),
                    ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(cafe.name, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                        if ((cafe.tagline ?? cafe.address) != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            cafe.tagline ?? cafe.address!,
                            style: theme.textTheme.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fallbackCover(ThemeData theme) {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.1),
      child: const Center(child: Icon(Icons.local_cafe_rounded, size: 36, color: AppColors.primary)),
    );
  }
}
