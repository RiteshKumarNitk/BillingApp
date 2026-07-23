import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../../../core/utils/location_service.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../../cafes/domain/usecases/get_cafe_by_id_usecase.dart';
import '../../../cafes/domain/usecases/get_cafes_usecase.dart';
import 'home_state.dart';

/// Orchestrates every Home section as one cubit rather than composing several independent ones in
/// the page — Nearby (location-sorted), Popular (real order-volume ranking), and Recently Visited
/// (a locally tracked list of cafe ids, refreshed by id) each load and fail independently so one
/// slow/broken section never blocks the others.
class HomeCubit extends Cubit<HomeState> {
  final GetCafesUseCase _getCafesUseCase;
  final GetCafeByIdUseCase _getCafeByIdUseCase;
  final LocationService _locationService;
  final LocalStorageService _localStorage;

  HomeCubit({
    required GetCafesUseCase getCafesUseCase,
    required GetCafeByIdUseCase getCafeByIdUseCase,
    required LocationService locationService,
    required LocalStorageService localStorage,
  })  : _getCafesUseCase = getCafesUseCase,
        _getCafeByIdUseCase = getCafeByIdUseCase,
        _locationService = locationService,
        _localStorage = localStorage,
        super(const HomeState());

  Future<void> loadAll() => Future.wait([loadNearby(), loadPopular(), loadRecentlyViewed()]);

  Future<void> loadNearby() async {
    emit(state.copyWith(nearbyStatus: HomeSectionStatus.loading));
    final position = await _locationService.getCurrentPosition();
    final result = await _getCafesUseCase(GetCafesParams(lat: position?.$1, lng: position?.$2, sort: position == null ? 'popular' : null));
    result.match(
      (failure) => emit(state.copyWith(nearbyStatus: HomeSectionStatus.error)),
      (cafes) => emit(state.copyWith(nearbyStatus: HomeSectionStatus.loaded, nearbyCafes: cafes, locationEnabled: position != null)),
    );
  }

  Future<void> loadPopular() async {
    emit(state.copyWith(popularStatus: HomeSectionStatus.loading));
    final result = await _getCafesUseCase(const GetCafesParams(sort: 'popular'));
    result.match(
      (failure) => emit(state.copyWith(popularStatus: HomeSectionStatus.error)),
      (cafes) => emit(state.copyWith(popularStatus: HomeSectionStatus.loaded, popularCafes: cafes.take(10).toList())),
    );
  }

  Future<void> loadRecentlyViewed() async {
    final ids = _localStorage.recentlyViewedCafeIds.take(6).toList();
    if (ids.isEmpty) {
      emit(state.copyWith(recentStatus: HomeSectionStatus.loaded, recentCafes: const []));
      return;
    }
    emit(state.copyWith(recentStatus: HomeSectionStatus.loading));
    final results = await Future.wait(ids.map((id) => _getCafeByIdUseCase(id)));
    final cafes = <Cafe>[];
    for (final result in results) {
      result.match((_) {}, (cafe) => cafes.add(cafe));
    }
    emit(state.copyWith(recentStatus: HomeSectionStatus.loaded, recentCafes: cafes));
  }
}
