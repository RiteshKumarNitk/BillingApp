import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/order_request_model.dart';

// Events
abstract class OrderQueueEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadOrders extends OrderQueueEvent {
  final String status;
  LoadOrders({this.status = 'PENDING'});
  @override
  List<Object?> get props => [status];
}

class ApproveOrder extends OrderQueueEvent {
  final String orderId;
  ApproveOrder({required this.orderId});
  @override
  List<Object?> get props => [orderId];
}

class RejectOrder extends OrderQueueEvent {
  final String orderId;
  RejectOrder({required this.orderId});
  @override
  List<Object?> get props => [orderId];
}

// States
abstract class OrderQueueState extends Equatable {
  @override
  List<Object?> get props => [];
}

class OrderQueueInitial extends OrderQueueState {}
class OrderQueueLoading extends OrderQueueState {}
class OrderQueueLoaded extends OrderQueueState {
  final List<OrderRequest> orders;
  final Map<String, int> statusCounts;
  final String activeStatus;
  final String? processingOrderId;
  OrderQueueLoaded({
    required this.orders,
    required this.statusCounts,
    this.activeStatus = 'PENDING',
    this.processingOrderId,
  });
  @override
  List<Object?> get props => [orders, statusCounts, activeStatus, processingOrderId];
}
class OrderQueueError extends OrderQueueState {
  final String message;
  OrderQueueError({required this.message});
  @override
  List<Object?> get props => [message];
}

// BLoC
class OrderQueueBloc extends Bloc<OrderQueueEvent, OrderQueueState> {
  final ApiClient _apiClient;
  String _currentStatus = 'PENDING';

  OrderQueueBloc({required ApiClient apiClient})
      : _apiClient = apiClient,
        super(OrderQueueInitial()) {
    on<LoadOrders>(_onLoad);
    on<ApproveOrder>(_onApprove);
    on<RejectOrder>(_onReject);
  }

  Future<void> _onLoad(LoadOrders event, Emitter<OrderQueueState> emit) async {
    _currentStatus = event.status;
    emit(OrderQueueLoading());
    try {
      final response = await _apiClient.getMerchantOrders(status: event.status);
      final orders = (response['orders'] as List<dynamic>? ?? [])
          .map((e) => OrderRequest.fromJson(e))
          .toList();
      final counts = Map<String, int>.from(response['statusCounts'] ?? {});
      emit(OrderQueueLoaded(
        orders: orders,
        statusCounts: counts,
        activeStatus: event.status,
      ));
    } catch (e) {
      emit(OrderQueueError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onApprove(ApproveOrder event, Emitter<OrderQueueState> emit) async {
    if (state is OrderQueueLoaded) {
      final current = state as OrderQueueLoaded;
      emit(OrderQueueLoaded(orders: current.orders, statusCounts: current.statusCounts, activeStatus: current.activeStatus, processingOrderId: event.orderId));
    }
    try {
      await _apiClient.updateMerchantOrder(event.orderId, 'APPROVE');
      add(LoadOrders(status: _currentStatus));
    } catch (e) {
      emit(OrderQueueError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onReject(RejectOrder event, Emitter<OrderQueueState> emit) async {
    if (state is OrderQueueLoaded) {
      final current = state as OrderQueueLoaded;
      emit(OrderQueueLoaded(orders: current.orders, statusCounts: current.statusCounts, activeStatus: current.activeStatus, processingOrderId: event.orderId));
    }
    try {
      await _apiClient.updateMerchantOrder(event.orderId, 'REJECT');
      add(LoadOrders(status: _currentStatus));
    } catch (e) {
      emit(OrderQueueError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }
}
