class OrderRequestItem {
  final String id;
  final String name;
  final double salePrice;
  final double quantity;
  final double itemTotal;

  OrderRequestItem({
    required this.id,
    required this.name,
    required this.salePrice,
    required this.quantity,
    required this.itemTotal,
  });

  factory OrderRequestItem.fromJson(Map<String, dynamic> json) {
    return OrderRequestItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      salePrice: (json['salePrice'] ?? 0).toDouble(),
      quantity: (json['quantity'] ?? 0).toDouble(),
      itemTotal: (json['itemTotal'] ?? 0).toDouble(),
    );
  }
}

class OrderRequest {
  final String id;
  final String status;
  final String? notes;
  final double totalAmount;
  final double taxAmount;
  final double netAmount;
  final DateTime createdAt;
  final String? customerName;
  final String? customerPhone;
  final String? customerEmail;
  final List<OrderRequestItem> items;

  OrderRequest({
    required this.id,
    required this.status,
    this.notes,
    required this.totalAmount,
    required this.taxAmount,
    required this.netAmount,
    required this.createdAt,
    this.customerName,
    this.customerPhone,
    this.customerEmail,
    required this.items,
  });

  factory OrderRequest.fromJson(Map<String, dynamic> json) {
    return OrderRequest(
      id: json['id'] ?? '',
      status: json['status'] ?? 'PENDING',
      notes: json['notes'],
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      taxAmount: (json['taxAmount'] ?? 0).toDouble(),
      netAmount: (json['netAmount'] ?? 0).toDouble(),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      customerName: json['customerAccount']?['name'],
      customerPhone: json['customerAccount']?['phone'],
      customerEmail: json['customerAccount']?['email'],
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => OrderRequestItem.fromJson(e))
          .toList(),
    );
  }
}
