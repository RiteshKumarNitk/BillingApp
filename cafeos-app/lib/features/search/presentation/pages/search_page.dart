import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../cafes/presentation/cubit/cafes_cubit.dart';
import '../../../cafes/presentation/cubit/cafes_state.dart';
import '../../../cafes/presentation/widgets/cafe_card.dart';

class SearchPage extends StatelessWidget {
  const SearchPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<CafesCubit>(),
      child: const _SearchView(),
    );
  }
}

class _SearchView extends StatefulWidget {
  const _SearchView();

  @override
  State<_SearchView> createState() => _SearchViewState();
}

class _SearchViewState extends State<_SearchView> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _debounce;
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    if (value.trim().isEmpty) {
      setState(() => _hasSearched = false);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () => _runSearch(value.trim()));
  }

  void _runSearch(String query) {
    if (query.isEmpty) return;
    setState(() => _hasSearched = true);
    context.read<CafesCubit>().loadCafes(search: query, useLocation: false);
    _saveRecentSearch(query);
  }

  void _saveRecentSearch(String query) {
    final storage = sl<LocalStorageService>();
    final existing = List<String>.from(storage.recentSearches)..removeWhere((s) => s.toLowerCase() == query.toLowerCase());
    existing.insert(0, query);
    storage.setRecentSearches(existing.take(8).toList());
  }

  void _tapRecent(String query) {
    _controller.text = query;
    _runSearch(query);
  }

  @override
  Widget build(BuildContext context) {
    final recentSearches = sl<LocalStorageService>().recentSearches;

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          focusNode: _focusNode,
          onChanged: _onChanged,
          onSubmitted: _runSearch,
          decoration: const InputDecoration(
            hintText: 'Search cafes by name or area',
            border: InputBorder.none,
          ),
        ),
        actions: [
          if (_controller.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close_rounded),
              onPressed: () {
                _controller.clear();
                setState(() => _hasSearched = false);
              },
            ),
        ],
      ),
      body: !_hasSearched
          ? _RecentSearches(searches: recentSearches, onTap: _tapRecent, onClear: () => setState(() => sl<LocalStorageService>().setRecentSearches([])))
          : BlocBuilder<CafesCubit, CafesState>(
              builder: (context, state) {
                if (state.status == CafesStatus.loading || state.status == CafesStatus.initial) {
                  return AppShimmer(
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: 4,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (_, __) => const ShimmerBox(height: 190, borderRadius: BorderRadius.all(Radius.circular(20))),
                    ),
                  );
                }
                if (state.status == CafesStatus.error) {
                  return ErrorStateView(message: state.errorMessage ?? 'Search failed', onRetry: () => _runSearch(_controller.text));
                }
                if (state.cafes.isEmpty) {
                  return EmptyStateView(icon: Icons.search_off_rounded, title: 'No cafes found', message: 'Try a different name or area.');
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.cafes.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, i) {
                    final cafe = state.cafes[i];
                    return CafeCard(cafe: cafe, onTap: () => context.push('/cafes/${cafe.id}', extra: cafe));
                  },
                );
              },
            ),
    );
  }
}

class _RecentSearches extends StatelessWidget {
  final List<String> searches;
  final ValueChanged<String> onTap;
  final VoidCallback onClear;
  const _RecentSearches({required this.searches, required this.onTap, required this.onClear});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (searches.isEmpty) {
      return const EmptyStateView(icon: Icons.search_rounded, title: 'Search for a cafe', message: 'Try a cafe name or area near you.');
    }
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Recent Searches', style: theme.textTheme.titleMedium),
            TextButton(onPressed: onClear, child: const Text('Clear')),
          ],
        ),
        const SizedBox(height: 8),
        ...searches.map((s) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.history_rounded),
              title: Text(s),
              trailing: const Icon(Icons.north_west_rounded, size: 16),
              onTap: () => onTap(s),
            )),
      ],
    );
  }
}
