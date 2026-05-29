import 'package:equatable/equatable.dart';
import 'package:billing_app/features/product/domain/entities/product.dart';

class CartItem extends Equatable {
  final Product product;
  final String? variantId;
  final String? variantName;
  final double unitPrice;
  final int quantity; // Can be decimal if weight-based, but kept as int for simplicity or we should change to double?
  
  // Wait, if it's weight based it needs a double quantity. Let's make quantity a double.
  final double weightQuantity;

  const CartItem({
    required this.product,
    this.variantId,
    this.variantName,
    required this.unitPrice,
    this.quantity = 1,
    this.weightQuantity = 1.0,
  });

  double get total => unitPrice * (product.productType == 'WEIGHT' ? weightQuantity : quantity);

  CartItem copyWith({
    Product? product,
    String? variantId,
    String? variantName,
    double? unitPrice,
    int? quantity,
    double? weightQuantity,
  }) {
    return CartItem(
      product: product ?? this.product,
      variantId: variantId ?? this.variantId,
      variantName: variantName ?? this.variantName,
      unitPrice: unitPrice ?? this.unitPrice,
      quantity: quantity ?? this.quantity,
      weightQuantity: weightQuantity ?? this.weightQuantity,
    );
  }

  @override
  List<Object?> get props => [product, variantId, variantName, unitPrice, quantity, weightQuantity];
}
