import 'package:fpdart/fpdart.dart';
import '../../../../core/data/hive_database.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/product.dart';
import '../../domain/repositories/product_repository.dart';
import '../models/product_model.dart';

class ProductRepositoryImpl implements ProductRepository {
  final ApiClient apiClient = ApiClient();

  @override
  Future<Either<Failure, List<Product>>> getProducts() async {
    try {
      // 1. Fetch from API
      try {
        final response = await apiClient.get('/products');
        if (response != null && response['products'] != null) {
          final List<dynamic> jsonList = response['products'];
          final products = jsonList.map((json) => ProductModel.fromJson(json)).toList();
          
          // 2. Sync to local Hive Database for offline access
          final box = HiveDatabase.productBox;
          await box.clear(); // clear old cache
          for (var model in products) {
            await box.put(model.id, model);
          }
          
          return Right(products.map((m) => m.toEntity()).toList());
        }
      } catch (e) {
        print('API fetch failed, falling back to local: $e');
      }

      // 3. Fallback to Local Hive Cache
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
      
      // 1. Try sending to API
      try {
        await apiClient.post('/products', body: model.toJson());
      } catch (e) {
        print('Failed to sync product to API: $e');
        // You might want to implement a sync queue here later
      }

      // 2. Save locally
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
      // NOTE: We would add a PUT /products/:id endpoint in Next.js to fully support this
      // For now we just update locally
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
      // NOTE: We would add a DELETE /products/:id endpoint
      final box = HiveDatabase.productBox;
      await box.delete(id);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
