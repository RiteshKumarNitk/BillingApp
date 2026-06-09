import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/customer_notification_model.dart';

abstract class CustomerNotificationsEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadCustomerNotifications extends CustomerNotificationsEvent {}
class MarkNotificationRead extends CustomerNotificationsEvent {
  final String notificationId;
  MarkNotificationRead({required this.notificationId});
  @override
  List<Object?> get props => [notificationId];
}
class MarkAllNotificationsRead extends CustomerNotificationsEvent {}

abstract class CustomerNotificationsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class CustomerNotificationsInitial extends CustomerNotificationsState {}
class CustomerNotificationsLoading extends CustomerNotificationsState {}
class CustomerNotificationsLoaded extends CustomerNotificationsState {
  final List<CustomerNotification> notifications;
  final int unreadCount;
  CustomerNotificationsLoaded({required this.notifications, required this.unreadCount});
  @override
  List<Object?> get props => [notifications, unreadCount];
}
class CustomerNotificationsError extends CustomerNotificationsState {
  final String message;
  CustomerNotificationsError({required this.message});
  @override
  List<Object?> get props => [message];
}

class CustomerNotificationsBloc extends Bloc<CustomerNotificationsEvent, CustomerNotificationsState> {
  final ApiClient _apiClient;

  CustomerNotificationsBloc({required ApiClient apiClient}) : _apiClient = apiClient, super(CustomerNotificationsInitial()) {
    on<LoadCustomerNotifications>(_onLoad);
    on<MarkNotificationRead>(_onMarkRead);
    on<MarkAllNotificationsRead>(_onMarkAllRead);
  }

  Future<void> _onLoad(LoadCustomerNotifications event, Emitter<CustomerNotificationsState> emit) async {
    emit(CustomerNotificationsLoading());
    try {
      final response = await _apiClient.getCustomerNotifications();
      final notifications = (response['notifications'] as List<dynamic>? ?? [])
          .map((e) => CustomerNotification.fromJson(e))
          .toList();
      emit(CustomerNotificationsLoaded(notifications: notifications, unreadCount: response['unreadCount'] ?? 0));
    } catch (e) {
      emit(CustomerNotificationsError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onMarkRead(MarkNotificationRead event, Emitter<CustomerNotificationsState> emit) async {
    try {
      await _apiClient.markNotificationsRead({'notificationIds': [event.notificationId]});
      if (state is CustomerNotificationsLoaded) {
        final current = state as CustomerNotificationsLoaded;
        final updated = current.notifications.map((n) =>
          n.id == event.notificationId ? CustomerNotification(
            id: n.id, type: n.type, title: n.title, message: n.message,
            isRead: true, orderId: n.orderId, createdAt: n.createdAt,
          ) : n
        ).toList();
        emit(CustomerNotificationsLoaded(notifications: updated, unreadCount: current.unreadCount - 1));
      }
    } catch (_) {}
  }

  Future<void> _onMarkAllRead(MarkAllNotificationsRead event, Emitter<CustomerNotificationsState> emit) async {
    try {
      await _apiClient.markNotificationsRead({'markAll': true});
      if (state is CustomerNotificationsLoaded) {
        final current = state as CustomerNotificationsLoaded;
        final updated = current.notifications.map((n) => CustomerNotification(
          id: n.id, type: n.type, title: n.title, message: n.message,
          isRead: true, orderId: n.orderId, createdAt: n.createdAt,
        )).toList();
        emit(CustomerNotificationsLoaded(notifications: updated, unreadCount: 0));
      }
    } catch (_) {}
  }
}
