import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../domain/usecases/get_favorites_usecase.dart';
import '../../domain/usecases/toggle_favorite_usecase.dart';
import 'favorites_state.dart';

/// One instance for the whole app session (registered as a lazy singleton, like CartCubit) so the
/// heart icon on a CafeCard/CafeDetailsPage anywhere in the app reflects the same favourited set
/// without every screen re-fetching it independently.
class FavoritesCubit extends Cubit<FavoritesState> {
  final GetFavoritesUseCase _getFavoritesUseCase;
  final ToggleFavoriteUseCase _toggleFavoriteUseCase;

  FavoritesCubit({required GetFavoritesUseCase getFavoritesUseCase, required ToggleFavoriteUseCase toggleFavoriteUseCase})
      : _getFavoritesUseCase = getFavoritesUseCase,
        _toggleFavoriteUseCase = toggleFavoriteUseCase,
        super(const FavoritesState());

  Future<void> loadFavorites() async {
    emit(state.copyWith(status: FavoritesStatus.loading));
    final result = await _getFavoritesUseCase(const NoParams());
    result.match(
      (failure) => emit(state.copyWith(status: FavoritesStatus.error, errorMessage: failure.message)),
      (cafes) => emit(state.copyWith(status: FavoritesStatus.loaded, cafes: cafes, favoriteIds: cafes.map((c) => c.id).toSet())),
    );
  }

  /// Optimistic: flips immediately, rolls back to the pre-toggle snapshot if the server call fails.
  Future<void> toggleFavorite(Cafe cafe) async {
    final originalIds = state.favoriteIds;
    final originalCafes = state.cafes;
    final wasFavorite = state.isFavorite(cafe.id);

    final optimisticIds = Set<String>.from(originalIds);
    final optimisticCafes = List<Cafe>.from(originalCafes);
    if (wasFavorite) {
      optimisticIds.remove(cafe.id);
      optimisticCafes.removeWhere((c) => c.id == cafe.id);
    } else {
      optimisticIds.add(cafe.id);
      optimisticCafes.add(cafe);
    }
    emit(state.copyWith(favoriteIds: optimisticIds, cafes: optimisticCafes));

    final result = await _toggleFavoriteUseCase(ToggleFavoriteParams(tenantId: cafe.id, isFavorite: wasFavorite));
    result.match(
      (failure) => emit(state.copyWith(favoriteIds: originalIds, cafes: originalCafes, errorMessage: failure.message)),
      (_) {},
    );
  }
}
