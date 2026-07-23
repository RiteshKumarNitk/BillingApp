import 'package:dio/dio.dart';
import '../models/notification_model.dart';

class NotificationsResponse {
  final List<NotificationModel> notifications;
  final int unreadCount;
  const NotificationsResponse({required this.notifications, required this.unreadCount});
}

class NotificationsRemoteDataSource {
  final Dio dio;
  NotificationsRemoteDataSource(this.dio);

  Future<NotificationsResponse> getNotifications({bool unreadOnly = false}) async {
    final response = await dio.get('/customer/notifications', queryParameters: {
      if (unreadOnly) 'unreadOnly': 'true',
    });
    final data = response.data as Map<String, dynamic>;
    final list = data['notifications'] as List<dynamic>;
    return NotificationsResponse(
      notifications: list.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList(),
      unreadCount: (data['unreadCount'] as num?)?.toInt() ?? 0,
    );
  }

  Future<void> markAllRead() => dio.patch('/customer/notifications', data: {'markAll': true});

  Future<void> markRead(List<String> ids) => dio.patch('/customer/notifications', data: {'notificationIds': ids});
}
