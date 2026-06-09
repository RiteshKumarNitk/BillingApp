class CustomerDashboardStats {
  final int totalOrders;
  final int pendingOrders;
  final int completedOrders;
  final int rejectedOrders;
  final double totalSpent;
  final int loyaltyPoints;
  final int storesOrderedFrom;

  CustomerDashboardStats({
    required this.totalOrders,
    required this.pendingOrders,
    required this.completedOrders,
    required this.rejectedOrders,
    required this.totalSpent,
    required this.loyaltyPoints,
    required this.storesOrderedFrom,
  });

  factory CustomerDashboardStats.fromJson(Map<String, dynamic> json) {
    return CustomerDashboardStats(
      totalOrders: json['totalOrders'] ?? 0,
      pendingOrders: json['pendingOrders'] ?? 0,
      completedOrders: json['completedOrders'] ?? 0,
      rejectedOrders: json['rejectedOrders'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
      loyaltyPoints: json['loyaltyPoints'] ?? 0,
      storesOrderedFrom: json['storesOrderedFrom'] ?? 0,
    );
  }
}

class CustomerStoreSummary {
  final String id;
  final String name;
  final String? logoUrl;
  final String? address;
  final int orderCount;

  CustomerStoreSummary({
    required this.id,
    required this.name,
    this.logoUrl,
    this.address,
    required this.orderCount,
  });

  factory CustomerStoreSummary.fromJson(Map<String, dynamic> json) {
    return CustomerStoreSummary(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      logoUrl: json['logoUrl'],
      address: json['address'],
      orderCount: json['orderCount'] ?? 0,
    );
  }
}

class CustomerOrderSummary {
  final String id;
  final String status;
  final double netAmount;
  final DateTime createdAt;
  final String storeName;
  final List<OrderItemSummary> items;

  CustomerOrderSummary({
    required this.id,
    required this.status,
    required this.netAmount,
    required this.createdAt,
    required this.storeName,
    required this.items,
  });

  factory CustomerOrderSummary.fromJson(Map<String, dynamic> json) {
    return CustomerOrderSummary(
      id: json['id'] ?? '',
      status: json['status'] ?? '',
      netAmount: (json['netAmount'] ?? 0).toDouble(),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      storeName: json['tenant']?['name'] ?? 'Unknown Store',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => OrderItemSummary.fromJson(e))
          .toList(),
    );
  }
}

class OrderItemSummary {
  final String name;
  final int quantity;

  OrderItemSummary({required this.name, required this.quantity});

  factory OrderItemSummary.fromJson(Map<String, dynamic> json) {
    return OrderItemSummary(
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 0,
    );
  }
}

class CustomerDashboardData {
  final CustomerDashboardStats stats;
  final List<CustomerStoreSummary> stores;
  final List<CustomerOrderSummary> recentOrders;

  CustomerDashboardData({
    required this.stats,
    required this.stores,
    required this.recentOrders,
  });

  factory CustomerDashboardData.fromJson(Map<String, dynamic> json) {
    return CustomerDashboardData(
      stats: CustomerDashboardStats.fromJson(json['stats'] ?? {}),
      stores: (json['stores'] as List<dynamic>? ?? [])
          .map((e) => CustomerStoreSummary.fromJson(e))
          .toList(),
      recentOrders: (json['recentOrders'] as List<dynamic>? ?? [])
          .map((e) => CustomerOrderSummary.fromJson(e))
          .toList(),
    );
  }
}
