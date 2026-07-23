import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../../../core/theme/cafe_theme.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../../cafes/domain/usecases/get_cafe_by_id_usecase.dart';
import '../../../favorites/presentation/widgets/favorite_button.dart';

/// Applies this specific cafe's own theme (colors + heading font from their Website Builder
/// choice) via a scoped Theme override — everything below this point in the tree looks like part
/// of that cafe's own brand, the same way billing-web's ThemeLayoutShell re-themes per tenant.
/// Chrome outside this screen (bottom nav, discovery, auth) stays on CafeOS's own identity.
///
/// Renders instantly from whatever [Cafe] the caller already had (a list-card tap, a scan, a
/// favourite) then quietly refreshes via GET /cafes/:id in the background to pick up
/// detail-only fields the list endpoint never carries (activeDiscounts) — no loading spinner
/// blocking a screen that already has enough to render.
class CafeDetailsPage extends StatefulWidget {
  final Cafe cafe;
  const CafeDetailsPage({super.key, required this.cafe});

  @override
  State<CafeDetailsPage> createState() => _CafeDetailsPageState();
}

class _CafeDetailsPageState extends State<CafeDetailsPage> {
  late Cafe _cafe;

  @override
  void initState() {
    super.initState();
    _cafe = widget.cafe;
    sl<GetCafeByIdUseCase>()(_cafe.id).then((result) {
      if (!mounted) return;
      result.match((_) {}, (fresh) => setState(() => _cafe = fresh));
    });
    _recordVisit();
  }

  Future<void> _recordVisit() async {
    final storage = sl<LocalStorageService>();
    final ids = List<String>.from(storage.recentlyViewedCafeIds)..removeWhere((id) => id == _cafe.id);
    ids.insert(0, _cafe.id);
    await storage.setRecentlyViewedCafeIds(ids.take(10).toList());
  }

  @override
  Widget build(BuildContext context) {
    final cafe = _cafe;
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
              actions: [
                Padding(padding: const EdgeInsets.only(right: 12), child: FavoriteButton(cafe: cafe, size: 20)),
              ],
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
                    if (cafe.activeDiscounts.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      ...cafe.activeDiscounts.map((d) => Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2E9E5B).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.local_offer_rounded, size: 15, color: Color(0xFF2E9E5B)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${d.discountPercentage.toStringAsFixed(0)}% off${d.applicableCategory != null ? ' on ${d.applicableCategory}' : ' storewide'} — ${d.name}',
                                    style: const TextStyle(color: Color(0xFF2E9E5B), fontSize: 12, fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ],
                            ),
                          )),
                    ],
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
