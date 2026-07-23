import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../cafes/presentation/widgets/cafe_card.dart';
import '../cubit/favorites_cubit.dart';
import '../cubit/favorites_state.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  @override
  void initState() {
    super.initState();
    sl<FavoritesCubit>().loadFavorites();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: sl<FavoritesCubit>(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Favourite Cafes')),
        body: BlocBuilder<FavoritesCubit, FavoritesState>(
          builder: (context, state) {
            if (state.status == FavoritesStatus.loading || state.status == FavoritesStatus.initial) {
              return AppShimmer(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: 4,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (_, __) => const ShimmerBox(height: 190, borderRadius: BorderRadius.all(Radius.circular(20))),
                ),
              );
            }
            if (state.status == FavoritesStatus.error) {
              return ErrorStateView(message: state.errorMessage ?? 'Could not load your favourites', onRetry: () => context.read<FavoritesCubit>().loadFavorites());
            }
            if (state.cafes.isEmpty) {
              return const EmptyStateView(
                icon: Icons.favorite_border_rounded,
                title: 'No favourites yet',
                message: 'Tap the heart on any cafe to save it here.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => context.read<FavoritesCubit>().loadFavorites(),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: state.cafes.length,
                separatorBuilder: (_, __) => const SizedBox(height: 14),
                itemBuilder: (context, i) {
                  final cafe = state.cafes[i];
                  return CafeCard(cafe: cafe, onTap: () => context.push('/cafes/${cafe.id}', extra: cafe));
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
