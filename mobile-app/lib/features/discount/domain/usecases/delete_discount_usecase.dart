import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/discount_repository.dart';

class DeleteDiscountUseCase extends UseCase<void, String> {
  final IDiscountRepository repository;

  DeleteDiscountUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(String discountId) async {
    try {
      await repository.deleteDiscount(discountId);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
