import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../datasources/notifications_remote_datasource.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  final NotificationsRemoteDataSource remoteDataSource;
  NotificationsRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, NotificationsResult>> getNotifications({bool unreadOnly = false}) async {
    try {
      final response = await remoteDataSource.getNotifications(unreadOnly: unreadOnly);
      return right(NotificationsResult(notifications: response.notifications, unreadCount: response.unreadCount));
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, void>> markAllRead() async {
    try {
      await remoteDataSource.markAllRead();
      return right(null);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, void>> markRead(List<String> ids) async {
    try {
      await remoteDataSource.markRead(ids);
      return right(null);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
