import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/theme/cafe_theme.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/cart_fab_badge.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../../cart/presentation/cubit/cart_cubit.dart';
import '../../../cart/presentation/cubit/cart_state.dart';
import '../../domain/entities/menu_item.dart';
import '../cubit/menu_cubit.dart';
import '../cubit/menu_state.dart';
import '../widgets/menu_product_card.dart';
import '../widgets/product_detail_sheet.dart';

class MenuPage extends StatelessWidget {
  final Cafe cafe;
  const MenuPage({super.key, required this.cafe});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<MenuCubit>(param1: cafe.id)..loadMenu(),
      child: BlocProvider.value(
        value: sl<CartCubit>(),
        child: _MenuView(cafe: cafe),
      ),
    );
  }
}

class _MenuView extends StatelessWidget {
  final Cafe cafe;
  const _MenuView({required this.cafe});

  @override
  Widget build(BuildContext context) {
    final cafeTheme = CafeTheme.build(cafe.appearance, brightness: MediaQuery.platformBrightnessOf(context));

    return Theme(
      data: cafeTheme,
      child: Scaffold(
        appBar: AppBar(title: Text(cafe.name)),
        body: BlocBuilder<MenuCubit, MenuState>(
          builder: (context, state) {
            if (state.status == MenuStatus.loading || state.status == MenuStatus.initial) {
              return const _MenuSkeleton();
            }
            if (state.status == MenuStatus.error) {
              return ErrorStateView(message: state.errorMessage ?? 'Could not load the menu', onRetry: () => context.read<MenuCubit>().loadMenu());
            }
            if (state.categories.isEmpty) {
              return const EmptyStateView(icon: Icons.restaurant_menu_rounded, title: 'No items yet', message: 'This cafe hasn\'t added any menu items yet.');
            }

            return Column(
              children: [
                if (state.categories.length > 1 || state.hasFeaturedItems)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: SizedBox(
                      height: 36,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          if (state.categories.length > 1)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: AppChip(label: 'All', selected: state.selectedCategory == null, onTap: () => context.read<MenuCubit>().selectCategory(null)),
                            ),
                          if (state.hasFeaturedItems)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: AppChip(
                                label: 'Popular',
                                icon: Icons.star_rounded,
                                selected: state.featuredOnly,
                                onTap: () => context.read<MenuCubit>().toggleFeaturedOnly(),
                              ),
                            ),
                          ...state.categories.map((c) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: AppChip(label: c.category, selected: state.selectedCategory == c.category, onTap: () => context.read<MenuCubit>().selectCategory(c.category)),
                              )),
                        ],
                      ),
                    ),
                  ),
                Expanded(
                  child: state.visibleCategories.isEmpty
                      ? const EmptyStateView(icon: Icons.star_border_rounded, title: 'No popular items yet', message: 'Nothing has been marked popular in this category.')
                      : ListView(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    children: state.visibleCategories.expand((category) => [
                          if (state.categories.length > 1)
                            Padding(
                              padding: const EdgeInsets.only(top: 12, bottom: 10),
                              child: Text(category.category, style: cafeTheme.textTheme.headlineMedium),
                            ),
                          ...category.items.map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: MenuProductCard(
                                  item: item,
                                  onTap: () => _openProduct(context, item),
                                ),
                              )),
                        ]).toList(),
                  ),
                ),
              ],
            );
          },
        ),
        floatingActionButton: BlocBuilder<CartCubit, CartState>(
          builder: (context, cart) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: CartFabBadge(itemCount: cart.itemCount, total: cart.subtotal, onTap: () => context.push('/cart')),
          ),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      ),
    );
  }

  void _openProduct(BuildContext context, MenuItem item) {
    ProductDetailSheet.show(context, item: item, cafe: cafe);
  }
}

class _MenuSkeleton extends StatelessWidget {
  const _MenuSkeleton();

  @override
  Widget build(BuildContext context) {
    return AppShimmer(
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 6,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, __) => ShimmerBox(height: 108, borderRadius: BorderRadius.circular(18)),
      ),
    );
  }
}
