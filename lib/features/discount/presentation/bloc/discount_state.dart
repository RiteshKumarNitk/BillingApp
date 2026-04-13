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
      errorMessage: errorMessage ?? this.errorMessage,
      successMessage: successMessage ?? this.successMessage,
    );
  }

  @override
  List<Object?> get props => [status, discounts, errorMessage, successMessage];
}
