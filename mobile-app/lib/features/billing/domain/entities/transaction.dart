import 'package:equatable/equatable.dart';

class TransactionItem extends Equatable {
  final String productId;
  final String productName;
  final double price;
  final int quantity;
  final double total;

  const TransactionItem({
    required this.productId,
    required this.productName,
    required this.price,
    required this.quantity,
    required this.total,
  });

  @override
  List<Object?> get props => [productId, productName, price, quantity, total];
}

class Transaction extends Equatable {
  final String id;
  final DateTime timestamp;
  final List<TransactionItem> items;
  final double subtotal;
  final double discountAmount;
  final double taxAmount;
  final double totalAmount;
  final String paymentMethod;
  final double amountReceived;
  final double changeAmount;
  final String? customerId;
  final String? customerName;
  final String? customerPhone;
  final bool isRefunded;
  final String? refundId;
  final String? notes;

  const Transaction({
    required this.id,
    required this.timestamp,
    required this.items,
    required this.subtotal,
    this.discountAmount = 0.0,
    required this.taxAmount,
    required this.totalAmount,
    required this.paymentMethod,
    this.amountReceived = 0.0,
    this.changeAmount = 0.0,
    this.customerId,
    this.customerName,
    this.customerPhone,
    this.isRefunded = false,
    this.refundId,
    this.notes,
  });

  @override
  List<Object?> get props => [
        id,
        timestamp,
        items,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        paymentMethod,
        amountReceived,
        changeAmount,
        customerId,
        customerName,
        customerPhone,
        isRefunded,
        refundId,
        notes
      ];
}
