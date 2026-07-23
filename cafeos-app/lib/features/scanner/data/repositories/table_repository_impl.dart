import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../domain/repositories/table_repository.dart';
import '../datasources/table_remote_datasource.dart';

class TableRepositoryImpl implements TableRepository {
  final TableRemoteDataSource remoteDataSource;
  TableRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, String>> validateTable({required String tenantId, required String token}) async {
    try {
      final label = await remoteDataSource.validateTable(tenantId: tenantId, token: token);
      if (label == null) return left(const ValidationFailure('This QR code is no longer valid. Try scanning again.'));
      return right(label);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
