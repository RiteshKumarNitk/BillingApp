import 'package:equatable/equatable.dart';

class OrderComboComponent extends Equatable {
  final String name;
  final String? variantName;
  final int quantity;

  const OrderComboComponent({required this.name, this.variantName, required this.quantity});

  @override
  List<Object?> get props => [name, variantName, quantity];
}

class OrderItem extends Equatable {
  final String id;
  final String productId;
  final String name;
  final double salePrice;
  final double quantity;
  final double itemTotal;
  final List<OrderComboComponent> comboComponents;

  const OrderItem({
    required this.id,
    required this.productId,
    required this.name,
    required this.salePrice,
    required this.quantity,
    required this.itemTotal,
    this.comboComponents = const [],
  });

  @override
  List<Object?> get props => [id, productId, name, salePrice, quantity, itemTotal, comboComponents];
}

/// PENDING is the only status every order starts in; ACCEPTED/PREPARING/READY are reserved for
/// the Cafe Dashboard + Kitchen Queue phases (see billing-web's OrderRequest.status comment) —
/// this app already renders them if a cafe adopts them, it just never writes them itself.
enum OrderStatus { pending, accepted, preparing, ready, completed, rejected, cancelled, unknown }

OrderStatus orderStatusFromString(String value) {
  switch (value) {
    case 'PENDING':
      return OrderStatus.pending;
    case 'ACCEPTED':
      return OrderStatus.accepted;
    case 'PREPARING':
      return OrderStatus.preparing;
    case 'READY':
      return OrderStatus.ready;
    case 'COMPLETED':
      return OrderStatus.completed;
    case 'REJECTED':
      return OrderStatus.rejected;
    case 'CANCELLED':
      return OrderStatus.cancelled;
    default:
      return OrderStatus.unknown;
  }
}

class Order extends Equatable {
  final String id;
  final OrderStatus status;
  final String? notes;
  final double totalAmount;
  final double taxAmount;
  final double netAmount;
  final double discountAmount;
  final String? discountLabel;
  final String? orderType;
  final String? tableLabel;
  final String tenantId;
  final String tenantName;
  final String? tenantLogoUrl;
  final DateTime createdAt;
  final List<OrderItem> items;

  const Order({
    required this.id,
    required this.status,
    this.notes,
    required this.totalAmount,
    required this.taxAmount,
    required this.netAmount,
    this.discountAmount = 0,
    this.discountLabel,
    this.orderType,
    this.tableLabel,
    required this.tenantId,
    required this.tenantName,
    this.tenantLogoUrl,
    required this.createdAt,
    this.items = const [],
  });

  @override
  List<Object?> get props => [id, status, notes, totalAmount, taxAmount, netAmount, discountAmount, discountLabel, orderType, tableLabel, tenantId, tenantName, tenantLogoUrl, createdAt, items];
}
