class StoreMenuItem {
  final String id;
  final String name;
  final String? description;
  final double salePrice;
  final double mrp;
  final int stock;
  final String? imageUrl;
  final String? category;
  final String? productType;
  final String? barcode;
  final List<StoreMenuVariant> variants;

  StoreMenuItem({
    required this.id,
    required this.name,
    this.description,
    required this.salePrice,
    required this.mrp,
    required this.stock,
    this.imageUrl,
    this.category,
    this.productType,
    this.barcode,
    required this.variants,
  });

  factory StoreMenuItem.fromJson(Map<String, dynamic> json) {
    return StoreMenuItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      salePrice: (json['salePrice'] ?? 0).toDouble(),
      mrp: (json['mrp'] ?? 0).toDouble(),
      stock: json['stock'] ?? 0,
      imageUrl: json['imageUrl'],
      category: json['category'],
      productType: json['productType'],
      barcode: json['barcode'],
      variants: (json['variants'] as List<dynamic>? ?? [])
          .map((v) => StoreMenuVariant.fromJson(v))
          .toList(),
    );
  }

  bool get isOutOfStock => stock <= 0 && productType != 'VARIANT' && productType != 'SERVICE';
  bool get hasVariants => variants.isNotEmpty;
}

class StoreMenuVariant {
  final String id;
  final String name;
  final double salePrice;
  final int stock;
  final String? barcode;

  StoreMenuVariant({
    required this.id,
    required this.name,
    required this.salePrice,
    required this.stock,
    this.barcode,
  });

  factory StoreMenuVariant.fromJson(Map<String, dynamic> json) {
    return StoreMenuVariant(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      salePrice: (json['salePrice'] ?? 0).toDouble(),
      stock: json['stock'] ?? 0,
      barcode: json['barcode'],
    );
  }
}

class StoreCategory {
  final String category;
  final List<StoreMenuItem> items;

  StoreCategory({required this.category, required this.items});

  factory StoreCategory.fromJson(Map<String, dynamic> json) {
    return StoreCategory(
      category: json['category'] ?? '',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((item) => StoreMenuItem.fromJson(item))
          .toList(),
    );
  }
}

class StoreMenuData {
  final StoreInfo store;
  final List<StoreCategory> categories;

  StoreMenuData({required this.store, required this.categories});

  factory StoreMenuData.fromJson(Map<String, dynamic> json) {
    return StoreMenuData(
      store: StoreInfo.fromJson(json['tenant'] ?? {}),
      categories: (json['categorizedProducts'] as List<dynamic>? ?? [])
          .map((cat) => StoreCategory.fromJson(cat))
          .toList(),
    );
  }
}

class StoreInfo {
  final String id;
  final String name;
  final String? address;
  final String? phone;

  StoreInfo({required this.id, required this.name, this.address, this.phone});

  factory StoreInfo.fromJson(Map<String, dynamic> json) {
    return StoreInfo(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'],
      phone: json['phone'],
    );
  }
}
