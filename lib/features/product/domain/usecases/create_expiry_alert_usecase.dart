import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/expiry_alert.dart';
import '../repositories/expiry_alert_repository.dart';

class CreateExpiryAlertUseCase extends UseCase<void, ExpiryAlert> {
  final IExpiryAlertRepository repository;

  CreateExpiryAlertUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(ExpiryAlert alert) async {
    try {
      if (alert.daysUntilExpiry < 0) {
        return Left(CacheFailure('Cannot create alert for already expired items'));
      }
      if (alert.stockCount <= 0) {
        return Left(CacheFailure('Stock count must be greater than 0'));
      }
      await repository.createAlert(alert);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
