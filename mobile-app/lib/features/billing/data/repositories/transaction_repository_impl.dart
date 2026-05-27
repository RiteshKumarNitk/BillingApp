import '../../../../core/data/hive_database.dart';
import '../../domain/entities/transaction.dart';
import '../../domain/repositories/transaction_repository.dart';
import '../models/transaction_model.dart';

class TransactionRepositoryImpl implements TransactionRepository {
  @override
  Future<void> saveTransaction(Transaction transaction) async {
    final model = TransactionModel.fromEntity(transaction);
    await HiveDatabase.transactionBox.put(transaction.id, model);
  }

  @override
  Future<List<Transaction>> getAllTransactions() async {
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
        taxAmount: model.taxAmount,
        totalAmount: model.totalAmount,
        paymentMethod: model.paymentMethod,
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
}
