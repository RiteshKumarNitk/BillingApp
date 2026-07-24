import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart' hide Order;
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../domain/entities/order.dart';
import '../../domain/repositories/orders_repository.dart';
import '../datasources/orders_remote_datasource.dart';

class OrdersRepositoryImpl implements OrdersRepository {
  final OrdersRemoteDataSource remoteDataSource;
  OrdersRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, List<Order>>> getOrders({String? status}) async {
    try {
      return right(await remoteDataSource.getOrders(status: status));
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, Order>> getOrderById(String id) async {
    try {
      return right(await remoteDataSource.getOrderById(id));
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
