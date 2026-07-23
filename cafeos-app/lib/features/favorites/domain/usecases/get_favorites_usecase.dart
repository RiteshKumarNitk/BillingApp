import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../repositories/favorites_repository.dart';

class GetFavoritesUseCase implements UseCase<List<Cafe>, NoParams> {
  final FavoritesRepository repository;
  const GetFavoritesUseCase(this.repository);

  @override
  Future<Either<Failure, List<Cafe>>> call(NoParams params) => repository.getFavorites();
}
