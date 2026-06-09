class CustomerProfile {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final DateTime createdAt;
  final int totalOrders;
  final int loyaltyPoints;
  final double totalSpent;

  CustomerProfile({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.createdAt,
    required this.totalOrders,
    required this.loyaltyPoints,
    required this.totalSpent,
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      totalOrders: json['_count']?['orderRequests'] ?? 0,
      loyaltyPoints: json['loyaltyPoints'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
    );
  }

  CustomerProfile copyWith({
    String? name,
    String? phone,
  }) {
    return CustomerProfile(
      id: id,
      name: name ?? this.name,
      email: email,
      phone: phone ?? this.phone,
      createdAt: createdAt,
      totalOrders: totalOrders,
      loyaltyPoints: loyaltyPoints,
      totalSpent: totalSpent,
    );
  }
}
