part of 'discount_bloc.dart';

abstract class DiscountEvent extends Equatable {
  const DiscountEvent();

  @override
  List<Object?> get props => [];
}

class LoadTodayDiscounts extends DiscountEvent {
  const LoadTodayDiscounts();
}

class SaveDiscount extends DiscountEvent {
  final Discount discount;
  const SaveDiscount(this.discount);

  @override
  List<Object?> get props => [discount];
}

class UpdateDiscount extends DiscountEvent {
  final Discount discount;
  const UpdateDiscount(this.discount);

  @override
  List<Object?> get props => [discount];
}

class DeleteDiscount extends DiscountEvent {
  final String discountId;
  const DeleteDiscount(this.discountId);

  @override
  List<Object?> get props => [discountId];
}

class ResetDiscountState extends DiscountEvent {
  const ResetDiscountState();
}
