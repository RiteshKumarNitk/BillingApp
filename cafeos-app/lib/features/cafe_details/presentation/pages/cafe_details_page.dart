import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart' show Share;
import '../../../../core/di/service_locator.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../../../core/theme/cafe_theme.dart';
import '../../../../core/utils/app_constants.dart';
import '../../../../core/utils/cloudinary.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/cart_fab_badge.dart';
import '../../../../shared/widgets/coming_soon_view.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../../shared/utils/directions.dart';
import '../../../../shared/utils/launch_external_url.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../../cafes/domain/usecases/get_cafe_by_id_usecase.dart';
import '../../../cafes/domain/usecases/get_cafes_usecase.dart';
import '../../../cafes/presentation/widgets/cafe_card.dart';
import '../../../cart/presentation/cubit/cart_cubit.dart';
import '../../../cart/presentation/cubit/cart_state.dart';
import '../../../favorites/presentation/widgets/favorite_button.dart';
import '../../../menu/domain/entities/menu_item.dart';
import '../../../menu/presentation/cubit/menu_cubit.dart';
import '../../../menu/presentation/cubit/menu_state.dart';
import '../../../menu/presentation/widgets/menu_product_card.dart';
import '../../../menu/presentation/widgets/product_detail_sheet.dart';

/// Applies this specific cafe's own theme (colors + heading font from their Website Builder
/// choice) via a scoped Theme override — everything below this point in the tree looks like part
/// of that cafe's own brand, the same way billing-web's ThemeLayoutShell re-themes per tenant.
/// Chrome outside this screen (bottom nav, discovery, auth) stays on CafeOS's own identity.
///
/// A full cafe profile — header, about, offers, an embedded Menu (reusing the same MenuCubit/
/// MenuProductCard/ProductDetailSheet the standalone Menu screen uses, not a second
/// implementation), location, contact, a reviews placeholder, and related cafes — built entirely
/// from real API data. Renders instantly from whatever [Cafe] the caller already had (a card tap,
/// a scan, a favourite) then quietly refreshes via GET /cafes/:id in the background for
/// detail-only fields the list endpoint never carries (aboutText/email/phone/activeDiscounts).
class CafeDetailsPage extends StatefulWidget {
  final Cafe cafe;
  const CafeDetailsPage({super.key, required this.cafe});

  @override
  State<CafeDetailsPage> createState() => _CafeDetailsPageState();
}

class _CafeDetailsPageState extends State<CafeDetailsPage> {
  late Cafe _cafe = widget.cafe;
  late final MenuCubit _menuCubit = sl<MenuCubit>(param1: _cafe.id);
  final CartCubit _cartCubit = sl<CartCubit>();
  final GlobalKey _menuSectionKey = GlobalKey();

  List<Cafe> _relatedCafes = [];
  bool _relatedLoading = true;

  @override
  void initState() {
    super.initState();
    _menuCubit.loadMenu();
    _recordVisit();
    _loadFreshDetail();
    _loadRelatedCafes();
  }

  @override
  void dispose() {
    _menuCubit.close();
    super.dispose();
  }

  Future<void> _loadFreshDetail() async {
    final result = await sl<GetCafeByIdUseCase>()(_cafe.id);
    if (!mounted) return;
    result.match((_) {}, (fresh) => setState(() => _cafe = fresh));
  }

  Future<void> _recordVisit() async {
    final storage = sl<LocalStorageService>();
    final ids = List<String>.from(storage.recentlyViewedCafeIds)..removeWhere((id) => id == _cafe.id);
    ids.insert(0, _cafe.id);
    await storage.setRecentlyViewedCafeIds(ids.take(10).toList());
  }

  Future<void> _loadRelatedCafes() async {
    final params = _cafe.hasCoordinates
        ? GetCafesParams(lat: _cafe.latitude, lng: _cafe.longitude)
        : const GetCafesParams();
    final result = await sl<GetCafesUseCase>()(params);
    if (!mounted) return;
    result.match(
      (_) => setState(() => _relatedLoading = false),
      (cafes) => setState(() {
        _relatedCafes = cafes.where((c) => c.id != _cafe.id).take(10).toList();
        _relatedLoading = false;
      }),
    );
  }

