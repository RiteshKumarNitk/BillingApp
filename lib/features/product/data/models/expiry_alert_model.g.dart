// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'expiry_alert_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ExpiryAlertModelAdapter extends TypeAdapter<ExpiryAlertModel> {
  @override
  final int typeId = 9;

  @override
  ExpiryAlertModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ExpiryAlertModel(
      id: fields[0] as String,
      productId: fields[1] as String,
      productName: fields[2] as String,
      expiryDate: fields[3] as DateTime,
      daysUntilExpiry: fields[4] as int,
      stockCount: fields[5] as int,
      isAlertSent: fields[6] as bool,
      createdDate: fields[7] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, ExpiryAlertModel obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.productId)
      ..writeByte(2)
      ..write(obj.productName)
      ..writeByte(3)
      ..write(obj.expiryDate)
      ..writeByte(4)
      ..write(obj.daysUntilExpiry)
      ..writeByte(5)
      ..write(obj.stockCount)
      ..writeByte(6)
      ..write(obj.isAlertSent)
      ..writeByte(7)
      ..write(obj.createdDate);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ExpiryAlertModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
