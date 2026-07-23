import 'package:equatable/equatable.dart';
import '../../domain/entities/placed_order.dart';

enum CheckoutStatus { idle, submitting, success, error }

class CheckoutState extends Equatable {
  final CheckoutStatus status;
  final PlacedOrder? placedOrder;
  final String? errorMessage;

  const CheckoutState({this.status = CheckoutStatus.idle, this.placedOrder, this.errorMessage});

  CheckoutState copyWith({CheckoutStatus? status, PlacedOrder? placedOrder, String? errorMessage}) {
    return CheckoutState(
      status: status ?? this.status,
      placedOrder: placedOrder ?? this.placedOrder,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, placedOrder, errorMessage];
}
