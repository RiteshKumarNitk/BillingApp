import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/entities/discount.dart';
import '../../domain/repositories/discount_repository.dart';
import '../models/discount_model.dart';

class DiscountRepositoryImpl extends IDiscountRepository {
  static const String boxName = 'discounts';
  final Box<DiscountModel> _discountBox;

  DiscountRepositoryImpl(this._discountBox);

  @override
  Future<void> saveDiscount(Discount discount) async {
    final model = DiscountModel.fromEntity(discount);
    await _discountBox.put(discount.id, model);
  }

  @override
  Future<Discount?> getDiscountById(String discountId) async {
    final model = _discountBox.get(discountId);
    return model?.toEntity();
  }

  @override
  Future<List<Discount>> getAllDiscounts() async {
    final models = _discountBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Discount>> getActiveDiscounts() async {
    final models = _discountBox.values.where((m) => m.isActive).toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Discount>> getDiscountsByCategory(String category) async {
    final models = _discountBox.values
        .where((m) => m.applicableCategory == category && m.isActive)
        .toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<void> deleteDiscount(String discountId) async {
    await _discountBox.delete(discountId);
  }

  @override
  Future<List<Discount>> getTodayDiscounts() async {
    final models = _discountBox.values.where((m) => m.isValidToday).toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<void> toggleDiscountStatus(String discountId, bool isActive) async {
    final model = _discountBox.get(discountId);
    if (model != null) {
      final updated = DiscountModel(
        id: model.id,
        name: model.name,
        description: model.description,
        discountPercentage: model.discountPercentage,
        applicableCategory: model.applicableCategory,
        minimumQuantity: model.minimumQuantity,
        startDate: model.startDate,
        endDate: model.endDate,
        isActive: isActive,
      );
      await _discountBox.put(discountId, updated);
    }
  }
}
