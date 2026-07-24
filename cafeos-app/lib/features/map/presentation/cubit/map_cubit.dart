import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/utils/location_service.dart';
import '../../../cafes/domain/usecases/get_cafes_usecase.dart';
import 'map_state.dart';

class MapCubit extends Cubit<MapState> {
  final GetCafesUseCase _getCafesUseCase;
  final LocationService _locationService;

  MapCubit({required GetCafesUseCase getCafesUseCase, required LocationService locationService})
      : _getCafesUseCase = getCafesUseCase,
        _locationService = locationService,
        super(const MapState());

  Future<void> loadCafes({String? search}) async {
    emit(state.copyWith(status: MapStatus.loading, search: search, clearSearch: search == null));

    double? lat, lng;
    final position = await _locationService.getCurrentPosition();
    if (position != null) {
      lat = position.$1;
      lng = position.$2;
    }

    // limit: 100 (backend max) — the map wants every active cafe plotted, not just a first page.
    final result = await _getCafesUseCase(GetCafesParams(
      lat: lat,
      lng: lng,
      search: search,
      sort: state.isPopularSort ? 'popular' : null,
      limit: 100,
    ));
    result.match(
      (failure) => emit(state.copyWith(status: MapStatus.error, errorMessage: failure.message)),
      (cafes) => emit(state.copyWith(
        status: MapStatus.loaded,
        cafes: cafes,
        locationEnabled: lat != null,
        userLat: lat,
        userLng: lng,
      )),
    );
  }

  /// Nearest <-> Popular are mutually exclusive server-side rankings (not a client re-order), so
  /// switching to Popular re-fetches; Open Now is a pure client-side filter over the same list.
  Future<void> togglePopularSort() {
    final filters = Set<MapFilter>.from(state.activeFilters);
    if (filters.contains(MapFilter.popular)) {
      filters.remove(MapFilter.popular);
    } else {
      filters.add(MapFilter.popular);
    }
    emit(state.copyWith(activeFilters: filters));
    return loadCafes(search: state.search);
  }

  void toggleOpenNow() {
    final filters = Set<MapFilter>.from(state.activeFilters);
    if (filters.contains(MapFilter.openNow)) {
      filters.remove(MapFilter.openNow);
    } else {
      filters.add(MapFilter.openNow);
    }
    emit(state.copyWith(activeFilters: filters));
  }

  void setRadius(double? km) => emit(state.copyWith(radiusKm: km, clearRadius: km == null));

  void setViewMode(MapViewMode mode) => emit(state.copyWith(viewMode: mode));
}
