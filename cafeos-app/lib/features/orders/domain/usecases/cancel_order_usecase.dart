import 'package:fpdart/fpdart.dart' hide Order;
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/orders_repository.dart';

class CancelOrderUseCase implements UseCase<Unit, String> {
  final OrdersRepository repository;
  const CancelOrderUseCase(this.repository);

  @override
  Future<Either<Failure, Unit>> call(String id) => repository.cancelOrder(id);
}
