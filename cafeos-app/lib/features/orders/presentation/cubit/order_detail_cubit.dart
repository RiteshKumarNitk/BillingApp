import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/cancel_order_usecase.dart';
import '../../domain/usecases/get_order_by_id_usecase.dart';
import 'order_detail_state.dart';

class OrderDetailCubit extends Cubit<OrderDetailState> {
  final GetOrderByIdUseCase _getOrderByIdUseCase;
  final CancelOrderUseCase _cancelOrderUseCase;
  final String orderId;

  OrderDetailCubit({
    required GetOrderByIdUseCase getOrderByIdUseCase,
    required CancelOrderUseCase cancelOrderUseCase,
    required this.orderId,
  })  : _getOrderByIdUseCase = getOrderByIdUseCase,
        _cancelOrderUseCase = cancelOrderUseCase,
        super(const OrderDetailState());

  Future<void> loadOrder() async {
    emit(state.copyWith(status: OrderDetailStatus.loading));
    final result = await _getOrderByIdUseCase(orderId);
    result.match(
      (failure) => emit(state.copyWith(status: OrderDetailStatus.error, errorMessage: failure.message)),
      (order) => emit(state.copyWith(status: OrderDetailStatus.loaded, order: order)),
    );
  }

  /// Returns true when the order ended up cancelled. On failure (e.g. the cafe accepted it first)
  /// the server's explanation is exposed as [OrderDetailState.cancelError] and the order is
  /// reloaded so the screen shows its real current status.
  Future<bool> cancelOrder() async {
    if (state.isCancelling) return false;
    emit(state.copyWith(isCancelling: true));
    final result = await _cancelOrderUseCase(orderId);
    final failureMessage = result.match((failure) => failure.message, (_) => null);

    final refreshed = await _getOrderByIdUseCase(orderId);
    refreshed.match(
      (_) => emit(state.copyWith(isCancelling: false, cancelError: failureMessage)),
      (order) => emit(state.copyWith(status: OrderDetailStatus.loaded, order: order, isCancelling: false, cancelError: failureMessage)),
    );
    return failureMessage == null;
  }
}
