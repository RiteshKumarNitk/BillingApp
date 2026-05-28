import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/discount.dart';
import '../../domain/repositories/discount_repository.dart';
import '../models/discount_model.dart';

class DiscountRepositoryImpl extends IDiscountRepository {
  final Box<DiscountModel> _discountBox;
  final ApiClient _apiClient;

  DiscountRepositoryImpl(this._discountBox, this._apiClient);

  @override
  Future<void> saveDiscount(Discount discount) async {
    final model = DiscountModel.fromEntity(discount);
    await _discountBox.put(discount.id, model);
    try {
      await _apiClient.createDiscount({
        'name': discount.name,
        'description': discount.description,
        'discountPercentage': discount.discountPercentage,
        'applicableCategory': discount.applicableCategory,
        'minimumQuantity': discount.minimumQuantity,
        'startDate': discount.startDate.toIso8601String(),
        'endDate': discount.endDate.toIso8601String(),
        'isActive': discount.isActive,
      });
    } catch (e) {
      debugPrint('Failed to sync discount to API: $e');
    }
  }

  @override
  Future<Discount?> getDiscountById(String discountId) async {
    final model = _discountBox.get(discountId);
    return model?.toEntity();
  }

  @override
  Future<List<Discount>> getAllDiscounts() async {
    try {
      final response = await _apiClient.getDiscounts();
      if (response['discounts'] != null) {
        final List<dynamic> jsonList = response['discounts'];
        final discounts = jsonList.map((json) => DiscountModel.fromJson(json)).toList();
        await _discountBox.clear();
        for (var model in discounts) {
          await _discountBox.put(model.id, model);
        }
        return discounts.map((m) => m.toEntity()).toList();
      }
    } catch (e) {
      debugPrint('API fetch failed, falling back to local: $e');
    }
    final models = _discountBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Discount>> getActiveDiscounts() async {
    final discounts = await getAllDiscounts();
    return discounts.where((d) => d.isActive).toList();
  }

  @override
  Future<List<Discount>> getDiscountsByCategory(String category) async {
    final discounts = await getAllDiscounts();
    return discounts.where((d) => d.applicableCategory == category && d.isActive).toList();
  }

  @override
  Future<void> deleteDiscount(String discountId) async {
    await _discountBox.delete(discountId);
    try {
      await _apiClient.deleteDiscount(discountId);
    } catch (e) {
      debugPrint('Failed to delete discount from API: $e');
    }
  }

  @override
  Future<List<Discount>> getTodayDiscounts() async {
    final all = await getAllDiscounts();
    final now = DateTime.now();
    return all.where((d) => now.isAfter(d.startDate) && now.isBefore(d.endDate) && d.isActive).toList();
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
      try {
        await _apiClient.updateDiscount(discountId, {'isActive': isActive});
      } catch (e) {
        debugPrint('Failed to sync discount status: $e');
      }
    }
  }
}
