class CustomerStore {
  final String id;
  final String name;
  final String? logoUrl;
  final String? address;
  final String? phone;
  final int orderCount;
  final double totalSpent;
  final int loyaltyPoints;
  final DateTime? lastOrderDate;

  CustomerStore({
    required this.id,
    required this.name,
    this.logoUrl,
    this.address,
    this.phone,
    required this.orderCount,
    required this.totalSpent,
    required this.loyaltyPoints,
    this.lastOrderDate,
  });

  factory CustomerStore.fromJson(Map<String, dynamic> json) {
    return CustomerStore(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      logoUrl: json['logoUrl'],
      address: json['address'],
      phone: json['phone'],
      orderCount: json['orderCount'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
      loyaltyPoints: json['loyaltyPoints'] ?? 0,
      lastOrderDate: json['lastOrderDate'] != null
          ? DateTime.parse(json['lastOrderDate'])
          : null,
    );
  }
}
