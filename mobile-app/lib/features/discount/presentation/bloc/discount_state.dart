part of 'discount_bloc.dart';

enum DiscountStatus { initial, loading, saving, success, error }

class DiscountState extends Equatable {
  final DiscountStatus status;
  final List<Discount> discounts;
  final String errorMessage;
  final String successMessage;

  const DiscountState({
    this.status = DiscountStatus.initial,
    this.discounts = const [],
    this.errorMessage = '',
    this.successMessage = '',
  });

  DiscountState copyWith({
    DiscountStatus? status,
    List<Discount>? discounts,
    String? errorMessage,
    String? successMessage,
  }) {
    return DiscountState(
      status: status ?? this.status,
      discounts: discounts ?? this.discounts,
      // Messages are never carried over implicitly — every emission states
      // its own message (or '') so a stale success/error can't leak into an
      // unrelated later state (e.g. a plain reload after a save completes).
      errorMessage: errorMessage ?? '',
      successMessage: successMessage ?? '',
    );
  }

  @override
  List<Object?> get props => [status, discounts, errorMessage, successMessage];
}
