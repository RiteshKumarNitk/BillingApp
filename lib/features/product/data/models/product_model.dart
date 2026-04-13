import 'package:hive/hive.dart';
import '../../domain/entities/product.dart';

part 'product_model.g.dart'; // Hive generator

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
  final double price;
  @override
  @HiveField(4)
  final int stock;
  @override
  @HiveField(5)
  final DateTime? expiryDate;
  @override
  @HiveField(6)
  final DateTime? manufacturingDate;
  @override
  @HiveField(7)
  final String? batchNumber;
  @override
  @HiveField(8)
  final String? category;
  @override
  @HiveField(9)
  final int minStockThreshold;

  const ProductModel({
    required this.id,
    required this.name,
    required this.barcode,
    required this.price,
    required this.stock,
    this.expiryDate,
    this.manufacturingDate,
    this.batchNumber,
    this.category,
    this.minStockThreshold = 10,
  }) : super(
    id: id,
    name: name,
    barcode: barcode,
    price: price,
    stock: stock,
    expiryDate: expiryDate,
    manufacturingDate: manufacturingDate,
    batchNumber: batchNumber,
    category: category,
    minStockThreshold: minStockThreshold,
  );

  factory ProductModel.fromEntity(Product product) {
    return ProductModel(
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      expiryDate: product.expiryDate,
      manufacturingDate: product.manufacturingDate,
      batchNumber: product.batchNumber,
      category: product.category,
      minStockThreshold: product.minStockThreshold,
    );
  }

  Product toEntity() {
    return Product(
      id: id,
      name: name,
      barcode: barcode,
      price: price,
      stock: stock,
      expiryDate: expiryDate,
      manufacturingDate: manufacturingDate,
      batchNumber: batchNumber,
      category: category,
      minStockThreshold: minStockThreshold,
    );
  }
}
