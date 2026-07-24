import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../cafes/presentation/widgets/cafe_card.dart';
import '../cubit/map_cubit.dart';
import '../cubit/map_state.dart';
import '../widgets/cafe_marker_sheet.dart';

// Default center (India) when location is denied/unavailable and no cafes have coordinates yet —
// a real cafe location, once available, always takes priority (see _MapView's initial-camera logic).
const _fallbackCenter = LatLng(20.5937, 78.9629);
const _radiusOptions = <double?>[null, 1, 3, 5, 10];

class MapPage extends StatelessWidget {
  const MapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<MapCubit>()..loadCafes(),
      child: const _MapPageView(),
    );
  }
}

class _MapPageView extends StatefulWidget {
  const _MapPageView();

  @override
  State<_MapPageView> createState() => _MapPageViewState();
}

class _MapPageViewState extends State<_MapPageView> {
  final _mapController = MapController();
  final _searchController = TextEditingController();
  Timer? _debounce;
  bool _hasCentered = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      context.read<MapCubit>().loadCafes(search: value.trim().isEmpty ? null : value.trim());
    });
  }

  void _recenter(MapState state) {
    final target = state.userLat != null && state.userLng != null
        ? LatLng(state.userLat!, state.userLng!)
        : (state.markerCafes.isNotEmpty
            ? LatLng(state.markerCafes.first.latitude!, state.markerCafes.first.longitude!)
            : _fallbackCenter);
    _mapController.move(target, 14);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<MapCubit, MapState>(
        listenWhen: (a, b) => a.markerCafes != b.markerCafes || a.search != b.search,
        listener: (context, state) {
          // "Map should automatically move to the selected cafe" — moves to the top search result
          // once it (and its coordinates) arrive.
          if (state.search != null && state.markerCafes.isNotEmpty) {
            final target = state.markerCafes.first;
            _mapController.move(LatLng(target.latitude!, target.longitude!), 15);
          } else if (!_hasCentered && state.status == MapStatus.loaded) {
            _hasCentered = true;
            WidgetsBinding.instance.addPostFrameCallback((_) => _recenter(state));
          }
        },
        builder: (context, state) {
          return Stack(
            children: [
              if (state.viewMode == MapViewMode.map) _MapView(mapController: _mapController, state: state) else _ListView(state: state),
              _TopOverlay(searchController: _searchController, onSearchChanged: _onSearchChanged),
            ],
          );
        },
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          BlocBuilder<MapCubit, MapState>(
            buildWhen: (a, b) => a.viewMode != b.viewMode,
            builder: (context, state) => FloatingActionButton(
              heroTag: 'map-list-toggle',
              onPressed: () => context.read<MapCubit>().setViewMode(state.viewMode == MapViewMode.map ? MapViewMode.list : MapViewMode.map),
              child: Icon(state.viewMode == MapViewMode.map ? Icons.list_rounded : Icons.map_rounded),
            ),
          ),
          const SizedBox(height: 12),
          BlocBuilder<MapCubit, MapState>(
            buildWhen: (a, b) => a.viewMode != b.viewMode,
            builder: (context, state) => state.viewMode == MapViewMode.map
                ? FloatingActionButton(
                    heroTag: 'map-recenter',
                    onPressed: () => _recenter(state),
                    child: const Icon(Icons.my_location_rounded),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _MapView extends StatelessWidget {
  final MapController mapController;
  final MapState state;
  const _MapView({required this.mapController, required this.state});

  @override
  Widget build(BuildContext context) {
    if (state.status == MapStatus.loading || state.status == MapStatus.initial) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.status == MapStatus.error) {
      return ErrorStateView(message: state.errorMessage ?? 'Could not load the map', onRetry: () => context.read<MapCubit>().loadCafes());
    }

    final markerCafes = state.markerCafes;
    final initialCenter = state.userLat != null && state.userLng != null
        ? LatLng(state.userLat!, state.userLng!)
        : (markerCafes.isNotEmpty ? LatLng(markerCafes.first.latitude!, markerCafes.first.longitude!) : _fallbackCenter);

    return FlutterMap(
      mapController: mapController,
      options: MapOptions(initialCenter: initialCenter, initialZoom: 13),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.cafeos.cafeos_app',
        ),
        MarkerLayer(
          markers: [
            if (state.userLat != null && state.userLng != null)
              Marker(
                point: LatLng(state.userLat!, state.userLng!),
                width: 22,
                height: 22,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.blueAccent,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                  ),
                ),
              ),
            ...markerCafes.map((cafe) => Marker(
                  point: LatLng(cafe.latitude!, cafe.longitude!),
                  width: 42,
                  height: 42,
                  child: GestureDetector(
                    onTap: () => showCafeMarkerSheet(context, cafe),
                    child: _CafePin(isOpen: cafe.isOpenNow),
                  ),
                )),
          ],
        ),
        if (markerCafes.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.only(top: 140),
              child: _NoCafesOnMapNote(),
            ),
          ),
      ],
    );
  }
}

