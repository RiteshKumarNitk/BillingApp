import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../cubit/cafes_cubit.dart';
import '../cubit/cafes_state.dart';
import '../widgets/cafe_card.dart';

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
                    if (state.cafes.isEmpty) {
                      return const EmptyStateView(
                        icon: Icons.local_cafe_outlined,
                        title: 'No cafes found',
                        message: 'Try a different search, or check back soon as more cafes join CafeOS.',
                      );
                    }
                    return RefreshIndicator(
                      onRefresh: () => context.read<CafesCubit>().loadCafes(search: _searchController.text),
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        itemCount: state.cafes.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final cafe = state.cafes[index];
                          return CafeCard(cafe: cafe, onTap: () => context.push('/cafes/${cafe.id}', extra: cafe));
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
