import '../../../../core/data/hive_database.dart';
import '../../domain/entities/refund.dart';
import '../../domain/repositories/refund_repository.dart';
import '../models/refund_model.dart';

class RefundRepositoryImpl implements RefundRepository {
  @override
  Future<void> createRefund(Refund refund) async {
    final model = RefundModel.fromEntity(refund);
    await HiveDatabase.refundBox.put(refund.id, model);
  }

  @override
  Future<List<Refund>> getAllRefunds() async {
    final models = HiveDatabase.refundBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<Refund?> getRefundById(String id) async {
    final model = HiveDatabase.refundBox.get(id);
    return model?.toEntity();
  }

  @override
  Future<List<Refund>> getRefundsByTransactionId(String transactionId) async {
    final allRefunds = await getAllRefunds();
    return allRefunds
        .where((refund) => refund.transactionId == transactionId)
        .toList();
  }

  @override
  Future<void> deleteRefund(String id) async {
    await HiveDatabase.refundBox.delete(id);
  }

  @override
  Future<double> getTotalRefundsForDate(DateTime date) async {
    final allRefunds = await getAllRefunds();
    double total = 0;
    for (var refund in allRefunds) {
      if (refund.refundDate.year == date.year &&
          refund.refundDate.month == date.month &&
          refund.refundDate.day == date.day) {
        total += refund.refundAmount;
      }
    }
    return total;
  }
}
