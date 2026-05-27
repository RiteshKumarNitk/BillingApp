import 'package:hive/hive.dart';
import '../../domain/entities/refund.dart';

part 'refund_model.g.dart';

@HiveType(typeId: 4)
class RefundItemModel extends RefundItem {
  @override
  @HiveField(0)
  final String productId;

  @override
  @HiveField(1)
  final String productName;

  @override
  @HiveField(2)
  final int quantity;

  @override
  @HiveField(3)
  final double pricePerUnit;

  @override
  @HiveField(4)
  final double totalAmount;

  const RefundItemModel({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.pricePerUnit,
    required this.totalAmount,
  }) : super(
    productId: productId,
    productName: productName,
    quantity: quantity,
    pricePerUnit: pricePerUnit,
    totalAmount: totalAmount,
  );

  factory RefundItemModel.fromEntity(RefundItem item) {
    return RefundItemModel(
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalAmount: item.totalAmount,
    );
  }

  RefundItem toEntity() {
    return RefundItem(
      productId: productId,
      productName: productName,
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      totalAmount: totalAmount,
    );
  }
}

@HiveType(typeId: 5)
class RefundModel extends Refund {
  @override
  @HiveField(0)
  final String id;

  @override
  @HiveField(1)
  final String transactionId;

  @override
  @HiveField(2)
  final DateTime refundDate;

  @override
  @HiveField(3)
  final double refundAmount;

  @override
  @HiveField(4)
  final String reason;

  @override
  @HiveField(5)
  final bool restockItems;

  @override
  @HiveField(6)
  final List<RefundItemModel> items;

  @override
  @HiveField(7)
  final String? notes;

  @override
  @HiveField(8)
  final String approvedBy;

  const RefundModel({
    required this.id,
    required this.transactionId,
    required this.refundDate,
    required this.refundAmount,
    required this.reason,
    required this.restockItems,
    required this.items,
    required this.approvedBy,
    this.notes,
  }) : super(
    id: id,
    transactionId: transactionId,
    refundDate: refundDate,
    refundAmount: refundAmount,
    reason: reason,
    restockItems: restockItems,
    items: items,
    approvedBy: approvedBy,
    notes: notes,
  );

  factory RefundModel.fromEntity(Refund refund) {
    return RefundModel(
      id: refund.id,
      transactionId: refund.transactionId,
      refundDate: refund.refundDate,
      refundAmount: refund.refundAmount,
      reason: refund.reason,
      restockItems: refund.restockItems,
      items: refund.items
          .map((item) => RefundItemModel.fromEntity(item))
          .toList(),
      approvedBy: refund.approvedBy,
      notes: refund.notes,
    );
  }

  Refund toEntity() {
    return Refund(
      id: id,
      transactionId: transactionId,
      refundDate: refundDate,
      refundAmount: refundAmount,
      reason: reason,
      restockItems: restockItems,
      items: items.map((item) => item.toEntity()).toList(),
      approvedBy: approvedBy,
      notes: notes,
    );
  }
}
