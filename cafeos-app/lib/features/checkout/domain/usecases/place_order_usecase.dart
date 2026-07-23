import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../cart/domain/entities/cart_item.dart';
import '../entities/placed_order.dart';
import '../repositories/checkout_repository.dart';

class PlaceOrderParams extends Equatable {
  final String tenantId;
  final List<CartItem> items;
  final String? notes;
  final String? tableToken;

  const PlaceOrderParams({required this.tenantId, required this.items, this.notes, this.tableToken});

  @override
  List<Object?> get props => [tenantId, items, notes, tableToken];
}

class PlaceOrderUseCase implements UseCase<PlacedOrder, PlaceOrderParams> {
  final CheckoutRepository repository;
  const PlaceOrderUseCase(this.repository);

  @override
  Future<Either<Failure, PlacedOrder>> call(PlaceOrderParams params) {
    return repository.placeOrder(tenantId: params.tenantId, items: params.items, notes: params.notes, tableToken: params.tableToken);
  }
}
