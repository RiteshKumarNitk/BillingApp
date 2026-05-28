import 'package:flutter/foundation.dart';
import '../../../../core/data/hive_database.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/transaction.dart';
import '../../domain/repositories/transaction_repository.dart';
import '../models/transaction_model.dart';

class TransactionRepositoryImpl implements TransactionRepository {
  final ApiClient _apiClient;

  TransactionRepositoryImpl(this._apiClient);

  @override
  Future<void> saveTransaction(Transaction transaction) async {
    final model = TransactionModel.fromEntity(transaction);
    await HiveDatabase.transactionBox.put(transaction.id, model);
    try {
      await _apiClient.createTransaction({
        'items': transaction.items
            .map((item) => {
                  'productId': item.productId,
                  'name': item.productName,
                  'salePrice': item.price,
                  'quantity': item.quantity,
                })
            .toList(),
        'discount': transaction.discountAmount,
        'taxAmount': transaction.taxAmount,
        'paymentMethod': transaction.paymentMethod,
        'amountReceived': transaction.amountReceived,
        'changeAmount': transaction.changeAmount,
        'customerId': transaction.customerId,
        'customerName': transaction.customerName,
        'customerPhone': transaction.customerPhone,
        'notes': transaction.notes,
      });
    } catch (e) {
      debugPrint('Failed to sync transaction to API: $e');
    }
  }

  @override
  Future<List<Transaction>> getAllTransactions() async {
    try {
      final response = await _apiClient.getTransactions();
      if (response['transactions'] != null) {
        final List<dynamic> jsonList = response['transactions'];
        final transactions = jsonList.map((json) => _transactionFromJson(json)).toList();
        await HiveDatabase.transactionBox.clear();
        for (var t in transactions) {
          await HiveDatabase.transactionBox.put(t.id, TransactionModel.fromEntity(t));
        }
        return transactions;
      }
    } catch (e) {
      debugPrint('API fetch failed, falling back to local: $e');
    }
    final models = HiveDatabase.transactionBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<Transaction?> getTransactionById(String id) async {
    final model = HiveDatabase.transactionBox.get(id);
    return model?.toEntity();
  }

  @override
  Future<List<Transaction>> getTransactionsByDate(DateTime date) async {
    final allTransactions = await getAllTransactions();
    return allTransactions.where((t) {
      return t.timestamp.year == date.year &&
          t.timestamp.month == date.month &&
          t.timestamp.day == date.day;
    }).toList();
  }

  @override
  Future<void> refundTransaction(String transactionId) async {
    final model = HiveDatabase.transactionBox.get(transactionId);
    if (model != null) {
      final refundedModel = TransactionModel(
        id: model.id,
        timestamp: model.timestamp,
        items: model.items,
        subtotal: model.subtotal,
        discountAmount: model.discountAmount,
        taxAmount: model.taxAmount,
        totalAmount: model.totalAmount,
        paymentMethod: model.paymentMethod,
        amountReceived: model.amountReceived,
        changeAmount: model.changeAmount,
        customerId: model.customerId,
        customerName: model.customerName,
        customerPhone: model.customerPhone,
        isRefunded: true,
        refundId: 'REFUND-${DateTime.now().millisecondsSinceEpoch}',
        notes: model.notes,
      );
      await HiveDatabase.transactionBox.put(transactionId, refundedModel);
    }
  }

  @override
  Future<void> deleteTransaction(String id) async {
    await HiveDatabase.transactionBox.delete(id);
  }

  @override
  Future<double> getDailySales(DateTime date) async {
    final transactions = await getTransactionsByDate(date);
    double total = 0;
    for (var transaction in transactions) {
      if (!transaction.isRefunded) {
        total += transaction.totalAmount;
      }
    }
    return total;
  }

  Transaction _transactionFromJson(Map<String, dynamic> json) {
    final itemsList = (json['items'] as List<dynamic>?) ?? [];
    final items = itemsList.map((item) => TransactionItem(
      productId: item['productId'] ?? '',
      productName: item['name'] ?? '',
      price: (item['salePrice'] ?? 0).toDouble(),
      quantity: item['quantity'] ?? 0,
      total: (item['itemTotal'] ?? 0).toDouble(),
    )).toList();

    final subtotal = (json['totalAmount'] ?? 0).toDouble();
    final discountAmount = (json['discount'] ?? 0).toDouble();
    final taxAmount = (json['taxAmount'] ?? 0).toDouble();
    final netAmount = (json['netAmount'] ?? subtotal).toDouble();

    return Transaction(
      id: json['id'],
      timestamp: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      items: items,
      subtotal: subtotal,
      discountAmount: discountAmount,
      taxAmount: taxAmount,
      totalAmount: netAmount,
      paymentMethod: json['paymentMethod'] ?? 'CASH',
      amountReceived: (json['amountReceived'] ?? 0).toDouble(),
      changeAmount: (json['changeAmount'] ?? 0).toDouble(),
      customerId: json['customerId'],
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      notes: json['notes'],
    );
  }
}
