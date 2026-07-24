import 'package:equatable/equatable.dart';
import '../../../cafes/domain/entities/cafe.dart';

enum MapStatus { initial, loading, loaded, error }

enum MapViewMode { map, list }

// A simple typed list rather than a free-text filter id, so adding a real filter later (once
// category/rating data exists) is one more enum value + one more branch in visibleCafes, not a
// redesign — matches the spec's explicit "easily expandable" ask.
enum MapFilter { nearby, openNow, popular }

class MapState extends Equatable {
  final MapStatus status;
  final List<Cafe> cafes;
  final String? errorMessage;
  final bool locationEnabled;
  final double? userLat;
  final double? userLng;
  final MapViewMode viewMode;
  final Set<MapFilter> activeFilters;
  final double? radiusKm;
  final String? search;

  const MapState({
    this.status = MapStatus.initial,
    this.cafes = const [],
    this.errorMessage,
    this.locationEnabled = false,
    this.userLat,
    this.userLng,
    this.viewMode = MapViewMode.map,
    this.activeFilters = const {},
    this.radiusKm,
    this.search,
  });

  bool get isPopularSort => activeFilters.contains(MapFilter.popular);

  List<Cafe> get visibleCafes {
    var result = cafes;
    if (activeFilters.contains(MapFilter.openNow)) {
      result = result.where((c) => c.isOpenNow == true).toList();
    }
    // Radius has no effect on the popular ranking — the backend doesn't compute distanceKm on
    // that path (same reasoning as CafesState.visibleCafes).
    if (radiusKm != null && !isPopularSort) {
      result = result.where((c) => c.distanceKm != null && c.distanceKm! <= radiusKm!).toList();
    }
    return result;
  }

  List<Cafe> get markerCafes => visibleCafes.where((c) => c.hasCoordinates).toList();

  MapState copyWith({
    MapStatus? status,
    List<Cafe>? cafes,
    String? errorMessage,
    bool? locationEnabled,
    double? userLat,
    double? userLng,
    MapViewMode? viewMode,
    Set<MapFilter>? activeFilters,
    double? radiusKm,
    bool clearRadius = false,
    String? search,
    bool clearSearch = false,
  }) {
    return MapState(
      status: status ?? this.status,
      cafes: cafes ?? this.cafes,
      errorMessage: errorMessage,
      locationEnabled: locationEnabled ?? this.locationEnabled,
      userLat: userLat ?? this.userLat,
      userLng: userLng ?? this.userLng,
      viewMode: viewMode ?? this.viewMode,
      activeFilters: activeFilters ?? this.activeFilters,
      radiusKm: clearRadius ? null : (radiusKm ?? this.radiusKm),
      search: clearSearch ? null : (search ?? this.search),
    );
  }

  @override
  List<Object?> get props => [
        status, cafes, errorMessage, locationEnabled, userLat, userLng, viewMode, activeFilters, radiusKm, search,
      ];
}
