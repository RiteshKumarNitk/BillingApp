import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/favorites_repository.dart';

class ToggleFavoriteParams extends Equatable {
  final String tenantId;
  final bool isFavorite;
  const ToggleFavoriteParams({required this.tenantId, required this.isFavorite});

  @override
  List<Object?> get props => [tenantId, isFavorite];
}

/// One usecase for both directions — `isFavorite` is the *current* state, so `true` means "remove
/// it" (the toggle target is the opposite of what's passed in).
class ToggleFavoriteUseCase implements UseCase<void, ToggleFavoriteParams> {
  final FavoritesRepository repository;
  const ToggleFavoriteUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(ToggleFavoriteParams params) {
    return params.isFavorite ? repository.removeFavorite(params.tenantId) : repository.addFavorite(params.tenantId);
  }
}
