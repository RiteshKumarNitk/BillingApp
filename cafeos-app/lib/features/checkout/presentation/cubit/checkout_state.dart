import 'dart:math';
import 'package:equatable/equatable.dart';
import '../../domain/entities/placed_order.dart';

enum CheckoutStatus { idle, submitting, success, error }

/// A fresh key per checkout attempt — a network retry or a double-tap before the button disables
/// reuses the same key, which the backend uses to return the original order instead of creating a
/// duplicate. Doesn't need to be a cryptographic UUID, just unique per attempt.
String _newIdempotencyKey() => '${DateTime.now().microsecondsSinceEpoch}-${Random().nextInt(1 << 32)}';

class CheckoutState extends Equatable {
  final CheckoutStatus status;
  final PlacedOrder? placedOrder;
  final String? errorMessage;
  final String idempotencyKey;

  CheckoutState({this.status = CheckoutStatus.idle, this.placedOrder, this.errorMessage, String? idempotencyKey})
      : idempotencyKey = idempotencyKey ?? _newIdempotencyKey();

  CheckoutState copyWith({CheckoutStatus? status, PlacedOrder? placedOrder, String? errorMessage, bool freshIdempotencyKey = false}) {
    return CheckoutState(
      status: status ?? this.status,
      placedOrder: placedOrder ?? this.placedOrder,
      errorMessage: errorMessage,
      idempotencyKey: freshIdempotencyKey ? _newIdempotencyKey() : idempotencyKey,
    );
  }

  @override
  List<Object?> get props => [status, placedOrder, errorMessage, idempotencyKey];
}
