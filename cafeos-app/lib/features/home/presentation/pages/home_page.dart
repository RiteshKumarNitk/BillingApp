import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/image_carousel.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../authentication/presentation/cubit/auth_cubit.dart';
import '../../../authentication/presentation/cubit/auth_state.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../../cafes/presentation/widgets/cafe_card.dart';
import '../../../favorites/presentation/cubit/favorites_cubit.dart';
import '../../../favorites/presentation/cubit/favorites_state.dart';
import '../cubit/home_cubit.dart';
import '../cubit/home_state.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late final HomeCubit _homeCubit = sl<HomeCubit>();

  @override
  void initState() {
    super.initState();
    _homeCubit.loadAll();
    final authState = context.read<AuthCubit>().state;
    if (authState.status == AuthStatus.authenticated) {
      context.read<FavoritesCubit>().loadFavorites();
    }
  }

  @override
  void dispose() {
    _homeCubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = context.watch<AuthCubit>().state;

    return BlocProvider.value(
      value: _homeCubit,
      child: Scaffold(
        body: SafeArea(
          child: RefreshIndicator(
            onRefresh: () => _homeCubit.loadAll(),
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                authState.status == AuthStatus.authenticated ? 'Hey ${authState.customer?.name.split(' ').first ?? ''} 👋' : 'Hey there 👋',
                                style: theme.textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 2),
                              Text('Find your next cafe', style: theme.textTheme.displayMedium),
                            ],
                          ),
                        ),
                        _IconButton(icon: Icons.qr_code_scanner_rounded, onTap: () => context.push('/scan')),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => context.push('/search'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: theme.colorScheme.outline),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.search_rounded, color: theme.textTheme.bodySmall?.color, size: 20),
                            const SizedBox(width: 10),
                            Text('Search cafes, area...', style: theme.textTheme.bodyMedium),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                BlocBuilder<HomeCubit, HomeState>(
                  builder: (context, state) {
                    if (state.heroCandidates.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                        child: ImageCarousel(
                          height: 160,
                          slideBuilders: state.heroCandidates
                              .map<Widget Function(BuildContext)>((cafe) => (context) => InkWell(
                                    onTap: () => _openCafe(context, cafe),
                                    child: CarouselCoverImage(
                                      imageUrl: cafe.heroImageUrl,
                                      overlay: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(cafe.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
                                          if (cafe.tagline != null)
                                            Text(cafe.tagline!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),
                    );
                  },
                ),
                if (authState.status == AuthStatus.authenticated)
                  BlocBuilder<FavoritesCubit, FavoritesState>(
                    builder: (context, favState) {
                      if (favState.cafes.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                      return _HorizontalSection(
                        title: 'Your Favourites',
                        onSeeAll: () => context.push('/favorites'),
                        cafes: favState.cafes,
                        onTapCafe: _openCafe,
                      );
                    },
                  ),
                BlocBuilder<HomeCubit, HomeState>(
                  buildWhen: (a, b) => a.recentStatus != b.recentStatus || a.recentCafes != b.recentCafes,
                  builder: (context, state) {
                    if (state.recentCafes.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                    return _HorizontalSection(title: 'Recently Visited', cafes: state.recentCafes, onTapCafe: _openCafe);
                  },
                ),
                BlocBuilder<HomeCubit, HomeState>(
                  buildWhen: (a, b) => a.popularStatus != b.popularStatus || a.popularCafes != b.popularCafes,
                  builder: (context, state) {
                    if (state.popularStatus == HomeSectionStatus.loading || state.popularStatus == HomeSectionStatus.initial) {
                      return const _HorizontalSkeleton(title: 'Popular Cafes');
                    }
                    if (state.popularCafes.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                    return _HorizontalSection(
                      title: 'Popular Cafes',
                      onSeeAll: () => context.push('/cafes'),
                      cafes: state.popularCafes,
                      onTapCafe: _openCafe,
                    );
                  },
                ),
                SliverToBoxAdapter(
                  child: BlocBuilder<HomeCubit, HomeState>(
                    buildWhen: (a, b) => a.locationEnabled != b.locationEnabled,
                    builder: (context, state) => Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(state.locationEnabled ? 'Nearby Cafes' : 'All Cafes', style: theme.textTheme.headlineMedium),
                          TextButton(onPressed: () => context.push('/cafes'), child: const Text('See all')),
                        ],
                      ),
                    ),
                  ),
                ),
                BlocBuilder<HomeCubit, HomeState>(
                  builder: (context, state) {
                    if (state.nearbyStatus == HomeSectionStatus.loading || state.nearbyStatus == HomeSectionStatus.initial) {
                      return SliverToBoxAdapter(
                        child: AppShimmer(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Column(children: List.generate(2, (_) => const Padding(
                              padding: EdgeInsets.only(bottom: 14),
                              child: ShimmerBox(height: 190, borderRadius: BorderRadius.all(Radius.circular(20))),
                            ))),
                          ),
                        ),
                      );
                    }
                    if (state.nearbyStatus == HomeSectionStatus.error) {
                      return SliverToBoxAdapter(
                        child: ErrorStateView(message: 'Could not load cafes.', onRetry: () => _homeCubit.loadNearby()),
                      );
                    }
                    final cafes = state.nearbyCafes.take(5).toList();
                    if (cafes.isEmpty) {
                      return const SliverToBoxAdapter(
                        child: EmptyStateView(icon: Icons.local_cafe_outlined, title: 'No cafes yet', message: 'Check back soon as more cafes join CafeOS.'),
                      );
                    }
                    return SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                      sliver: SliverList.separated(
                        itemCount: cafes.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) => CafeCard(cafe: cafes[index], onTap: () => _openCafe(context, cafes[index])),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openCafe(BuildContext context, Cafe cafe) {
    context.push('/cafes/${cafe.id}', extra: cafe);
  }
}

class _IconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(14)),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }
}

class _HorizontalSection extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;
  final List<Cafe> cafes;
  final void Function(BuildContext, Cafe) onTapCafe;
  const _HorizontalSection({required this.title, this.onSeeAll, required this.cafes, required this.onTapCafe});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          SectionHeader(title: title, onSeeAll: onSeeAll),
          SizedBox(
            height: 206,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: cafes.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, i) => SizedBox(width: 240, child: CafeCard(cafe: cafes[i], onTap: () => onTapCafe(context, cafes[i]))),
            ),
          ),
        ],
      ),
    );
  }
}

class _HorizontalSkeleton extends StatelessWidget {
  final String title;
  const _HorizontalSkeleton({required this.title});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          SectionHeader(title: title),
          SizedBox(
            height: 206,
            child: AppShimmer(
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: 3,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, __) => const SizedBox(width: 240, child: ShimmerBox(height: 206, borderRadius: BorderRadius.all(Radius.circular(20)))),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
