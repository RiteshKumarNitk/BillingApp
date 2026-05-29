// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TransactionItemModelAdapter extends TypeAdapter<TransactionItemModel> {
  @override
  final int typeId = 2;

  @override
  TransactionItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TransactionItemModel(
      productId: fields[0] as String,
      productName: fields[1] as String,
      price: fields[2] as double,
      quantity: fields[3] as double,
      total: fields[4] as double,
    );
  }

  @override
  void write(BinaryWriter writer, TransactionItemModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.productId)
      ..writeByte(1)
      ..write(obj.productName)
      ..writeByte(2)
      ..write(obj.price)
      ..writeByte(3)
      ..write(obj.quantity)
      ..writeByte(4)
      ..write(obj.total);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TransactionItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class TransactionModelAdapter extends TypeAdapter<TransactionModel> {
  @override
  final int typeId = 3;

  @override
  TransactionModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TransactionModel(
      id: fields[0] as String,
      timestamp: fields[1] as DateTime,
      items: (fields[2] as List).cast<TransactionItemModel>(),
      subtotal: fields[3] as double,
      taxAmount: fields[4] as double,
      totalAmount: fields[5] as double,
      paymentMethod: fields[6] as String,
      isRefunded: fields[7] as bool,
      refundId: fields[8] as String?,
      notes: fields[9] as String?,
      discountAmount: fields[10] as double,
      amountReceived: fields[11] as double,
      changeAmount: fields[12] as double,
      customerId: fields[13] as String?,
      customerName: fields[14] as String?,
      customerPhone: fields[15] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, TransactionModel obj) {
    writer
      ..writeByte(16)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.timestamp)
      ..writeByte(2)
      ..write(obj.items)
      ..writeByte(3)
      ..write(obj.subtotal)
      ..writeByte(4)
      ..write(obj.taxAmount)
      ..writeByte(5)
      ..write(obj.totalAmount)
      ..writeByte(6)
      ..write(obj.paymentMethod)
      ..writeByte(7)
      ..write(obj.isRefunded)
      ..writeByte(8)
      ..write(obj.refundId)
      ..writeByte(9)
      ..write(obj.notes)
      ..writeByte(10)
      ..write(obj.discountAmount)
      ..writeByte(11)
      ..write(obj.amountReceived)
      ..writeByte(12)
      ..write(obj.changeAmount)
      ..writeByte(13)
      ..write(obj.customerId)
      ..writeByte(14)
      ..write(obj.customerName)
      ..writeByte(15)
      ..write(obj.customerPhone);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TransactionModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
