import 'package:equatable/equatable.dart';

enum ExpiryStatus {
  fresh,        // >30 days
  expiringSoon, // 7-30 days
  expired,      // <7 days or past date
}

class ProductVariant extends Equatable {
  final String id;
  final String name;
  final String? barcode;
  final double mrp;
  final double salePrice;
  final double purchasePrice;
  final double stock;

  const ProductVariant({
    required this.id,
    required this.name,
    this.barcode,
    required this.mrp,
    required this.salePrice,
    this.purchasePrice = 0.0,
    required this.stock,
  });

  @override
  List<Object?> get props => [id, name, barcode, mrp, salePrice, purchasePrice, stock];
}

class ProductBatch extends Equatable {
  final String id;
  final String batchNumber;
  final double stock;
  final DateTime? manufacturingDate;
  final DateTime? expiryDate;

  const ProductBatch({
    required this.id,
    required this.batchNumber,
    required this.stock,
    this.manufacturingDate,
    this.expiryDate,
  });

  @override
  List<Object?> get props => [id, batchNumber, stock, manufacturingDate, expiryDate];
}

class ProductSerial extends Equatable {
  final String id;
  final String serialNumber;
  final String status;

  const ProductSerial({
    required this.id,
    required this.serialNumber,
    required this.status,
  });

  @override
  List<Object?> get props => [id, serialNumber, status];
}

class Product extends Equatable {
  final String id;
  final String name;
  final String barcode;
  final String productType; // SIMPLE, WEIGHT, VARIANT, BATCH, SERIAL, SERVICE
  final String unit;
  final bool allowDecimal;
  final double mrp;
  final double salePrice;
  final double purchasePrice;
  final double stock;
  final DateTime? expiryDate;
  final DateTime? manufacturingDate;
  final String? batchNumber;
  final String? category;
  final double minStockThreshold;
  
  final List<ProductVariant> variants;
  final List<ProductBatch> batches;
  final List<ProductSerial> serials;

  const Product({
    required this.id,
    required this.name,
    required this.barcode,
    this.productType = 'SIMPLE',
    this.unit = 'PIECE',
    this.allowDecimal = false,
    required this.mrp,
    required this.salePrice,
    this.purchasePrice = 0.0,
    this.stock = 0.0,
    this.expiryDate,
    this.manufacturingDate,
    this.batchNumber,
    this.category,
    this.minStockThreshold = 10.0,
    this.variants = const [],
    this.batches = const [],
    this.serials = const [],
  });

  // Keep compatibility getter for `price` if any old code uses it, maps to salePrice
  double get price => salePrice;

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
    productType,
    unit,
    allowDecimal,
    mrp,
    salePrice,
    purchasePrice,
    stock,
    expiryDate,
    manufacturingDate,
    batchNumber,
    category,
    minStockThreshold,
    variants,
    batches,
    serials,
  ];
}
