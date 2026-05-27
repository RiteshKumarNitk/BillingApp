import 'package:equatable/equatable.dart';

class Discount extends Equatable {
  final String id;
  final String name;
  final String description;
  final double discountPercentage;
  final String? applicableCategory;
  final int? minimumQuantity;
  final DateTime startDate;
  final DateTime endDate;
  final bool isActive;

  const Discount({
    required this.id,
    required this.name,
    required this.description,
    required this.discountPercentage,
    this.applicableCategory,
    this.minimumQuantity,
    required this.startDate,
    required this.endDate,
    this.isActive = true,
  });

  bool get isValidToday {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate) && isActive;
  }

  /// Calculate discount amount for a given price
  double calculateDiscountAmount(double price) {
    return price * (discountPercentage / 100);
  }

  /// Calculate final price after discount
  double calculateFinalPrice(double price) {
    return price - calculateDiscountAmount(price);
  }

  @override
  List<Object?> get props => [
    id,
    name,
    description,
    discountPercentage,
    applicableCategory,
    minimumQuantity,
    startDate,
    endDate,
    isActive,
  ];
}
