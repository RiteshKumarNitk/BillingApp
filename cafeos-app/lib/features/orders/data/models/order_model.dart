import '../../domain/entities/order.dart';

class OrderModel extends Order {
  const OrderModel({
    required super.id,
    required super.status,
    super.notes,
    required super.totalAmount,
    required super.taxAmount,
    required super.netAmount,
    super.discountAmount,
    super.discountLabel,
    super.orderType,
    super.tableLabel,
    required super.tenantId,
    required super.tenantName,
    super.tenantLogoUrl,
    required super.createdAt,
    super.items,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final tenant = json['tenant'] as Map<String, dynamic>?;
    final table = json['table'] as Map<String, dynamic>?;
    return OrderModel(
      id: json['id'] as String,
      status: orderStatusFromString(json['status'] as String? ?? 'PENDING'),
      notes: json['notes'] as String?,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? 0,
      netAmount: (json['netAmount'] as num?)?.toDouble() ?? 0,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0,
      discountLabel: json['discountLabel'] as String?,
      orderType: json['orderType'] as String?,
      tableLabel: table?['label'] as String?,
      tenantId: json['tenantId'] as String,
      tenantName: tenant?['name'] as String? ?? 'Cafe',
      tenantLogoUrl: tenant?['logoUrl'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      items: ((json['items'] as List<dynamic>?) ?? []).map((i) => _orderItemFromJson(i as Map<String, dynamic>)).toList(),
    );
  }

  static OrderItem _orderItemFromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] as String,
      productId: json['productId'] as String,
      name: json['name'] as String,
      salePrice: (json['salePrice'] as num?)?.toDouble() ?? 0,
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
      itemTotal: (json['itemTotal'] as num?)?.toDouble() ?? 0,
      comboComponents: ((json['comboComponents'] as List<dynamic>?) ?? [])
          .map((c) => OrderComboComponent(
                name: c['name'] as String,
                variantName: c['variantName'] as String?,
                quantity: (c['quantity'] as num?)?.toInt() ?? 1,
              ))
          .toList(),
    );
  }
}
