import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/discount.dart';
import '../repositories/discount_repository.dart';

class SaveDiscountUseCase extends UseCase<void, Discount> {
  final IDiscountRepository repository;

  SaveDiscountUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(Discount discount) async {
    try {
      if (discount.discountPercentage <= 0 || discount.discountPercentage > 100) {
        return Left(CacheFailure('Discount percentage must be between 0 and 100'));
      }
      if (discount.startDate.isAfter(discount.endDate)) {
        return Left(CacheFailure('Start date must be before end date'));
      }
      await repository.saveDiscount(discount);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
