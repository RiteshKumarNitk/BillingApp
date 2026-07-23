import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/get_orders_usecase.dart';
import 'orders_state.dart';

class OrdersCubit extends Cubit<OrdersState> {
  final GetOrdersUseCase _getOrdersUseCase;

  OrdersCubit({required GetOrdersUseCase getOrdersUseCase})
      : _getOrdersUseCase = getOrdersUseCase,
        super(const OrdersState());

  Future<void> loadOrders() async {
    emit(state.copyWith(status: OrdersStatus.loading));
    final result = await _getOrdersUseCase(const NoParams());
    result.match(
      (failure) => emit(state.copyWith(status: OrdersStatus.error, errorMessage: failure.message)),
      (orders) => emit(state.copyWith(status: OrdersStatus.loaded, orders: orders)),
    );
  }
}
