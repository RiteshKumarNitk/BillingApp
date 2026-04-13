import '../entities/discount.dart';

abstract class IDiscountRepository {
  /// Add or update a discount
  Future<void> saveDiscount(Discount discount);

  /// Get discount by ID
  Future<Discount?> getDiscountById(String discountId);

  /// Get all discounts
  Future<List<Discount>> getAllDiscounts();

  /// Get active discounts only
  Future<List<Discount>> getActiveDiscounts();

  /// Get discounts for a specific category
  Future<List<Discount>> getDiscountsByCategory(String category);

  /// Delete discount by ID
  Future<void> deleteDiscount(String discountId);

  /// Get applicable discounts for current date
  Future<List<Discount>> getTodayDiscounts();

  /// Toggle discount active status
  Future<void> toggleDiscountStatus(String discountId, bool isActive);
}
