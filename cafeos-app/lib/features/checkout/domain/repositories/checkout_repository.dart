import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../cart/domain/entities/cart_item.dart';
import '../entities/placed_order.dart';

abstract class CheckoutRepository {
  Future<Either<Failure, PlacedOrder>> placeOrder({
    required String tenantId,
    required List<CartItem> items,
    String? notes,
    String? tableToken,
  });
}
