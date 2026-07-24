import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/cloudinary.dart';
import '../../../../shared/widgets/image_badge.dart';
import '../../../favorites/presentation/widgets/favorite_button.dart';
import '../../domain/entities/cafe.dart';
import 'cafe_card.dart' show cafeCoverHeroTag;

// Tuned for CafeGridCard's 4:3 image + two-line text block at a ~2-column phone width — errs
// slightly tall (rather than exactly tight) so a longer name/tagline never overflows the cell.
// Shared by every screen that lays cafes out as a grid (Cafes tab, Map's List view) so the two
// never drift out of sync.
const cafeGridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
  crossAxisCount: 2,
  crossAxisSpacing: 14,
  mainAxisSpacing: 14,
  childAspectRatio: 0.78,
);

/// Compact 2-column-grid variant of CafeCard — same source data and image-priority logic, sized
/// for roughly half-screen-width cells instead of a full-width row (Cafes tab, Map's List view).
/// Kept as its own widget rather than a `compact` flag on CafeCard so neither card's layout logic
/// has to branch for the other's constraints.
class CafeGridCard extends StatefulWidget {
  final Cafe cafe;
  final VoidCallback onTap;
  // Same collision rule as CafeCard: only turn this on for a screen where a cafe can appear at
  // most once (see cafe_card.dart's doc comment) — two mounted Heroes sharing a tag throws.
  final bool enableHero;
  const CafeGridCard({super.key, required this.cafe, required this.onTap, this.enableHero = false});

  @override
  State<CafeGridCard> createState() => _CafeGridCardState();
}

class _CafeGridCardState extends State<CafeGridCard> {
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
        scale: _pressed ? 0.96 : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(18),
            border: isDark ? Border.all(color: theme.colorScheme.outline) : null,
            boxShadow: isDark
                ? null
                : [
                    BoxShadow(
                      color: AppColors.lightCardShadow,
                      blurRadius: _pressed ? 6 : 14,
                      offset: Offset(0, _pressed ? 2 : 5),
                    ),
                  ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              AspectRatio(
                aspectRatio: 4 / 3,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Builder(builder: (context) {
                      final cover = cafe.heroImageUrl != null
                          ? CachedNetworkImage(
                              imageUrl: cloudinaryThumbnail(cafe.heroImageUrl!),
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Container(color: theme.colorScheme.outline.withValues(alpha: 0.3)),
                              errorWidget: (_, __, ___) => _fallbackCover(theme),
                            )
                          : _fallbackCover(theme);
                      return widget.enableHero ? Hero(tag: cafeCoverHeroTag(cafe.id), child: cover) : cover;
                    }),
                    // Bottom scrim so the distance badge stays legible over any photo.
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 36,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black.withValues(alpha: 0.45)],
                          ),
                        ),
                      ),
                    ),
                    Positioned(top: 8, left: 8, child: FavoriteButton(cafe: cafe, size: 15)),
                    if (cafe.distanceLabel.isNotEmpty)
                      Positioned(bottom: 8, right: 8, child: ImageBadge(icon: Icons.location_on_rounded, label: cafe.distanceLabel)),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(cafe.name, style: theme.textTheme.titleMedium?.copyWith(fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
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
      ),
    );
  }

  Widget _fallbackCover(ThemeData theme) {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.1),
      child: const Center(child: Icon(Icons.local_cafe_rounded, size: 30, color: AppColors.primary)),
    );
  }
}
