import '../../domain/entities/transaction.dart';

abstract class TransactionRepository {
  Future<void> saveTransaction(Transaction transaction);
  Future<List<Transaction>> getAllTransactions();
  Future<Transaction?> getTransactionById(String id);
  Future<List<Transaction>> getTransactionsByDate(DateTime date);
  Future<void> refundTransaction(String transactionId);
  Future<void> deleteTransaction(String id);
  Future<double> getDailySales(DateTime date);
}