  void _scrollToMenu() {
    final context = _menuSectionKey.currentContext;
    if (context != null) Scrollable.ensureVisible(context, duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
  }

  Future<void> _launch(Uri uri) => launchExternalUrl(context, uri);

  Uri get _websiteUri => Uri.parse(AppConstants.apiBaseUrl).replace(path: '/site/${_cafe.websiteSlug ?? _cafe.id}');

  Uri get _directionsUri => directionsUriFor(_cafe);

  void _shareCafe() {
    Share.share('${_cafe.name}${_cafe.tagline != null ? ' — ${_cafe.tagline}' : ''}\n$_websiteUri');
  }

  void _shareLocation() {
    Share.share('${_cafe.name} location: $_directionsUri');
  }

  @override
  Widget build(BuildContext context) {
    final cafeTheme = CafeTheme.build(_cafe.appearance, brightness: MediaQuery.platformBrightnessOf(context));

    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _menuCubit),
        BlocProvider.value(value: _cartCubit),
      ],
      child: Theme(
        data: cafeTheme,
        child: Scaffold(
          body: CustomScrollView(
            slivers: [
              _HeaderSliver(cafe: _cafe, onShare: _shareCafe),
              SliverToBoxAdapter(child: _InfoSection(cafe: _cafe)),
              if (_cafe.aboutText != null && _cafe.aboutText!.isNotEmpty) SliverToBoxAdapter(child: _AboutSection(text: _cafe.aboutText!)),
              if (_cafe.activeDiscounts.isNotEmpty) SliverToBoxAdapter(child: _OffersSection(discounts: _cafe.activeDiscounts)),
              if (_cafe.galleryImages.isNotEmpty) SliverToBoxAdapter(child: _GallerySection(images: _cafe.galleryImages)),
              SliverToBoxAdapter(
                key: _menuSectionKey,
                child: _MenuSection(cafe: _cafe),
              ),
              SliverToBoxAdapter(
                child: _LocationSection(cafe: _cafe, onDirections: () => _launch(_directionsUri), onShare: _shareLocation),
              ),
              SliverToBoxAdapter(
                child: _ContactSection(
                  cafe: _cafe,
                  onCall: _cafe.phone != null ? () => _launch(Uri.parse('tel:${_cafe.phone}')) : null,
                  onEmail: _cafe.email != null ? () => _launch(Uri.parse('mailto:${_cafe.email}')) : null,
                  onWebsite: () => _launch(_websiteUri),
                ),
              ),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),
                    SectionHeader(title: 'Reviews'),
                    // No fixed height — ComingSoonView's Center shrink-wraps to its own content
                    // (icon/title/message) once maxHeight is unbounded, same as every other sliver
                    // section on this page; a fixed box here overflows once the message wraps.
                    const ComingSoonView(
                      icon: Icons.reviews_outlined,
                      title: 'Reviews are coming soon',
                      message: 'Customer ratings and photos will show up here in a future update.',
                    ),
                  ],
                ),
              ),
              if (_relatedLoading || _relatedCafes.isNotEmpty)
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 12),
                      const SectionHeader(title: 'Related Cafes'),
                      SizedBox(
                        height: 206,
                        child: _relatedLoading
                            ? AppShimmer(
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                  itemCount: 3,
                                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                                  itemBuilder: (_, __) => const SizedBox(width: 240, child: ShimmerBox(height: 206, borderRadius: BorderRadius.all(Radius.circular(20)))),
                                ),
                              )
                            : ListView.separated(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                itemCount: _relatedCafes.length,
                                separatorBuilder: (_, __) => const SizedBox(width: 12),
                                itemBuilder: (context, i) {
                                  final related = _relatedCafes[i];
                                  return SizedBox(
                                    width: 240,
                                    child: CafeCard(cafe: related, onTap: () => context.pushReplacement('/cafes/${related.id}', extra: related)),
                                  );
                                },
                              ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
          bottomNavigationBar: _BottomActionBar(
            cafe: _cafe,
            onOrderNow: _scrollToMenu,
            onCall: _cafe.phone != null ? () => _launch(Uri.parse('tel:${_cafe.phone}')) : null,
            onDirections: () => _launch(_directionsUri),
          ),
          floatingActionButton: BlocBuilder<CartCubit, CartState>(
            builder: (context, cart) {
              if (cart.tenantId != _cafe.id) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(bottom: 72),
                child: CartFabBadge(itemCount: cart.itemCount, total: cart.subtotal, onTap: () => context.push('/cart')),
              );
            },
          ),
          floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
        ),
      ),
    );
  }
}

class _HeaderSliver extends StatelessWidget {
  final Cafe cafe;
  final VoidCallback onShare;
  const _HeaderSliver({required this.cafe, required this.onShare});

