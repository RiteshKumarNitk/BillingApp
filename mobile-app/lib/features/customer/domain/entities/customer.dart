import 'package:equatable/equatable.dart';

class Customer extends Equatable {
  final String id;
  final String name;
  final String phone;
  final String email;
  final double loyaltyPoints;
  final DateTime createdDate;
  final DateTime lastPurchaseDate;
  final double totalSpent;

  const Customer({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    this.loyaltyPoints = 0,
    required this.createdDate,
    required this.lastPurchaseDate,
    this.totalSpent = 0,
  });

  @override
  List<Object?> get props => [
    id,
    name,
    phone,
    email,
    loyaltyPoints,
    createdDate,
    lastPurchaseDate,
    totalSpent,
  ];
}
