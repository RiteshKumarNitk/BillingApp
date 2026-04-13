import 'package:hive/hive.dart';
import '../../domain/entities/expiry_alert.dart';

part 'expiry_alert_model.g.dart';

@HiveType(typeId: 9)
class ExpiryAlertModel extends ExpiryAlert {
  @override
  @HiveField(0)
  final String id;

  @override
  @HiveField(1)
  final String productId;

  @override
  @HiveField(2)
  final String productName;

  @override
  @HiveField(3)
  final DateTime expiryDate;

  @override
  @HiveField(4)
  final int daysUntilExpiry;

  @override
  @HiveField(5)
  final int stockCount;

  @override
  @HiveField(6)
  final bool isAlertSent;

  @override
  @HiveField(7)
  final DateTime createdDate;

  const ExpiryAlertModel({
    required this.id,
    required this.productId,
    required this.productName,
    required this.expiryDate,
    required this.daysUntilExpiry,
    required this.stockCount,
    this.isAlertSent = false,
    required this.createdDate,
  }) : super(
    id: id,
    productId: productId,
    productName: productName,
    expiryDate: expiryDate,
    daysUntilExpiry: daysUntilExpiry,
    stockCount: stockCount,
    isAlertSent: isAlertSent,
    createdDate: createdDate,
  );

  factory ExpiryAlertModel.fromEntity(ExpiryAlert alert) {
    return ExpiryAlertModel(
      id: alert.id,
      productId: alert.productId,
      productName: alert.productName,
      expiryDate: alert.expiryDate,
      daysUntilExpiry: alert.daysUntilExpiry,
      stockCount: alert.stockCount,
      isAlertSent: alert.isAlertSent,
      createdDate: alert.createdDate,
    );
  }

  ExpiryAlert toEntity() {
    return ExpiryAlert(
      id: id,
      productId: productId,
      productName: productName,
      expiryDate: expiryDate,
      daysUntilExpiry: daysUntilExpiry,
      stockCount: stockCount,
      isAlertSent: isAlertSent,
      createdDate: createdDate,
    );
  }
}