  @override
  Widget build(BuildContext context) {
    final cafeTheme = Theme.of(context);
    return SliverAppBar(
      expandedHeight: 240,
      pinned: true,
      backgroundColor: cafeTheme.scaffoldBackgroundColor,
      foregroundColor: cafeTheme.appBarTheme.foregroundColor,
      actions: [
        IconButton(icon: const Icon(Icons.share_rounded), onPressed: onShare),
        Padding(padding: const EdgeInsets.only(right: 12), child: FavoriteButton(cafe: cafe, size: 20)),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Hero(
          tag: cafeCoverHeroTag(cafe.id),
          child: cafe.heroImageUrl != null
              ? CachedNetworkImage(imageUrl: cafe.heroImageUrl!, fit: BoxFit.cover)
              : Container(color: cafeTheme.colorScheme.primary.withValues(alpha: 0.15)),
        ),
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  final Cafe cafe;
  const _InfoSection({required this.cafe});

  @override
  Widget build(BuildContext context) {
    final cafeTheme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
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
        ],
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

class _AboutSection extends StatelessWidget {
  final String text;
  const _AboutSection({required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('About', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(text, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _OffersSection extends StatelessWidget {
  final List<CafeDiscountSummary> discounts;
  const _OffersSection({required this.discounts});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Offers', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 10),
          ...discounts.map((d) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(color: const Color(0xFF2E9E5B).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(Icons.local_offer_rounded, size: 18, color: Color(0xFF2E9E5B)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${d.discountPercentage.toStringAsFixed(0)}% off${d.applicableCategory != null ? ' on ${d.applicableCategory}' : ' storewide'} — ${d.name}',
                        style: const TextStyle(color: Color(0xFF2E9E5B), fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

class _GallerySection extends StatelessWidget {
  final List<GalleryImage> images;
  const _GallerySection({required this.images});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 10),
          child: Text('Gallery', style: theme.textTheme.headlineMedium),
        ),
        SizedBox(
          height: 110,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: images.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) => GestureDetector(
              onTap: () => Navigator.of(context).push(PageRouteBuilder<void>(
                opaque: false,
                barrierColor: Colors.black,
                pageBuilder: (context, _, __) => _GalleryViewer(images: images, initialIndex: i),
              )),
              child: Hero(
                tag: 'gallery-$i-${images[i].url}',
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: CachedNetworkImage(
                    imageUrl: cloudinaryThumbnail(images[i].url, width: 220),
                    width: 110,
                    height: 110,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _GalleryViewer extends StatefulWidget {
  final List<GalleryImage> images;
  final int initialIndex;
  const _GalleryViewer({required this.images, required this.initialIndex});

  @override
  State<_GalleryViewer> createState() => _GalleryViewerState();
}

class _GalleryViewerState extends State<_GalleryViewer> {
  late final PageController _controller = PageController(initialPage: widget.initialIndex);
  late int _index = widget.initialIndex;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        title: Text('${_index + 1} / ${widget.images.length}'),
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.images.length,
        onPageChanged: (i) => setState(() => _index = i),
        itemBuilder: (context, i) => Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: Hero(
                tag: 'gallery-$i-${widget.images[i].url}',
                child: InteractiveViewer(
                  child: CachedNetworkImage(imageUrl: widget.images[i].url, fit: BoxFit.contain),
                ),
              ),
            ),
            if (widget.images[i].caption != null && widget.images[i].caption!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(widget.images[i].caption!, style: const TextStyle(color: Colors.white70), textAlign: TextAlign.center),
              ),
          ],
        ),
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  final Cafe cafe;
  const _MenuSection({required this.cafe});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
          child: Text('Menu', style: theme.textTheme.headlineMedium),
        ),
        BlocBuilder<MenuCubit, MenuState>(
          builder: (context, state) {
            if (state.status == MenuStatus.loading || state.status == MenuStatus.initial) {
              return Padding(
                padding: const EdgeInsets.all(16),
                child: AppShimmer(
                  child: Column(
                    children: List.generate(3, (_) => const Padding(
                      padding: EdgeInsets.only(bottom: 10),
                      child: ShimmerBox(height: 108, borderRadius: BorderRadius.all(Radius.circular(18))),
                    )),
                  ),
                ),
              );
            }
            if (state.status == MenuStatus.error) {
              return Padding(
                padding: const EdgeInsets.all(20),
                child: Text(state.errorMessage ?? 'Could not load the menu', style: theme.textTheme.bodyMedium),
              );
            }
            if (state.categories.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(20),
                child: Text('No menu items yet.', style: theme.textTheme.bodyMedium),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (state.categories.length > 1 || state.hasFeaturedItems)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: SizedBox(
                      height: 36,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        children: [
                          if (state.categories.length > 1)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: AppChip(label: 'All', selected: state.selectedCategory == null, onTap: () => context.read<MenuCubit>().selectCategory(null)),
                            ),
                          if (state.hasFeaturedItems)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: AppChip(label: 'Popular', icon: Icons.star_rounded, selected: state.featuredOnly, onTap: () => context.read<MenuCubit>().toggleFeaturedOnly()),
                            ),
                          ...state.categories.map((c) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: AppChip(label: c.category, selected: state.selectedCategory == c.category, onTap: () => context.read<MenuCubit>().selectCategory(c.category)),
                              )),
                        ],
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: state.visibleCategories.expand((category) => [
                          if (state.categories.length > 1)
                            Padding(
                              padding: const EdgeInsets.only(top: 12, bottom: 10),
                              child: Text(category.category, style: theme.textTheme.titleMedium),
                            ),
                          ...category.items.map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: MenuProductCard(item: item, onTap: () => _openProduct(context, item)),
                              )),
                        ]).toList(),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  void _openProduct(BuildContext context, MenuItem item) {
    ProductDetailSheet.show(context, item: item, cafe: cafe);
  }
}

class _LocationSection extends StatelessWidget {
  final Cafe cafe;
  final VoidCallback onDirections;
  final VoidCallback onShare;
  const _LocationSection({required this.cafe, required this.onDirections, required this.onShare});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (cafe.address == null && !cafe.hasCoordinates) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Location', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 10),
          if (cafe.address != null) _InfoRow(icon: Icons.location_on_outlined, text: cafe.address!),
          if (cafe.landmark != null && cafe.landmark!.isNotEmpty) _InfoRow(icon: Icons.near_me_outlined, text: cafe.landmark!),
          if (cafe.cityStateLine.isNotEmpty) _InfoRow(icon: Icons.location_city_outlined, text: cafe.cityStateLine),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: OutlinedButton.icon(onPressed: onDirections, icon: const Icon(Icons.directions_rounded, size: 18), label: const Text('Get Directions'))),
              const SizedBox(width: 10),
              Expanded(child: OutlinedButton.icon(onPressed: onShare, icon: const Icon(Icons.ios_share_rounded, size: 18), label: const Text('Share Location'))),
            ],
          ),
        ],
      ),
    );
  }
}

class _ContactSection extends StatelessWidget {
  final Cafe cafe;
  final VoidCallback? onCall;
  final VoidCallback? onEmail;
  final VoidCallback onWebsite;
  const _ContactSection({required this.cafe, this.onCall, this.onEmail, required this.onWebsite});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (onCall == null && onEmail == null && cafe.websiteSlug == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Contact', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 8),
          if (onCall != null) _ContactTile(icon: Icons.call_outlined, label: 'Call', subtitle: cafe.phone!, onTap: onCall!),
          if (onEmail != null) _ContactTile(icon: Icons.mail_outline_rounded, label: 'Email', subtitle: cafe.email!, onTap: onEmail!),
          if (cafe.websiteSlug != null) _ContactTile(icon: Icons.language_rounded, label: 'Visit Website', subtitle: 'View full website', onTap: onWebsite),
        ],
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  const _ContactTile({required this.icon, required this.label, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, size: 18, color: theme.colorScheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: theme.textTheme.titleMedium?.copyWith(fontSize: 14)),
                  Text(subtitle, style: theme.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, size: 18, color: theme.textTheme.bodySmall?.color),
          ],
        ),
      ),
    );
  }
}

class _BottomActionBar extends StatelessWidget {
  final Cafe cafe;
  final VoidCallback onOrderNow;
  final VoidCallback? onCall;
  final VoidCallback onDirections;
  const _BottomActionBar({required this.cafe, required this.onOrderNow, this.onCall, required this.onDirections});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: Row(
          children: [
            if (onCall != null) ...[
              _RoundIconButton(icon: Icons.call_rounded, onTap: onCall!),
              const SizedBox(width: 10),
            ],
            _RoundIconButton(icon: Icons.directions_rounded, onTap: onDirections),
            const SizedBox(width: 10),
            Expanded(
              child: BlocBuilder<CartCubit, CartState>(
                builder: (context, cart) {
                  final hasCartHere = cart.tenantId == cafe.id && !cart.isEmpty;
                  return PrimaryButton(
                    label: hasCartHere ? 'View Cart • ${formatRupees(cart.subtotal)}' : 'Order Now',
                    icon: hasCartHere ? Icons.shopping_bag_rounded : Icons.restaurant_menu_rounded,
                    onPressed: hasCartHere ? () => context.push('/cart') : onOrderNow,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _RoundIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.primary.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Icon(icon, color: theme.colorScheme.primary, size: 22),
        ),
      ),
    );
  }
}
