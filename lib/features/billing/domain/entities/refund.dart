import 'package:equatable/equatable.dart';

class Refund extends Equatable {
  final String id;
  final String transactionId;
  final DateTime refundDate;
  final double refundAmount;
  final String reason;
  final bool restockItems; // Whether to restore stock
  final List<RefundItem> items;
  final String? notes;
  final String approvedBy;

  const Refund({
    required this.id,
    required this.transactionId,
    required this.refundDate,
    required this.refundAmount,
    required this.reason,
    required this.restockItems,
    required this.items,
    required this.approvedBy,
    this.notes,
  });

  @override
  List<Object?> get props => [
    id,
    transactionId,
    refundDate,
    refundAmount,
    reason,
    restockItems,
    items,
    notes,
    approvedBy,
  ];
}

class RefundItem extends Equatable {
  final String productId;
  final String productName;
  final int quantity;
  final double pricePerUnit;
  final double totalAmount;

  const RefundItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.pricePerUnit,
    required this.totalAmount,
  });

  @override
  List<Object?> get props => [
    productId,
    productName,
    quantity,
    pricePerUnit,
    totalAmount,
  ];
}
