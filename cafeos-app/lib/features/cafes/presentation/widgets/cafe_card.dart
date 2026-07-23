import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../favorites/presentation/widgets/favorite_button.dart';
import '../../domain/entities/cafe.dart';

/// Cover image tag shared with CafeDetailsPage's header so tapping a card hero-animates straight
/// into the details screen instead of a hard cut.
String cafeCoverHeroTag(String cafeId) => 'cafe-cover-$cafeId';

class CafeCard extends StatefulWidget {
  final Cafe cafe;
  final VoidCallback onTap;
  // Off by default on any screen that might render the same cafe in more than one visible list at
  // once (Home's Nearby/Popular/Recently-Visited/Favourites sections can all include the same
  // cafe) — two simultaneously-mounted Heroes sharing a tag throws. Screens backed by a single,
  // duplicate-free list (Cafes tab, Search, Favourites, Related Cafes) can safely turn it on for
  // the card-to-details cover transition.
  final bool enableHero;

  const CafeCard({super.key, required this.cafe, required this.onTap, this.enableHero = false});

  @override
  State<CafeCard> createState() => _CafeCardState();
}

class _CafeCardState extends State<CafeCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final cafe = widget.cafe;

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: isDark ? Border.all(color: theme.colorScheme.outline) : null,
            boxShadow: isDark
                ? null
                : [BoxShadow(color: AppColors.lightCardShadow, blurRadius: 16, offset: const Offset(0, 6))],
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
                    Builder(builder: (context) {
                      final cover = cafe.coverImageUrl != null
                          ? CachedNetworkImage(
                              imageUrl: cafe.coverImageUrl!,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Container(color: theme.colorScheme.outline.withValues(alpha: 0.3)),
                              errorWidget: (_, __, ___) => _fallbackCover(theme),
                            )
                          : _fallbackCover(theme);
                      return widget.enableHero ? Hero(tag: cafeCoverHeroTag(cafe.id), child: cover) : cover;
                    }),
                    Positioned(top: 10, left: 10, child: FavoriteButton(cafe: cafe, size: 17)),
                    if (cafe.distanceLabel.isNotEmpty)
                      Positioned(
                        top: 10,
                        right: 10,
                        child: _ImageBadge(icon: Icons.location_on_rounded, label: cafe.distanceLabel),
                      ),
                    if (cafe.businessHours != null && cafe.businessHours!.isNotEmpty)
                      Positioned(
                        bottom: 10,
                        left: 10,
                        child: _ImageBadge(icon: Icons.schedule_rounded, label: cafe.businessHours!),
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
                    const SizedBox(width: 8),
                    Icon(Icons.chevron_right_rounded, color: theme.textTheme.bodySmall?.color, size: 20),
                  ],
                ),
              ),
            ],
          ),
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

class _ImageBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _ImageBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      constraints: const BoxConstraints(maxWidth: 150),
      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
          Flexible(child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}
