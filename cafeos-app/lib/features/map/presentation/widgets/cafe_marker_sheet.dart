import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/utils/directions.dart';
import '../../../../shared/utils/launch_external_url.dart';
import '../../../cafes/domain/entities/cafe.dart';

Future<void> showCafeMarkerSheet(BuildContext context, Cafe cafe) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _CafeMarkerSheet(cafe: cafe),
  );
}

class _CafeMarkerSheet extends StatelessWidget {
  final Cafe cafe;
  const _CafeMarkerSheet({required this.cafe});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isOpen = cafe.isOpenNow; // null = unknown, never fabricated

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(24)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: cafe.logoUrl != null
                      ? CachedNetworkImage(imageUrl: cafe.logoUrl!, width: 56, height: 56, fit: BoxFit.cover)
                      : Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.storefront_rounded, color: AppColors.primary, size: 26),
                        ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(cafe.name, style: theme.textTheme.headlineMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (cafe.distanceLabel.isNotEmpty)
                            _MetaChip(icon: Icons.location_on_outlined, label: cafe.distanceLabel),
                          if (isOpen != null)
                            _MetaChip(
                              icon: isOpen ? Icons.check_circle_outline_rounded : Icons.cancel_outlined,
                              label: isOpen ? 'Open now' : 'Closed',
                              color: isOpen ? AppColors.success : AppColors.error,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (cafe.address != null) ...[
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.place_outlined, size: 16, color: theme.textTheme.bodySmall?.color),
                  const SizedBox(width: 8),
                  Expanded(child: Text(cafe.address!, style: theme.textTheme.bodyMedium)),
                ],
              ),
            ],
            if (cafe.aboutText != null && cafe.aboutText!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(cafe.aboutText!, style: theme.textTheme.bodySmall, maxLines: 3, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => launchExternalUrl(context, directionsUriFor(cafe)),
                    icon: const Icon(Icons.directions_rounded, size: 18),
                    label: const Text('Directions'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push('/cafes/${cafe.id}', extra: cafe);
                    },
                    icon: const Icon(Icons.storefront_outlined, size: 18),
                    label: const Text('View Cafe'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/cafes/${cafe.id}/menu', extra: cafe);
                },
                icon: const Icon(Icons.restaurant_menu_rounded, size: 18),
                label: const Text('Order Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  const _MetaChip({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = color ?? theme.textTheme.bodySmall?.color;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: c),
        const SizedBox(width: 4),
        Text(label, style: theme.textTheme.bodySmall?.copyWith(color: c, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
