import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../domain/entities/cafe.dart';
import '../../domain/repositories/cafes_repository.dart';
import '../datasources/cafes_remote_datasource.dart';

class CafesRepositoryImpl implements CafesRepository {
  final CafesRemoteDataSource remoteDataSource;
  CafesRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, List<Cafe>>> getCafes({double? lat, double? lng, String? search}) async {
    try {
      final cafes = await remoteDataSource.getCafes(lat: lat, lng: lng, search: search);
      return right(cafes);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
