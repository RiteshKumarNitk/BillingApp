class CustomerNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final String? orderId;
  final DateTime createdAt;

  CustomerNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    this.orderId,
    required this.createdAt,
  });

  factory CustomerNotification.fromJson(Map<String, dynamic> json) {
    return CustomerNotification(
      id: json['id'] ?? '',
      type: json['type'] ?? 'GENERAL',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      isRead: json['isRead'] ?? false,
      orderId: json['orderId'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}
