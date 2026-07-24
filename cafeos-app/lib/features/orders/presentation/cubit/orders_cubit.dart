import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_orders_usecase.dart';
import 'orders_state.dart';

class OrdersCubit extends Cubit<OrdersState> {
  final GetOrdersUseCase _getOrdersUseCase;

  OrdersCubit({required GetOrdersUseCase getOrdersUseCase})
      : _getOrdersUseCase = getOrdersUseCase,
        super(const OrdersState());

  Future<void> loadOrders({String? filter}) async {
    emit(state.copyWith(status: OrdersStatus.loading, filter: filter, clearFilter: filter == null));
    final result = await _getOrdersUseCase(GetOrdersParams(status: filter));
    result.match(
      (failure) => emit(state.copyWith(status: OrdersStatus.error, errorMessage: failure.message)),
      (orders) => emit(state.copyWith(status: OrdersStatus.loaded, orders: orders)),
    );
  }
}
