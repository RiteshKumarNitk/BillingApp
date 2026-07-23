import '../../domain/entities/menu_item.dart';

class MenuItemModel extends MenuItem {
  const MenuItemModel({
    required super.id,
    required super.name,
    super.description,
    required super.salePrice,
    required super.mrp,
    required super.stock,
    super.imageUrl,
    required super.category,
    required super.productType,
    super.barcode,
    super.variants,
    super.addOns,
    super.comboComponents,
    super.activeDiscount,
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    return MenuItemModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      salePrice: (json['salePrice'] as num?)?.toDouble() ?? 0,
      mrp: (json['mrp'] as num?)?.toDouble() ?? 0,
      stock: (json['stock'] as num?)?.toDouble() ?? 0,
      imageUrl: json['imageUrl'] as String?,
      category: json['category'] as String? ?? 'Other',
      productType: json['productType'] as String? ?? 'SIMPLE',
      barcode: json['barcode'] as String?,
      variants: ((json['variants'] as List<dynamic>?) ?? [])
          .map((v) => MenuVariant(
                id: v['id'] as String,
                name: v['name'] as String,
                salePrice: (v['salePrice'] as num?)?.toDouble() ?? 0,
                stock: (v['stock'] as num?)?.toDouble() ?? 0,
                barcode: v['barcode'] as String?,
              ))
          .toList(),
      addOns: ((json['addOns'] as List<dynamic>?) ?? [])
          .map((a) => MenuAddOn(id: a['id'] as String, name: a['name'] as String, price: (a['price'] as num?)?.toDouble() ?? 0))
          .toList(),
      comboComponents: ((json['comboComponents'] as List<dynamic>?) ?? [])
          .map((c) => MenuComboComponent(
                name: c['name'] as String,
                variantName: c['variantName'] as String?,
                quantity: (c['quantity'] as num?)?.toInt() ?? 1,
              ))
          .toList(),
      activeDiscount: json['activeDiscount'] != null
          ? MenuDiscount(
              id: json['activeDiscount']['id'] as String,
              name: json['activeDiscount']['name'] as String,
              discountPercentage: (json['activeDiscount']['discountPercentage'] as num?)?.toDouble() ?? 0,
              minimumQuantity: (json['activeDiscount']['minimumQuantity'] as num?)?.toInt() ?? 1,
            )
          : null,
    );
  }
}

class MenuCategoryModel extends MenuCategory {
  const MenuCategoryModel({required super.category, required super.items});

  factory MenuCategoryModel.fromJson(Map<String, dynamic> json) {
    return MenuCategoryModel(
      category: json['category'] as String,
      items: ((json['items'] as List<dynamic>?) ?? []).map((i) => MenuItemModel.fromJson(i as Map<String, dynamic>)).toList(),
    );
  }
}
