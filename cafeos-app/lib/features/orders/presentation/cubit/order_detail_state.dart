import 'package:equatable/equatable.dart';
import '../../domain/entities/order.dart';

enum OrderDetailStatus { initial, loading, loaded, error }

class OrderDetailState extends Equatable {
  final OrderDetailStatus status;
  final Order? order;
  final String? errorMessage;
  // Cancel is an action on an already-loaded order: its progress/failure lives in separate fields
  // so a failed cancel shows a message without replacing the order with an error screen.
  final bool isCancelling;
  final String? cancelError;

  const OrderDetailState({
    this.status = OrderDetailStatus.initial,
    this.order,
    this.errorMessage,
    this.isCancelling = false,
    this.cancelError,
  });

  OrderDetailState copyWith({
    OrderDetailStatus? status,
    Order? order,
    String? errorMessage,
    bool? isCancelling,
    String? cancelError,
  }) {
    return OrderDetailState(
      status: status ?? this.status,
      order: order ?? this.order,
      errorMessage: errorMessage,
      isCancelling: isCancelling ?? this.isCancelling,
      cancelError: cancelError,
    );
  }

  @override
  List<Object?> get props => [status, order, errorMessage, isCancelling, cancelError];
}
