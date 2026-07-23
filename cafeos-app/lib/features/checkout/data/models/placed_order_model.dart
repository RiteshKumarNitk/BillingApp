import '../../domain/entities/placed_order.dart';

class PlacedOrderModel extends PlacedOrder {
  const PlacedOrderModel({
    required super.id,
    required super.totalAmount,
    required super.discountAmount,
    super.discountLabel,
    required super.taxAmount,
    required super.netAmount,
    super.orderType,
  });

  factory PlacedOrderModel.fromJson(Map<String, dynamic> json) {
    return PlacedOrderModel(
      id: json['id'] as String,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0,
      discountLabel: json['discountLabel'] as String?,
      taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? 0,
      netAmount: (json['netAmount'] as num?)?.toDouble() ?? 0,
      orderType: json['orderType'] as String?,
    );
  }
}
