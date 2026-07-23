import 'package:equatable/equatable.dart';

class CartAddOnSelection extends Equatable {
  final String id;
  final String name;
  final double price;

  const CartAddOnSelection({required this.id, required this.name, required this.price});

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'price': price};

  factory CartAddOnSelection.fromJson(Map<String, dynamic> json) => CartAddOnSelection(
        id: json['id'] as String,
        name: json['name'] as String,
        price: (json['price'] as num).toDouble(),
      );

  @override
  List<Object?> get props => [id, name, price];
}

/// One line in the cart. `key` identifies a line uniquely by product+variant+add-on combination
/// so "Cold Coffee (Small)" and "Cold Coffee (Small) + Extra Shot" stack as separate lines instead
/// of merging into one with an ambiguous add-on set.
class CartItem extends Equatable {
  final String productId;
  final String? variantId;
  final String name;
  final double basePrice;
  final double? mrp;
  final int quantity;
  final String? imageUrl;
  final bool isCombo;
  final List<String> comboComponentLabels;
  final List<CartAddOnSelection> addOns;

  const CartItem({
    required this.productId,
    this.variantId,
    required this.name,
    required this.basePrice,
    this.mrp,
    required this.quantity,
    this.imageUrl,
    this.isCombo = false,
    this.comboComponentLabels = const [],
    this.addOns = const [],
  });

  String get key {
    final addOnIds = addOns.map((a) => a.id).toList()..sort();
    return '$productId::${variantId ?? ''}::${addOnIds.join(',')}';
  }

  double get unitPrice => basePrice + addOns.fold(0.0, (sum, a) => sum + a.price);
  double get lineTotal => unitPrice * quantity;

  CartItem copyWith({int? quantity}) => CartItem(
        productId: productId,
        variantId: variantId,
        name: name,
        basePrice: basePrice,
        mrp: mrp,
        quantity: quantity ?? this.quantity,
        imageUrl: imageUrl,
        isCombo: isCombo,
        comboComponentLabels: comboComponentLabels,
        addOns: addOns,
      );

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'variantId': variantId,
        'name': name,
        'basePrice': basePrice,
        'mrp': mrp,
        'quantity': quantity,
        'imageUrl': imageUrl,
        'isCombo': isCombo,
        'comboComponentLabels': comboComponentLabels,
        'addOns': addOns.map((a) => a.toJson()).toList(),
      };

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        productId: json['productId'] as String,
        variantId: json['variantId'] as String?,
        name: json['name'] as String,
        basePrice: (json['basePrice'] as num).toDouble(),
        mrp: (json['mrp'] as num?)?.toDouble(),
        quantity: json['quantity'] as int,
        imageUrl: json['imageUrl'] as String?,
        isCombo: json['isCombo'] as bool? ?? false,
        comboComponentLabels: ((json['comboComponentLabels'] as List<dynamic>?) ?? []).cast<String>(),
        addOns: ((json['addOns'] as List<dynamic>?) ?? []).map((a) => CartAddOnSelection.fromJson(a as Map<String, dynamic>)).toList(),
      );

  /// Shape POST /customer/orders expects for one cart line.
  Map<String, dynamic> toOrderItemJson() => {
        'productId': productId,
        if (variantId != null) 'variantId': variantId,
        'quantity': quantity,
        if (addOns.isNotEmpty) 'addOnIds': addOns.map((a) => a.id).toList(),
      };

  @override
  List<Object?> get props => [productId, variantId, name, basePrice, mrp, quantity, imageUrl, isCombo, comboComponentLabels, addOns];
}
