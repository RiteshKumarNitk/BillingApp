import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/expiry_alert.dart';
import '../repositories/expiry_alert_repository.dart';

class GetExpiringAlertsUseCase extends UseCase<List<ExpiryAlert>, int> {
  final IExpiryAlertRepository repository;

  GetExpiringAlertsUseCase(this.repository);

  @override
  Future<Either<Failure, List<ExpiryAlert>>> call(int daysThreshold) async {
    try {
      if (daysThreshold <= 0) {
        return Left(CacheFailure('Days threshold must be greater than 0'));
      }
      final alerts = await repository.getExpiringAlerts(daysThreshold);
      return Right(alerts);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
