import 'package:hive/hive.dart';
import '../../domain/entities/product.dart';

part 'product_model.g.dart'; // Hive generator

@HiveType(typeId: 10)
class ProductVariantModel extends ProductVariant {
  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String name;
  @override
  @HiveField(2)
  final String? barcode;
  @override
  @HiveField(3)
  final double mrp;
  @override
  @HiveField(4)
  final double salePrice;
  @override
  @HiveField(5)
  final double purchasePrice;
  @override
  @HiveField(6)
  final double stock;

  const ProductVariantModel({
    required this.id,
    required this.name,
    this.barcode,
    required this.mrp,
    required this.salePrice,
    this.purchasePrice = 0.0,
    required this.stock,
  }) : super(
          id: id,
          name: name,
          barcode: barcode,
          mrp: mrp,
          salePrice: salePrice,
          purchasePrice: purchasePrice,
          stock: stock,
        );

  factory ProductVariantModel.fromEntity(ProductVariant variant) {
    return ProductVariantModel(
      id: variant.id,
      name: variant.name,
      barcode: variant.barcode,
      mrp: variant.mrp,
      salePrice: variant.salePrice,
      purchasePrice: variant.purchasePrice,
      stock: variant.stock,
    );
  }

  factory ProductVariantModel.fromJson(Map<String, dynamic> json) {
    return ProductVariantModel(
      id: json['id'],
      name: json['name'],
      barcode: json['barcode'],
      mrp: (json['mrp'] ?? 0).toDouble(),
      salePrice: (json['salePrice'] ?? 0).toDouble(),
      purchasePrice: (json['purchasePrice'] ?? 0).toDouble(),
      stock: (json['stock'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'barcode': barcode,
      'mrp': mrp,
      'salePrice': salePrice,
      'purchasePrice': purchasePrice,
      'stock': stock,
    };
  }

  ProductVariant toEntity() {
    return ProductVariant(
      id: id,
      name: name,
      barcode: barcode,
      mrp: mrp,
      salePrice: salePrice,
      purchasePrice: purchasePrice,
      stock: stock,
    );
  }
}

@HiveType(typeId: 11)
class ProductBatchModel extends ProductBatch {
  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String batchNumber;
  @override
  @HiveField(2)
  final double stock;
  @override
  @HiveField(3)
  final DateTime? manufacturingDate;
  @override
  @HiveField(4)
  final DateTime? expiryDate;

  const ProductBatchModel({
    required this.id,
    required this.batchNumber,
    required this.stock,
    this.manufacturingDate,
    this.expiryDate,
  }) : super(
          id: id,
          batchNumber: batchNumber,
          stock: stock,
          manufacturingDate: manufacturingDate,
          expiryDate: expiryDate,
        );

  factory ProductBatchModel.fromEntity(ProductBatch batch) {
    return ProductBatchModel(
      id: batch.id,
      batchNumber: batch.batchNumber,
      stock: batch.stock,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
    );
  }

  factory ProductBatchModel.fromJson(Map<String, dynamic> json) {
    return ProductBatchModel(
      id: json['id'],
      batchNumber: json['batchNumber'],
      stock: (json['stock'] ?? 0).toDouble(),
      manufacturingDate: json['manufacturingDate'] != null
          ? DateTime.parse(json['manufacturingDate'])
          : null,
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'batchNumber': batchNumber,
      'stock': stock,
      'manufacturingDate': manufacturingDate?.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
    };
  }

  ProductBatch toEntity() {
    return ProductBatch(
      id: id,
      batchNumber: batchNumber,
      stock: stock,
      manufacturingDate: manufacturingDate,
      expiryDate: expiryDate,
    );
  }
}

@HiveType(typeId: 12)
class ProductSerialModel extends ProductSerial {
  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String serialNumber;
  @override
  @HiveField(2)
  final String status;

  const ProductSerialModel({
    required this.id,
    required this.serialNumber,
    required this.status,
  }) : super(
          id: id,
          serialNumber: serialNumber,
          status: status,
        );

  factory ProductSerialModel.fromEntity(ProductSerial serial) {
    return ProductSerialModel(
      id: serial.id,
      serialNumber: serial.serialNumber,
      status: serial.status,
    );
  }

  factory ProductSerialModel.fromJson(Map<String, dynamic> json) {
    return ProductSerialModel(
      id: json['id'],
      serialNumber: json['serialNumber'],
      status: json['status'] ?? 'AVAILABLE',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serialNumber': serialNumber,
      'status': status,
    };
  }

  ProductSerial toEntity() {
    return ProductSerial(
      id: id,
      serialNumber: serialNumber,
      status: status,
    );
  }
}

@HiveType(typeId: 0)
class ProductModel extends Product {
  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String name;
  @override
  @HiveField(2)
  final String barcode;
  @override
  @HiveField(3)
  final String productType;
  @override
  @HiveField(4)
  final String unit;
  @override
  @HiveField(5)
  final bool allowDecimal;
  @override
  @HiveField(6)
  final double mrp;
  @override
  @HiveField(7)
  final double salePrice;
  @override
  @HiveField(8)
  final double purchasePrice;
  @override
  @HiveField(9)
  final double stock;
  @override
  @HiveField(10)
  final DateTime? expiryDate;
  @override
  @HiveField(11)
  final DateTime? manufacturingDate;
  @override
  @HiveField(12)
  final String? batchNumber;
  @override
  @HiveField(13)
  final String? category;
  @override
  @HiveField(14)
  final double minStockThreshold;
  @override
  @HiveField(15)
  final List<ProductVariantModel> variants;
  @override
  @HiveField(16)
  final List<ProductBatchModel> batches;
  @override
  @HiveField(17)
  final List<ProductSerialModel> serials;

  const ProductModel({
    required this.id,
    required this.name,
    required this.barcode,
    this.productType = 'SIMPLE',
    this.unit = 'PIECE',
    this.allowDecimal = false,
    required this.mrp,
    required this.salePrice,
    this.purchasePrice = 0.0,
    required this.stock,
    this.expiryDate,
    this.manufacturingDate,
    this.batchNumber,
    this.category,
    this.minStockThreshold = 10,
    this.variants = const [],
    this.batches = const [],
    this.serials = const [],
  }) : super(
          id: id,
          name: name,
          barcode: barcode,
          productType: productType,
          unit: unit,
          allowDecimal: allowDecimal,
          mrp: mrp,
          salePrice: salePrice,
          purchasePrice: purchasePrice,
          stock: stock,
          expiryDate: expiryDate,
          manufacturingDate: manufacturingDate,
          batchNumber: batchNumber,
          category: category,
          minStockThreshold: minStockThreshold,
          variants: variants,
          batches: batches,
          serials: serials,
        );

  factory ProductModel.fromEntity(Product product) {
    return ProductModel(
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      productType: product.productType,
      unit: product.unit,
      allowDecimal: product.allowDecimal,
      mrp: product.mrp,
      salePrice: product.salePrice,
      purchasePrice: product.purchasePrice,
      stock: product.stock,
      expiryDate: product.expiryDate,
      manufacturingDate: product.manufacturingDate,
      batchNumber: product.batchNumber,
      category: product.category,
      minStockThreshold: product.minStockThreshold,
      variants: product.variants
          .map((v) => ProductVariantModel.fromEntity(v))
          .toList(),
      batches: product.batches
          .map((b) => ProductBatchModel.fromEntity(b))
          .toList(),
      serials: product.serials
          .map((s) => ProductSerialModel.fromEntity(s))
          .toList(),
    );
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'],
      name: json['name'],
      barcode: json['barcode'] ?? '',
      productType: json['productType'] ?? 'SIMPLE',
      unit: json['unit'] ?? 'PIECE',
      allowDecimal: json['allowDecimal'] ?? false,
      mrp: (json['mrp'] ?? 0.0).toDouble(),
      salePrice: (json['salePrice'] ?? json['price'] ?? 0.0).toDouble(),
      purchasePrice: (json['purchasePrice'] ?? 0.0).toDouble(),
      stock: (json['stock'] ?? 0).toDouble(),
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : null,
      manufacturingDate: json['manufacturingDate'] != null
          ? DateTime.parse(json['manufacturingDate'])
          : null,
      batchNumber: json['batchNumber'],
      category: json['category'],
      minStockThreshold: (json['minStockThreshold'] ?? 10).toDouble(),
      variants: (json['variants'] as List<dynamic>?)
              ?.map((v) => ProductVariantModel.fromJson(v))
              .toList() ??
          const [],
      batches: (json['batches'] as List<dynamic>?)
              ?.map((b) => ProductBatchModel.fromJson(b))
              .toList() ??
          const [],
      serials: (json['serials'] as List<dynamic>?)
              ?.map((s) => ProductSerialModel.fromJson(s))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'barcode': barcode,
      'productType': productType,
      'unit': unit,
      'allowDecimal': allowDecimal,
      'mrp': mrp,
      'salePrice': salePrice,
      'purchasePrice': purchasePrice,
      'stock': stock,
      'expiryDate': expiryDate?.toIso8601String(),
      'manufacturingDate': manufacturingDate?.toIso8601String(),
      'batchNumber': batchNumber,
      'category': category,
      'minStockThreshold': minStockThreshold,
      'variants': variants.map((v) => v.toJson()).toList(),
      'batches': batches.map((b) => b.toJson()).toList(),
      'serials': serials.map((s) => s.toJson()).toList(),
    };
  }

  @override
  Product toEntity() {
    return Product(
      id: id,
      name: name,
      barcode: barcode,
      productType: productType,
      unit: unit,
      allowDecimal: allowDecimal,
      mrp: mrp,
      salePrice: salePrice,
      purchasePrice: purchasePrice,
      stock: stock,
      expiryDate: expiryDate,
      manufacturingDate: manufacturingDate,
      batchNumber: batchNumber,
      category: category,
      minStockThreshold: minStockThreshold,
      variants: variants.map((v) => v.toEntity()).toList(),
      batches: batches.map((b) => b.toEntity()).toList(),
      serials: serials.map((s) => s.toEntity()).toList(),
    );
  }
}
