import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../cubit/cafes_cubit.dart';
import '../cubit/cafes_state.dart';
import '../widgets/cafe_card.dart';

const _radiusOptions = <double?>[null, 1, 3, 5, 10];

class CafesListPage extends StatefulWidget {
  const CafesListPage({super.key});

  @override
  State<CafesListPage> createState() => _CafesListPageState();
}

class _CafesListPageState extends State<CafesListPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<CafesCubit>().loadCafes();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cafes')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search cafes by name or area',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
              ),
              onSubmitted: (value) => context.read<CafesCubit>().loadCafes(search: value),
            ),
          ),
          BlocBuilder<CafesCubit, CafesState>(
            buildWhen: (a, b) => a.sort != b.sort || a.radiusKm != b.radiusKm || a.locationEnabled != b.locationEnabled,
            builder: (context, state) => SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(left: 16, right: 16, bottom: 8),
                children: [
                  AppChip(
                    label: 'Nearest',
                    icon: Icons.near_me_rounded,
                    selected: state.sort != 'popular',
                    onTap: () {
                      if (state.sort == 'popular') context.read<CafesCubit>().toggleSort();
                    },
                  ),
                  const SizedBox(width: 8),
                  AppChip(
                    label: 'Popular',
                    icon: Icons.local_fire_department_rounded,
                    selected: state.sort == 'popular',
                    onTap: () {
                      if (state.sort != 'popular') context.read<CafesCubit>().toggleSort();
                    },
                  ),
                  if (state.locationEnabled && state.sort != 'popular') ...[
                    const SizedBox(width: 14),
                    Container(width: 1, color: Theme.of(context).colorScheme.outline),
                    const SizedBox(width: 14),
                    ..._radiusOptions.map((km) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: AppChip(
                            label: km == null ? 'Any distance' : '${km.toInt()} km',
                            selected: state.radiusKm == km,
                            onTap: () => context.read<CafesCubit>().setRadius(km),
                          ),
                        )),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: BlocBuilder<CafesCubit, CafesState>(
              builder: (context, state) {
                switch (state.status) {
                  case CafesStatus.initial:
                  case CafesStatus.loading:
                    return _buildLoading();
                  case CafesStatus.error:
                    return ErrorStateView(
                      message: state.errorMessage ?? 'Could not load cafes.',
                      onRetry: () => context.read<CafesCubit>().loadCafes(search: _searchController.text),
                    );
                  case CafesStatus.loaded:
                    final cafes = state.visibleCafes;
                    if (cafes.isEmpty) {
                      return EmptyStateView(
                        icon: Icons.local_cafe_outlined,
                        title: 'No cafes found',
                        message: state.radiusKm != null
                            ? 'No cafes within ${state.radiusKm!.toInt()} km — try a wider distance.'
                            : 'Try a different search, or check back soon as more cafes join CafeOS.',
                      );
                    }
                    return RefreshIndicator(
                      onRefresh: () => context.read<CafesCubit>().loadCafes(search: _searchController.text, sort: state.sort),
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        itemCount: cafes.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final cafe = cafes[index];
                          return CafeCard(cafe: cafe, enableHero: true, onTap: () => context.push('/cafes/${cafe.id}', extra: cafe));
                        },
                      ),
                    );
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    return AppShimmer(
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (_, __) => const ShimmerBox(height: 190, borderRadius: BorderRadius.all(Radius.circular(20))),
      ),
    );
  }
}
