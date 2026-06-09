import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/customer_order_model.dart';

abstract class CustomerOrdersEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadCustomerOrders extends CustomerOrdersEvent {}
class RefreshCustomerOrders extends CustomerOrdersEvent {}

abstract class CustomerOrdersState extends Equatable {
  @override
  List<Object?> get props => [];
}

class CustomerOrdersInitial extends CustomerOrdersState {}
class CustomerOrdersLoading extends CustomerOrdersState {}
class CustomerOrdersLoaded extends CustomerOrdersState {
  final List<CustomerOrder> orders;
  CustomerOrdersLoaded({required this.orders});
  @override
  List<Object?> get props => [orders];
}
class CustomerOrdersError extends CustomerOrdersState {
  final String message;
  CustomerOrdersError({required this.message});
  @override
  List<Object?> get props => [message];
}

class CustomerOrdersBloc extends Bloc<CustomerOrdersEvent, CustomerOrdersState> {
  final ApiClient _apiClient;

  CustomerOrdersBloc({required ApiClient apiClient}) : _apiClient = apiClient, super(CustomerOrdersInitial()) {
    on<LoadCustomerOrders>(_onLoad);
    on<RefreshCustomerOrders>(_onLoad);
  }

  Future<void> _onLoad(CustomerOrdersEvent event, Emitter<CustomerOrdersState> emit) async {
    if (event is LoadCustomerOrders) emit(CustomerOrdersLoading());
    try {
      final response = await _apiClient.getCustomerOrders();
      final orders = (response['orders'] as List<dynamic>? ?? [])
          .map((e) => CustomerOrder.fromJson(e))
          .toList();
      emit(CustomerOrdersLoaded(orders: orders));
    } catch (e) {
      emit(CustomerOrdersError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }
}
