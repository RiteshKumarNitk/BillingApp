import '../../domain/entities/refund.dart';

abstract class RefundRepository {
  Future<void> createRefund(Refund refund);
  Future<List<Refund>> getAllRefunds();
  Future<Refund?> getRefundById(String id);
  Future<List<Refund>> getRefundsByTransactionId(String transactionId);
  Future<void> deleteRefund(String id);
  Future<double> getTotalRefundsForDate(DateTime date);
}
