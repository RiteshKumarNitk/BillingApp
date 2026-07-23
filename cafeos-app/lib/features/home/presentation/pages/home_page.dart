import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../cafes/presentation/cubit/cafes_cubit.dart';
import '../../../cafes/presentation/cubit/cafes_state.dart';
import '../../../cafes/presentation/widgets/cafe_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    context.read<CafesCubit>().loadCafes();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
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
                          Text('Hey there 👋', style: theme.textTheme.bodyMedium),
                          const SizedBox(height: 2),
                          Text('Find your next cafe', style: theme.textTheme.displayMedium),
                        ],
                      ),
                    ),
                    _ScanButton(onTap: () => context.push('/scan')),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => context.push('/cafes'),
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
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Nearby Cafes', style: theme.textTheme.headlineMedium),
                    TextButton(onPressed: () => context.push('/cafes'), child: const Text('See all')),
                  ],
                ),
              ),
            ),
            BlocBuilder<CafesCubit, CafesState>(
              builder: (context, state) {
                if (state.status == CafesStatus.loading || state.status == CafesStatus.initial) {
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
                if (state.status == CafesStatus.error) {
                  return SliverToBoxAdapter(
                    child: ErrorStateView(
                      message: state.errorMessage ?? 'Could not load cafes.',
                      onRetry: () => context.read<CafesCubit>().loadCafes(),
                    ),
                  );
                }
                final cafes = state.cafes.take(5).toList();
                if (cafes.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: EmptyStateView(
                      icon: Icons.local_cafe_outlined,
                      title: 'No cafes nearby yet',
                      message: 'Check back soon as more cafes join CafeOS.',
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  sliver: SliverList.separated(
                    itemCount: cafes.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final cafe = cafes[index];
                      return CafeCard(cafe: cafe, onTap: () => context.push('/cafes/${cafe.id}', extra: cafe));
                    },
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ScanButton extends StatelessWidget {
  final VoidCallback onTap;
  const _ScanButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 22),
      ),
    );
  }
}
