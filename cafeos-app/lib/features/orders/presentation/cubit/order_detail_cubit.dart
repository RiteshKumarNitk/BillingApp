import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_order_by_id_usecase.dart';
import 'order_detail_state.dart';

class OrderDetailCubit extends Cubit<OrderDetailState> {
  final GetOrderByIdUseCase _getOrderByIdUseCase;
  final String orderId;

  OrderDetailCubit({required GetOrderByIdUseCase getOrderByIdUseCase, required this.orderId})
      : _getOrderByIdUseCase = getOrderByIdUseCase,
        super(const OrderDetailState());

  Future<void> loadOrder() async {
    emit(state.copyWith(status: OrderDetailStatus.loading));
    final result = await _getOrderByIdUseCase(orderId);
    result.match(
      (failure) => emit(state.copyWith(status: OrderDetailStatus.error, errorMessage: failure.message)),
      (order) => emit(state.copyWith(status: OrderDetailStatus.loaded, order: order)),
    );
  }
}
