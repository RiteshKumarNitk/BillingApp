import 'package:equatable/equatable.dart';
import '../../domain/entities/order.dart';

enum OrderDetailStatus { initial, loading, loaded, error }

class OrderDetailState extends Equatable {
  final OrderDetailStatus status;
  final Order? order;
  final String? errorMessage;

  const OrderDetailState({this.status = OrderDetailStatus.initial, this.order, this.errorMessage});

  OrderDetailState copyWith({OrderDetailStatus? status, Order? order, String? errorMessage}) {
    return OrderDetailState(status: status ?? this.status, order: order ?? this.order, errorMessage: errorMessage);
  }

  @override
  List<Object?> get props => [status, order, errorMessage];
}
