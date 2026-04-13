// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'refund_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class RefundItemModelAdapter extends TypeAdapter<RefundItemModel> {
  @override
  final int typeId = 4;

  @override
  RefundItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return RefundItemModel(
      productId: fields[0] as String,
      productName: fields[1] as String,
      quantity: fields[2] as int,
      pricePerUnit: fields[3] as double,
      totalAmount: fields[4] as double,
    );
  }

  @override
  void write(BinaryWriter writer, RefundItemModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.productId)
      ..writeByte(1)
      ..write(obj.productName)
      ..writeByte(2)
      ..write(obj.quantity)
      ..writeByte(3)
      ..write(obj.pricePerUnit)
      ..writeByte(4)
      ..write(obj.totalAmount);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RefundItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class RefundModelAdapter extends TypeAdapter<RefundModel> {
  @override
  final int typeId = 5;

  @override
  RefundModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return RefundModel(
      id: fields[0] as String,
      transactionId: fields[1] as String,
      refundDate: fields[2] as DateTime,
      refundAmount: fields[3] as double,
      reason: fields[4] as String,
      restockItems: fields[5] as bool,
      items: (fields[6] as List).cast<RefundItemModel>(),
      approvedBy: fields[8] as String,
      notes: fields[7] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, RefundModel obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.transactionId)
      ..writeByte(2)
      ..write(obj.refundDate)
      ..writeByte(3)
      ..write(obj.refundAmount)
      ..writeByte(4)
      ..write(obj.reason)
      ..writeByte(5)
      ..write(obj.restockItems)
      ..writeByte(6)
      ..write(obj.items)
      ..writeByte(7)
      ..write(obj.notes)
      ..writeByte(8)
      ..write(obj.approvedBy);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RefundModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
