import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../cart/domain/entities/cart_item.dart';
import '../../domain/usecases/place_order_usecase.dart';
import 'checkout_state.dart';

class CheckoutCubit extends Cubit<CheckoutState> {
  final PlaceOrderUseCase _placeOrderUseCase;

  CheckoutCubit({required PlaceOrderUseCase placeOrderUseCase})
      : _placeOrderUseCase = placeOrderUseCase,
        super(CheckoutState());

  Future<void> placeOrder({
    required String tenantId,
    required List<CartItem> items,
    String? notes,
    String? tableToken,
  }) async {
    emit(state.copyWith(status: CheckoutStatus.submitting));
    final result = await _placeOrderUseCase(PlaceOrderParams(
      tenantId: tenantId,
      items: items,
      notes: notes,
      tableToken: tableToken,
      idempotencyKey: state.idempotencyKey,
    ));
    result.match(
      (failure) => emit(state.copyWith(status: CheckoutStatus.error, errorMessage: failure.message)),
      (order) => emit(state.copyWith(status: CheckoutStatus.success, placedOrder: order)),
    );
  }

  void reset() => emit(CheckoutState());
}
