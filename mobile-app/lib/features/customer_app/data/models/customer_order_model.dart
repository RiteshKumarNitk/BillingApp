class CustomerOrder {
  final String id;
  final String status;
  final double totalAmount;
  final double taxAmount;
  final double netAmount;
  final DateTime createdAt;
  final String tenantId;
  final String storeName;
  final String? storeLogoUrl;
  final List<CustomerOrderItem> items;

  CustomerOrder({
    required this.id,
    required this.status,
    required this.totalAmount,
    required this.taxAmount,
    required this.netAmount,
    required this.createdAt,
    required this.tenantId,
    required this.storeName,
    this.storeLogoUrl,
    required this.items,
  });

  factory CustomerOrder.fromJson(Map<String, dynamic> json) {
    return CustomerOrder(
      id: json['id'] ?? '',
      status: json['status'] ?? '',
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      taxAmount: (json['taxAmount'] ?? 0).toDouble(),
      netAmount: (json['netAmount'] ?? 0).toDouble(),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      tenantId: json['tenantId'] ?? '',
      storeName: json['tenant']?['name'] ?? 'Unknown Store',
      storeLogoUrl: json['tenant']?['logoUrl'],
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => CustomerOrderItem.fromJson(e))
          .toList(),
    );
  }
}

class CustomerOrderItem {
  final String id;
  final String name;
  final double salePrice;
  final int quantity;
  final double itemTotal;

  CustomerOrderItem({
    required this.id,
    required this.name,
    required this.salePrice,
    required this.quantity,
    required this.itemTotal,
  });

  factory CustomerOrderItem.fromJson(Map<String, dynamic> json) {
    return CustomerOrderItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      salePrice: (json['salePrice'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 0,
      itemTotal: (json['itemTotal'] ?? 0).toDouble(),
    );
  }
}
