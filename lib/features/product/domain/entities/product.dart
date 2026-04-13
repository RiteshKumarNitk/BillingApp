import 'package:equatable/equatable.dart';

enum ExpiryStatus {
  fresh,        // >30 days
  expiringSoon, // 7-30 days
  expired,      // <7 days or past date
}

class Product extends Equatable {
  final String id;
  final String name;
  final String barcode;
  final double price;
  final int stock;
  final DateTime? expiryDate;
  final DateTime? manufacturingDate;
  final String? batchNumber;
  final String? category;
  final int minStockThreshold;

  const Product({
    required this.id,
    required this.name,
    required this.barcode,
    required this.price,
    this.stock = 0,
    this.expiryDate,
    this.manufacturingDate,
    this.batchNumber,
    this.category,
    this.minStockThreshold = 10,
  });

  /// Calculate days until expiry
  int? get daysUntilExpiry {
    if (expiryDate == null) return null;
    return expiryDate!.difference(DateTime.now()).inDays;
  }

  /// Get expiry status
  ExpiryStatus get expiryStatus {
    final daysLeft = daysUntilExpiry;
    if (daysLeft == null) return ExpiryStatus.fresh;
    if (daysLeft > 30) return ExpiryStatus.fresh;
    if (daysLeft > 7) return ExpiryStatus.expiringSoon;
    return ExpiryStatus.expired;
  }

  /// Check if product is expired
  bool get isExpired {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  /// Check if stock is low
  bool get isLowStock {
    return stock <= minStockThreshold;
  }

  @override
  List<Object?> get props => [
    id,
    name,
    barcode,
    price,
    stock,
    expiryDate,
    manufacturingDate,
    batchNumber,
    category,
    minStockThreshold,
  ];
}
