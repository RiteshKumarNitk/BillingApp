import 'package:hive/hive.dart';
import '../../domain/entities/customer.dart';

part 'customer_model.g.dart';

@HiveType(typeId: 6)
class CustomerModel extends Customer {
  @override
  @HiveField(0)
  final String id;

  @override
  @HiveField(1)
  final String name;

  @override
  @HiveField(2)
  final String phone;

  @override
  @HiveField(3)
  final String email;

  @override
  @HiveField(4)
  final double loyaltyPoints;

  @override
  @HiveField(5)
  final DateTime createdDate;

  @override
  @HiveField(6)
  final DateTime lastPurchaseDate;

  @override
  @HiveField(7)
  final double totalSpent;

  const CustomerModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    this.loyaltyPoints = 0,
    required this.createdDate,
    required this.lastPurchaseDate,
    this.totalSpent = 0,
  }) : super(
    id: id,
    name: name,
    phone: phone,
    email: email,
    loyaltyPoints: loyaltyPoints,
    createdDate: createdDate,
    lastPurchaseDate: lastPurchaseDate,
    totalSpent: totalSpent,
  );

  factory CustomerModel.fromEntity(Customer customer) {
    return CustomerModel(
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      loyaltyPoints: customer.loyaltyPoints,
      createdDate: customer.createdDate,
      lastPurchaseDate: customer.lastPurchaseDate,
      totalSpent: customer.totalSpent,
    );
  }

  Customer toEntity() {
    return Customer(
      id: id,
      name: name,
      phone: phone,
      email: email,
      loyaltyPoints: loyaltyPoints,
      createdDate: createdDate,
      lastPurchaseDate: lastPurchaseDate,
      totalSpent: totalSpent,
    );
  }
}
