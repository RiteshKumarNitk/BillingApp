import 'package:equatable/equatable.dart';
import '../../domain/entities/order.dart';

enum OrdersStatus { initial, loading, loaded, error }

// null = "All" tab. Otherwise a bucket the backend understands (see the ?status= query param on
// GET /customer/orders) — the labels shown in the UI are these, capitalized.
class OrdersFilter {
  OrdersFilter._();
  static const String upcoming = 'upcoming';
  static const String active = 'active';
  static const String completed = 'completed';
  static const String cancelled = 'cancelled';
}

class OrdersState extends Equatable {
  final OrdersStatus status;
  final List<Order> orders;
  final String? errorMessage;
  final String? filter;

  const OrdersState({this.status = OrdersStatus.initial, this.orders = const [], this.errorMessage, this.filter});

  OrdersState copyWith({OrdersStatus? status, List<Order>? orders, String? errorMessage, String? filter, bool clearFilter = false}) {
    return OrdersState(
      status: status ?? this.status,
      orders: orders ?? this.orders,
      errorMessage: errorMessage,
      filter: clearFilter ? null : (filter ?? this.filter),
    );
  }

  @override
  List<Object?> get props => [status, orders, errorMessage, filter];
}
