import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/get_notifications_usecase.dart';
import '../../domain/usecases/mark_notifications_read_usecase.dart';
import 'notifications_state.dart';

/// One instance for the whole app session (like Cart/Favorites) so an unread badge could be shown
/// from anywhere (e.g. a future Home/bottom-nav badge) without re-fetching.
class NotificationsCubit extends Cubit<NotificationsState> {
  final GetNotificationsUseCase _getNotificationsUseCase;
  final MarkNotificationsReadUseCase _markNotificationsReadUseCase;

  NotificationsCubit({
    required GetNotificationsUseCase getNotificationsUseCase,
    required MarkNotificationsReadUseCase markNotificationsReadUseCase,
  })  : _getNotificationsUseCase = getNotificationsUseCase,
        _markNotificationsReadUseCase = markNotificationsReadUseCase,
        super(const NotificationsState());

  Future<void> loadNotifications() async {
    emit(state.copyWith(status: NotificationsStatus.loading));
    final result = await _getNotificationsUseCase(const NoParams());
    result.match(
      (failure) => emit(state.copyWith(status: NotificationsStatus.error, errorMessage: failure.message)),
      (data) => emit(state.copyWith(status: NotificationsStatus.loaded, notifications: data.notifications, unreadCount: data.unreadCount)),
    );
  }

  Future<void> markAllRead() async {
    final result = await _markNotificationsReadUseCase(const MarkNotificationsReadParams());
    result.match((_) {}, (_) {
      emit(state.copyWith(notifications: state.notifications.map((n) => n.copyWith(isRead: true)).toList(), unreadCount: 0));
    });
  }

  Future<void> markRead(String id) async {
    final matches = state.notifications.where((n) => n.id == id);
    if (matches.isEmpty || matches.first.isRead) return;
    final result = await _markNotificationsReadUseCase(MarkNotificationsReadParams(ids: [id]));
    result.match((_) {}, (_) {
      emit(state.copyWith(
        notifications: state.notifications.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
        unreadCount: (state.unreadCount - 1).clamp(0, 1 << 30),
      ));
    });
  }
}
