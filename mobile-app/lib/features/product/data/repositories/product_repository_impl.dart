import 'package:flutter/foundation.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/data/hive_database.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/product.dart';
import '../../domain/repositories/product_repository.dart';
import '../models/product_model.dart';

class ProductRepositoryImpl implements ProductRepository {
  final ApiClient apiClient;

  ProductRepositoryImpl({ApiClient? apiClient}) : apiClient = apiClient ?? ApiClient();

  @override
  Future<Either<Failure, List<Product>>> getProducts() async {
    try {
      try {
        final response = await apiClient.get('/products');
        if (response != null && response['products'] != null) {
          final List<dynamic> jsonList = response['products'];
          final products = jsonList.map((json) => ProductModel.fromJson(json)).toList();
          final box = HiveDatabase.productBox;
          await box.clear();
          for (var model in products) {
            await box.put(model.id, model);
          }
          return Right(products.map((m) => m.toEntity()).toList());
        }
      } catch (e) {
        debugPrint('API fetch failed, falling back to local: $e');
      }
      final box = HiveDatabase.productBox;
      final products = box.values.toList();
      return Right(products.map((p) => (p as ProductModel).toEntity()).toList());
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Product>> getProductByBarcode(String barcode) async {
    try {
      final box = HiveDatabase.productBox;
      final product = box.values.firstWhere(
        (element) => element.barcode == barcode,
        orElse: () => throw Exception('Product not found'),
      );
      return Right((product as ProductModel).toEntity());
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> addProduct(Product product) async {
    try {
      final model = ProductModel.fromEntity(product);
      try {
        final response = await apiClient.post('/products', body: model.toJson());
        if (response != null && response['product'] != null) {
          final synced = ProductModel.fromJson(response['product']);
          final box = HiveDatabase.productBox;
          await box.put(synced.id, synced);
          return const Right(null);
        }
      } catch (e) {
        debugPrint('Failed to sync product to API: $e');
      }
      final box = HiveDatabase.productBox;
      await box.put(model.id, model);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateProduct(Product product) async {
    try {
      final model = ProductModel.fromEntity(product);
      try {
        final response = await apiClient.updateProduct(product.id, model.toJson());
        if (response != null && response['product'] != null) {
          final synced = ProductModel.fromJson(response['product']);
          final box = HiveDatabase.productBox;
          await box.put(synced.id, synced);
          return const Right(null);
        }
      } catch (e) {
        debugPrint('Failed to sync product update to API: $e');
      }
      final box = HiveDatabase.productBox;
      await box.put(model.id, model);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteProduct(String id) async {
    try {
      try {
        await apiClient.deleteProduct(id);
      } catch (e) {
        debugPrint('Failed to delete product from API: $e');
      }
      final box = HiveDatabase.productBox;
      await box.delete(id);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
