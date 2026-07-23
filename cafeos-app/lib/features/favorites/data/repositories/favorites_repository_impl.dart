import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../domain/repositories/favorites_repository.dart';
import '../datasources/favorites_remote_datasource.dart';

class FavoritesRepositoryImpl implements FavoritesRepository {
  final FavoritesRemoteDataSource remoteDataSource;
  FavoritesRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, List<Cafe>>> getFavorites() async {
    try {
      return right(await remoteDataSource.getFavorites());
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, void>> addFavorite(String tenantId) async {
    try {
      await remoteDataSource.addFavorite(tenantId);
      return right(null);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, void>> removeFavorite(String tenantId) async {
    try {
      await remoteDataSource.removeFavorite(tenantId);
      return right(null);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
