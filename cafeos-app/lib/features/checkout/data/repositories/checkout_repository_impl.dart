import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../../cart/domain/entities/cart_item.dart';
import '../../domain/entities/placed_order.dart';
import '../../domain/repositories/checkout_repository.dart';
import '../datasources/checkout_remote_datasource.dart';

class CheckoutRepositoryImpl implements CheckoutRepository {
  final CheckoutRemoteDataSource remoteDataSource;
  CheckoutRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, PlacedOrder>> placeOrder({
    required String tenantId,
    required List<CartItem> items,
    String? notes,
    String? tableToken,
    String? idempotencyKey,
  }) async {
    try {
      final order = await remoteDataSource.placeOrder(
        tenantId: tenantId,
        items: items,
        notes: notes,
        tableToken: tableToken,
        idempotencyKey: idempotencyKey,
      );
      return right(order);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
