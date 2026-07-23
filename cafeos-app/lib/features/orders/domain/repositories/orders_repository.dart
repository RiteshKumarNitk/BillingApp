import 'package:fpdart/fpdart.dart' hide Order;
import '../../../../core/error/failure.dart';
import '../entities/order.dart';

abstract class OrdersRepository {
  Future<Either<Failure, List<Order>>> getOrders();
  Future<Either<Failure, Order>> getOrderById(String id);
}
