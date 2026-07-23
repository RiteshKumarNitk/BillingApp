import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/cafe_theme.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../../../shared/widgets/primary_button.dart';

/// Applies this specific cafe's own theme (colors + heading font from their Website Builder
/// choice) via a scoped Theme override — everything below this point in the tree looks like part
/// of that cafe's own brand, the same way billing-web's ThemeLayoutShell re-themes per tenant.
/// Chrome outside this screen (bottom nav, discovery, auth) stays on CafeOS's own identity.
class CafeDetailsPage extends StatelessWidget {
  final Cafe cafe;
  const CafeDetailsPage({super.key, required this.cafe});

  @override
  Widget build(BuildContext context) {
    final brightness = MediaQuery.platformBrightnessOf(context);
    final cafeTheme = CafeTheme.build(cafe.appearance, brightness: brightness);

    return Theme(
      data: cafeTheme,
      child: Scaffold(
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              backgroundColor: cafeTheme.scaffoldBackgroundColor,
              foregroundColor: cafeTheme.appBarTheme.foregroundColor,
              flexibleSpace: FlexibleSpaceBar(
                background: cafe.coverImageUrl != null
                    ? CachedNetworkImage(imageUrl: cafe.coverImageUrl!, fit: BoxFit.cover)
                    : Container(color: cafeTheme.colorScheme.primary.withValues(alpha: 0.15)),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (cafe.logoUrl != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: CachedNetworkImage(imageUrl: cafe.logoUrl!, width: 56, height: 56, fit: BoxFit.cover),
                          ),
                        if (cafe.logoUrl != null) const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(cafe.name, style: cafeTheme.textTheme.displayLarge?.copyWith(fontSize: 24)),
                              if (cafe.tagline != null) Text(cafe.tagline!, style: cafeTheme.textTheme.bodyMedium),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    if (cafe.address != null) _InfoRow(icon: Icons.location_on_outlined, text: cafe.address!),
                    if (cafe.businessHours != null) _InfoRow(icon: Icons.schedule_outlined, text: cafe.businessHours!),
                    const SizedBox(height: 28),
                    PrimaryButton(
                      label: 'View Menu & Order',
                      icon: Icons.restaurant_menu_rounded,
                      onPressed: () => context.push('/cafes/${cafe.id}/menu', extra: cafe),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
