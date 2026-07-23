import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/notifications_repository.dart';

class GetNotificationsUseCase implements UseCase<NotificationsResult, NoParams> {
  final NotificationsRepository repository;
  const GetNotificationsUseCase(this.repository);

  @override
  Future<Either<Failure, NotificationsResult>> call(NoParams params) => repository.getNotifications();
}
