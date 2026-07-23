import 'package:fpdart/fpdart.dart' hide Order;
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/order.dart';
import '../repositories/orders_repository.dart';

class GetOrdersUseCase implements UseCase<List<Order>, NoParams> {
  final OrdersRepository repository;
  const GetOrdersUseCase(this.repository);

  @override
  Future<Either<Failure, List<Order>>> call(NoParams params) => repository.getOrders();
}
