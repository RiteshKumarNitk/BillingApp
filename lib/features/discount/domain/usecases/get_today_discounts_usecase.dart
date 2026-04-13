import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/discount.dart';
import '../repositories/discount_repository.dart';

class GetTodayDiscountsUseCase extends UseCase<List<Discount>, NoParams> {
  final IDiscountRepository repository;

  GetTodayDiscountsUseCase(this.repository);

  @override
  Future<Either<Failure, List<Discount>>> call(NoParams params) async {
    try {
      final discounts = await repository.getTodayDiscounts();
      return Right(discounts);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
