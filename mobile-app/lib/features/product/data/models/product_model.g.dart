// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ProductVariantModelAdapter extends TypeAdapter<ProductVariantModel> {
  @override
  final int typeId = 10;

  @override
  ProductVariantModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ProductVariantModel(
      id: fields[0] as String,
      name: fields[1] as String,
      barcode: fields[2] as String?,
      mrp: fields[3] as double,
      salePrice: fields[4] as double,
      purchasePrice: fields[5] as double,
      stock: fields[6] as double,
    );
  }

  @override
  void write(BinaryWriter writer, ProductVariantModel obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.barcode)
      ..writeByte(3)
      ..write(obj.mrp)
      ..writeByte(4)
      ..write(obj.salePrice)
      ..writeByte(5)
      ..write(obj.purchasePrice)
      ..writeByte(6)
      ..write(obj.stock);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductVariantModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ProductBatchModelAdapter extends TypeAdapter<ProductBatchModel> {
  @override
  final int typeId = 11;

  @override
  ProductBatchModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ProductBatchModel(
      id: fields[0] as String,
      batchNumber: fields[1] as String,
      stock: fields[2] as double,
      manufacturingDate: fields[3] as DateTime?,
      expiryDate: fields[4] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, ProductBatchModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.batchNumber)
      ..writeByte(2)
      ..write(obj.stock)
      ..writeByte(3)
      ..write(obj.manufacturingDate)
      ..writeByte(4)
      ..write(obj.expiryDate);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductBatchModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ProductSerialModelAdapter extends TypeAdapter<ProductSerialModel> {
  @override
  final int typeId = 12;

  @override
  ProductSerialModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ProductSerialModel(
      id: fields[0] as String,
      serialNumber: fields[1] as String,
      status: fields[2] as String,
    );
  }

  @override
  void write(BinaryWriter writer, ProductSerialModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.serialNumber)
      ..writeByte(2)
      ..write(obj.status);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductSerialModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ProductModelAdapter extends TypeAdapter<ProductModel> {
  @override
  final int typeId = 0;

  @override
  ProductModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ProductModel(
      id: fields[0] as String,
      name: fields[1] as String,
      barcode: fields[2] as String,
      productType: fields[3] as String,
      unit: fields[4] as String,
      allowDecimal: fields[5] as bool,
      mrp: fields[6] as double,
      salePrice: fields[7] as double,
      purchasePrice: fields[8] as double,
      stock: fields[9] as double,
      expiryDate: fields[10] as DateTime?,
      manufacturingDate: fields[11] as DateTime?,
      batchNumber: fields[12] as String?,
      category: fields[13] as String?,
      minStockThreshold: fields[14] as double,
      variants: (fields[15] as List).cast<ProductVariantModel>(),
      batches: (fields[16] as List).cast<ProductBatchModel>(),
      serials: (fields[17] as List).cast<ProductSerialModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, ProductModel obj) {
    writer
      ..writeByte(18)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.barcode)
      ..writeByte(3)
      ..write(obj.productType)
      ..writeByte(4)
      ..write(obj.unit)
      ..writeByte(5)
      ..write(obj.allowDecimal)
      ..writeByte(6)
      ..write(obj.mrp)
      ..writeByte(7)
      ..write(obj.salePrice)
      ..writeByte(8)
      ..write(obj.purchasePrice)
      ..writeByte(9)
      ..write(obj.stock)
      ..writeByte(10)
      ..write(obj.expiryDate)
      ..writeByte(11)
      ..write(obj.manufacturingDate)
      ..writeByte(12)
      ..write(obj.batchNumber)
      ..writeByte(13)
      ..write(obj.category)
      ..writeByte(14)
      ..write(obj.minStockThreshold)
      ..writeByte(15)
      ..write(obj.variants)
      ..writeByte(16)
      ..write(obj.batches)
      ..writeByte(17)
      ..write(obj.serials);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
