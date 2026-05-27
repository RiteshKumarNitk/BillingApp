import 'package:hive/hive.dart';
import '../../domain/entities/transaction.dart';

part 'transaction_model.g.dart';

@HiveType(typeId: 2)
class TransactionItemModel extends TransactionItem {
  @override
  @HiveField(0)
  final String productId;

  @override
  @HiveField(1)
  final String productName;

  @override
  @HiveField(2)
  final double price;

  @override
  @HiveField(3)
  final int quantity;

  @override
  @HiveField(4)
  final double total;

  const TransactionItemModel({
    required this.productId,
    required this.productName,
    required this.price,
    required this.quantity,
    required this.total,
  }) : super(
    productId: productId,
    productName: productName,
    price: price,
    quantity: quantity,
    total: total,
  );

  factory TransactionItemModel.fromEntity(TransactionItem item) {
    return TransactionItemModel(
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
    );
  }

  TransactionItem toEntity() {
    return TransactionItem(
      productId: productId,
      productName: productName,
      price: price,
      quantity: quantity,
      total: total,
    );
  }
}

@HiveType(typeId: 3)
class TransactionModel extends Transaction {
  @override
  @HiveField(0)
  final String id;

  @override
  @HiveField(1)
  final DateTime timestamp;

  @override
  @HiveField(2)
  final List<TransactionItemModel> items;

  @override
  @HiveField(3)
  final double subtotal;

  @override
  @HiveField(4)
  final double taxAmount;

  @override
  @HiveField(5)
  final double totalAmount;

  @override
  @HiveField(6)
  final String paymentMethod;

  @override
  @HiveField(7)
  final bool isRefunded;

  @override
  @HiveField(8)
  final String? refundId;

  @override
  @HiveField(9)
  final String? notes;

  const TransactionModel({
    required this.id,
    required this.timestamp,
    required this.items,
    required this.subtotal,
    required this.taxAmount,
    required this.totalAmount,
    required this.paymentMethod,
    this.isRefunded = false,
    this.refundId,
    this.notes,
  }) : super(
    id: id,
    timestamp: timestamp,
    items: items,
    subtotal: subtotal,
    taxAmount: taxAmount,
    totalAmount: totalAmount,
    paymentMethod: paymentMethod,
    isRefunded: isRefunded,
    refundId: refundId,
    notes: notes,
  );

  factory TransactionModel.fromEntity(Transaction transaction) {
    return TransactionModel(
      id: transaction.id,
      timestamp: transaction.timestamp,
      items: transaction.items
          .map((item) => TransactionItemModel.fromEntity(item))
          .toList(),
      subtotal: transaction.subtotal,
      taxAmount: transaction.taxAmount,
      totalAmount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      isRefunded: transaction.isRefunded,
      refundId: transaction.refundId,
      notes: transaction.notes,
    );
  }

  Transaction toEntity() {
    return Transaction(
      id: id,
      timestamp: timestamp,
      items: items.map((item) => item.toEntity()).toList(),
      subtotal: subtotal,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      isRefunded: isRefunded,
      refundId: refundId,
      notes: notes,
    );
  }
}
