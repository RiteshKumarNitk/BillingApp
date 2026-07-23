import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../domain/entities/menu_item.dart';
import '../../domain/repositories/menu_repository.dart';
import '../datasources/menu_remote_datasource.dart';

class MenuRepositoryImpl implements MenuRepository {
  final MenuRemoteDataSource remoteDataSource;
  MenuRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, List<MenuCategory>>> getMenu({required String tenantId, String? search}) async {
    try {
      final categories = await remoteDataSource.getMenu(tenantId: tenantId, search: search);
      return right(categories);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
