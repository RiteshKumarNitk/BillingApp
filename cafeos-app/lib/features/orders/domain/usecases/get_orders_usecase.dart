import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart' hide Order;
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/order.dart';
import '../repositories/orders_repository.dart';

class GetOrdersParams extends Equatable {
  // null = all orders; otherwise one of upcoming|active|completed|cancelled (see OrdersStatusFilter).
  final String? status;
  const GetOrdersParams({this.status});

  @override
  List<Object?> get props => [status];
}

class GetOrdersUseCase implements UseCase<List<Order>, GetOrdersParams> {
  final OrdersRepository repository;
  const GetOrdersUseCase(this.repository);

  @override
  Future<Either<Failure, List<Order>>> call(GetOrdersParams params) => repository.getOrders(status: params.status);
}
