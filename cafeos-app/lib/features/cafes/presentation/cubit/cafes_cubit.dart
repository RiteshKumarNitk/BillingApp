import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/utils/location_service.dart';
import '../../domain/usecases/get_cafes_usecase.dart';
import 'cafes_state.dart';

class CafesCubit extends Cubit<CafesState> {
  final GetCafesUseCase _getCafesUseCase;
  final LocationService _locationService;
  String? _lastSearch;

  CafesCubit({required GetCafesUseCase getCafesUseCase, required LocationService locationService})
      : _getCafesUseCase = getCafesUseCase,
        _locationService = locationService,
        super(const CafesState());

  Future<void> loadCafes({String? search, bool useLocation = true, String? sort}) async {
    _lastSearch = search;
    emit(state.copyWith(status: CafesStatus.loading, sort: sort, clearSort: sort == null));

    double? lat, lng;
    if (useLocation) {
      final position = await _locationService.getCurrentPosition();
      if (position != null) {
        lat = position.$1;
        lng = position.$2;
      }
    }

    final result = await _getCafesUseCase(GetCafesParams(lat: lat, lng: lng, search: search, sort: sort));
    result.match(
      (failure) => emit(state.copyWith(status: CafesStatus.error, errorMessage: failure.message)),
      (cafes) => emit(state.copyWith(status: CafesStatus.loaded, cafes: cafes, locationEnabled: lat != null)),
    );
  }

  /// Toggles Nearest <-> Popular, re-fetching with the new sort (a different ranking, not a
  /// client-side re-order of the same list).
  Future<void> toggleSort() => loadCafes(search: _lastSearch, sort: state.sort == 'popular' ? null : 'popular');

  /// Pure client-side filter over the already-fetched list — no refetch.
  void setRadius(double? km) => emit(state.copyWith(radiusKm: km, clearRadius: km == null));
}
