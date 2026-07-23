import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../cafes/domain/entities/cafe.dart';

abstract class FavoritesRepository {
  Future<Either<Failure, List<Cafe>>> getFavorites();
  Future<Either<Failure, void>> addFavorite(String tenantId);
  Future<Either<Failure, void>> removeFavorite(String tenantId);
}
