import 'package:equatable/equatable.dart';

enum NotificationType { orderStatus, general, promotion, unknown }

NotificationType notificationTypeFromString(String value) {
  switch (value) {
    case 'ORDER_STATUS':
      return NotificationType.orderStatus;
    case 'PROMOTION':
      return NotificationType.promotion;
    case 'GENERAL':
      return NotificationType.general;
    default:
      return NotificationType.unknown;
  }
}

class AppNotification extends Equatable {
  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final bool isRead;
  final String? orderId;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    this.orderId,
    required this.createdAt,
  });

  AppNotification copyWith({bool? isRead}) => AppNotification(
        id: id,
        type: type,
        title: title,
        message: message,
        isRead: isRead ?? this.isRead,
        orderId: orderId,
        createdAt: createdAt,
      );

  @override
  List<Object?> get props => [id, type, title, message, isRead, orderId, createdAt];
}
