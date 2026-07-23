import 'package:equatable/equatable.dart';

class PlacedOrder extends Equatable {
  final String id;
  final double totalAmount;
  final double discountAmount;
  final String? discountLabel;
  final double taxAmount;
  final double netAmount;
  final String? orderType;

  const PlacedOrder({
    required this.id,
    required this.totalAmount,
    required this.discountAmount,
    this.discountLabel,
    required this.taxAmount,
    required this.netAmount,
    this.orderType,
  });

  @override
  List<Object?> get props => [id, totalAmount, discountAmount, discountLabel, taxAmount, netAmount, orderType];
}
