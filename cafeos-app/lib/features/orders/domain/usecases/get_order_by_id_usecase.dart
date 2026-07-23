import 'package:fpdart/fpdart.dart' hide Order;
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/order.dart';
import '../repositories/orders_repository.dart';

class GetOrderByIdUseCase implements UseCase<Order, String> {
  final OrdersRepository repository;
  const GetOrderByIdUseCase(this.repository);

  @override
  Future<Either<Failure, Order>> call(String id) => repository.getOrderById(id);
}
