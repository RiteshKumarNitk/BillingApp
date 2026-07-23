import 'package:equatable/equatable.dart';

class MenuVariant extends Equatable {
  final String id;
  final String name;
  final double salePrice;
  final double stock;
  final String? barcode;

  const MenuVariant({required this.id, required this.name, required this.salePrice, required this.stock, this.barcode});

  @override
  List<Object?> get props => [id, name, salePrice, stock, barcode];
}

class MenuAddOn extends Equatable {
  final String id;
  final String name;
  final double price;

  const MenuAddOn({required this.id, required this.name, required this.price});

  @override
  List<Object?> get props => [id, name, price];
}

class MenuComboComponent extends Equatable {
  final String name;
  final String? variantName;
  final int quantity;

  const MenuComboComponent({required this.name, this.variantName, required this.quantity});

  @override
  List<Object?> get props => [name, variantName, quantity];
}

class MenuDiscount extends Equatable {
  final String id;
  final String name;
  final double discountPercentage;
  final int minimumQuantity;

  const MenuDiscount({required this.id, required this.name, required this.discountPercentage, required this.minimumQuantity});

  @override
  List<Object?> get props => [id, name, discountPercentage, minimumQuantity];
}

class MenuItem extends Equatable {
  final String id;
  final String name;
  final String? description;
  final double salePrice;
  final double mrp;
  final double stock;
  final String? imageUrl;
  final String category;
  final String productType; // SIMPLE | VARIANT | COMBO
  final String? barcode;
  final String? foodType; // VEG | NON_VEG | VEGAN | JAIN
  final bool isFeatured;
  final List<MenuVariant> variants;
  final List<MenuAddOn> addOns;
  final List<MenuComboComponent> comboComponents;
  final MenuDiscount? activeDiscount;

  const MenuItem({
    required this.id,
    required this.name,
    this.description,
    required this.salePrice,
    required this.mrp,
    required this.stock,
    this.imageUrl,
    required this.category,
    required this.productType,
    this.barcode,
    this.foodType,
    this.isFeatured = false,
    this.variants = const [],
    this.addOns = const [],
    this.comboComponents = const [],
    this.activeDiscount,
  });

  bool get isCombo => productType == 'COMBO';
  bool get hasVariants => variants.isNotEmpty;
  bool get hasCustomization => hasVariants || addOns.isNotEmpty;
  bool get isOutOfStock => productType != 'COMBO' && !hasVariants && stock <= 0;
  bool get isVeg => foodType == 'VEG' || foodType == 'VEGAN' || foodType == 'JAIN';
  bool get isNonVeg => foodType == 'NON_VEG';

  @override
  List<Object?> get props => [
        id, name, description, salePrice, mrp, stock, imageUrl, category, productType, barcode,
        foodType, isFeatured, variants, addOns, comboComponents, activeDiscount,
      ];
}

class MenuCategory extends Equatable {
  final String category;
  final List<MenuItem> items;

  const MenuCategory({required this.category, required this.items});

  @override
  List<Object?> get props => [category, items];
}
