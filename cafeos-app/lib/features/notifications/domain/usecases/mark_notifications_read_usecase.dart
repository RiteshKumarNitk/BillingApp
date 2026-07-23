import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/notifications_repository.dart';

class MarkNotificationsReadParams extends Equatable {
  /// Null means "mark all read"; otherwise marks exactly these ids.
  final List<String>? ids;
  const MarkNotificationsReadParams({this.ids});

  @override
  List<Object?> get props => [ids];
}

class MarkNotificationsReadUseCase implements UseCase<void, MarkNotificationsReadParams> {
  final NotificationsRepository repository;
  const MarkNotificationsReadUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(MarkNotificationsReadParams params) {
    return params.ids == null ? repository.markAllRead() : repository.markRead(params.ids!);
  }
}
