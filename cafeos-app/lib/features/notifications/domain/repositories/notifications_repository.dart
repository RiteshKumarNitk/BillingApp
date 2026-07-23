import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../entities/app_notification.dart';

class NotificationsResult {
  final List<AppNotification> notifications;
  final int unreadCount;
  const NotificationsResult({required this.notifications, required this.unreadCount});
}

abstract class NotificationsRepository {
  Future<Either<Failure, NotificationsResult>> getNotifications({bool unreadOnly});
  Future<Either<Failure, void>> markAllRead();
  Future<Either<Failure, void>> markRead(List<String> ids);
}
