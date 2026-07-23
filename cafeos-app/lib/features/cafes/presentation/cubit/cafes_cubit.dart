import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/utils/location_service.dart';
import '../../domain/usecases/get_cafes_usecase.dart';
import 'cafes_state.dart';

class CafesCubit extends Cubit<CafesState> {
  final GetCafesUseCase _getCafesUseCase;
  final LocationService _locationService;

  CafesCubit({required GetCafesUseCase getCafesUseCase, required LocationService locationService})
      : _getCafesUseCase = getCafesUseCase,
        _locationService = locationService,
        super(const CafesState());

  Future<void> loadCafes({String? search, bool useLocation = true}) async {
    emit(state.copyWith(status: CafesStatus.loading));

    double? lat, lng;
    if (useLocation) {
      final position = await _locationService.getCurrentPosition();
      if (position != null) {
        lat = position.$1;
        lng = position.$2;
      }
    }

    final result = await _getCafesUseCase(GetCafesParams(lat: lat, lng: lng, search: search));
    result.match(
      (failure) => emit(state.copyWith(status: CafesStatus.error, errorMessage: failure.message)),
      (cafes) => emit(state.copyWith(status: CafesStatus.loaded, cafes: cafes, locationEnabled: lat != null)),
    );
  }
}