class _NoCafesOnMapNote extends StatelessWidget {
  const _NoCafesOnMapNote();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 40),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.72), borderRadius: BorderRadius.circular(14)),
        child: const Text(
          'No cafes with a set location nearby yet',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white, fontSize: 13),
        ),
      ),
    );
  }
}

class _CafePin extends StatelessWidget {
  final bool? isOpen;
  const _CafePin({this.isOpen});

  @override
  Widget build(BuildContext context) {
    final color = isOpen == false ? Colors.grey : AppColors.primary;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
          ),
          child: const Icon(Icons.local_cafe_rounded, color: Colors.white, size: 16),
        ),
      ],
    );
  }
}

class _ListView extends StatelessWidget {
  final MapState state;
  const _ListView({required this.state});

  @override
  Widget build(BuildContext context) {
    if (state.status == MapStatus.loading || state.status == MapStatus.initial) {
      return AppShimmer(
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 110, 16, 24),
          itemCount: 5,
          separatorBuilder: (_, __) => const SizedBox(height: 14),
          itemBuilder: (_, __) => const ShimmerBox(height: 190, borderRadius: BorderRadius.all(Radius.circular(20))),
        ),
      );
    }
    if (state.status == MapStatus.error) {
      return ErrorStateView(message: state.errorMessage ?? 'Could not load cafes', onRetry: () => context.read<MapCubit>().loadCafes());
    }

    final cafes = state.visibleCafes;
    if (cafes.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(top: 100),
        child: EmptyStateView(icon: Icons.local_cafe_outlined, title: 'No cafes found', message: 'Try a different search or filter.'),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 110, 16, 24),
      itemCount: cafes.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, i) {
        final cafe = cafes[i];
        return CafeCard(cafe: cafe, onTap: () => context.push('/cafes/${cafe.id}', extra: cafe));
      },
    );
  }
}

class _TopOverlay extends StatelessWidget {
  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;
  const _TopOverlay({required this.searchController, required this.onSearchChanged});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Column(
          children: [
            Material(
              elevation: 3,
              borderRadius: BorderRadius.circular(16),
              child: TextField(
                controller: searchController,
                onChanged: onSearchChanged,
                decoration: const InputDecoration(
                  hintText: 'Search cafe name, city, or area',
                  prefixIcon: Icon(Icons.search_rounded, size: 20),
                  filled: true,
                ),
              ),
            ),
            const SizedBox(height: 10),
            BlocBuilder<MapCubit, MapState>(
              buildWhen: (a, b) => a.activeFilters != b.activeFilters || a.radiusKm != b.radiusKm || a.locationEnabled != b.locationEnabled,
              builder: (context, state) => SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    AppChip(
                      label: 'Nearby',
                      icon: Icons.near_me_rounded,
                      selected: !state.isPopularSort,
                      onTap: () {
                        if (state.isPopularSort) context.read<MapCubit>().togglePopularSort();
                      },
                    ),
                    const SizedBox(width: 8),
                    AppChip(
                      label: 'Popular',
                      icon: Icons.local_fire_department_rounded,
                      selected: state.isPopularSort,
                      onTap: () {
                        if (!state.isPopularSort) context.read<MapCubit>().togglePopularSort();
                      },
                    ),
                    const SizedBox(width: 8),
                    AppChip(
                      label: 'Open Now',
                      icon: Icons.schedule_rounded,
                      selected: state.activeFilters.contains(MapFilter.openNow),
                      onTap: () => context.read<MapCubit>().toggleOpenNow(),
                    ),
                    if (state.locationEnabled && !state.isPopularSort) ...[
                      const SizedBox(width: 14),
                      Container(width: 1, color: Theme.of(context).colorScheme.outline),
                      const SizedBox(width: 14),
                      ..._radiusOptions.map((km) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: AppChip(
                              label: km == null ? 'Any distance' : '${km.toInt()} km',
                              selected: state.radiusKm == km,
                              onTap: () => context.read<MapCubit>().setRadius(km),
                            ),
                          )),
                    ],
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
