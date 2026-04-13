import 'package:equatable/equatable.dart';

class ExpiryAlert extends Equatable {
  final String id;
  final String productId;
  final String productName;
  final DateTime expiryDate;
  final int daysUntilExpiry;
  final int stockCount;
  final bool isAlertSent;
  final DateTime createdDate;

  const ExpiryAlert({
    required this.id,
    required this.productId,
    required this.productName,
    required this.expiryDate,
    required this.daysUntilExpiry,
    required this.stockCount,
    this.isAlertSent = false,
    required this.createdDate,
  });

  @override
  List<Object?> get props => [
    id,
    productId,
    productName,
    expiryDate,
    daysUntilExpiry,
    stockCount,
    isAlertSent,
    createdDate,
  ];
}
