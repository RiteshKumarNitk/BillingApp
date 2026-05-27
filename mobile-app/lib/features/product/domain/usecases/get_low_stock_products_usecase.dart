import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/product.dart';
import '../repositories/product_repository.dart';

class GetLowStockProductsUseCase extends UseCase<List<Product>, NoParams> {
  final ProductRepository repository;

  GetLowStockProductsUseCase(this.repository);

  @override
  Future<Either<Failure, List<Product>>> call(NoParams params) async {
    try {
      final result = await repository.getProducts();
      return result.fold(
        (failure) => Left(failure),
        (products) {
          final lowStockProducts = products.where((p) => p.isLowStock).toList();
          return Right(lowStockProducts);
        },
      );
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
