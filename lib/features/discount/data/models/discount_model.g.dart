// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'discount_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class DiscountModelAdapter extends TypeAdapter<DiscountModel> {
  @override
  final int typeId = 8;

  @override
  DiscountModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DiscountModel(
      id: fields[0] as String,
      name: fields[1] as String,
      description: fields[2] as String,
      discountPercentage: fields[3] as double,
      applicableCategory: fields[4] as String?,
      minimumQuantity: fields[5] as int?,
      startDate: fields[6] as DateTime,
      endDate: fields[7] as DateTime,
      isActive: fields[8] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, DiscountModel obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.description)
      ..writeByte(3)
      ..write(obj.discountPercentage)
      ..writeByte(4)
      ..write(obj.applicableCategory)
      ..writeByte(5)
      ..write(obj.minimumQuantity)
      ..writeByte(6)
      ..write(obj.startDate)
      ..writeByte(7)
      ..write(obj.endDate)
      ..writeByte(8)
      ..write(obj.isActive);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DiscountModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
