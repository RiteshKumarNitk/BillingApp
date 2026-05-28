import 'package:flutter/foundation.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/data/hive_database.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/shop.dart';
import '../../domain/repositories/shop_repository.dart';
import '../models/shop_model.dart';

class ShopRepositoryImpl implements ShopRepository {
  static const String shopKey = 'shop_details';
  final ApiClient _apiClient;

  ShopRepositoryImpl(this._apiClient);

  @override
  Future<Either<Failure, Shop>> getShop() async {
    try {
      final response = await _apiClient.getShop();
      if (response['shop'] != null) {
        final shop = ShopModel.fromJson(response['shop']);
        final box = HiveDatabase.shopBox;
        await box.put(shopKey, shop);
        return Right(shop.toEntity());
      }
    } catch (e) {
      debugPrint('API fetch failed, falling back to local: $e');
    }
    try {
      final box = HiveDatabase.shopBox;
      final shop = box.get(shopKey);
      if (shop != null) {
        return Right(shop.toEntity());
      }
      return const Right(Shop(
        name: 'My Shop',
        addressLine1: '',
        addressLine2: '',
        phoneNumber: '',
        upiId: '',
        footerText: 'Thank you, Visit again!!!',
      ));
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateShop(Shop shop) async {
    try {
      final box = HiveDatabase.shopBox;
      final model = ShopModel.fromEntity(shop);
      await box.put(shopKey, model);
      try {
        await _apiClient.updateShop(model.toJson());
      } catch (e) {
        debugPrint('Failed to sync shop to API: $e');
      }
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
