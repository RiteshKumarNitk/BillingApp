import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/entities/expiry_alert.dart';
import '../../domain/repositories/expiry_alert_repository.dart';
import '../models/expiry_alert_model.dart';

class ExpiryAlertRepositoryImpl extends IExpiryAlertRepository {
  static const String boxName = 'expiry_alerts';
  final Box<ExpiryAlertModel> _alertBox;

  ExpiryAlertRepositoryImpl(this._alertBox);

  @override
  Future<void> createAlert(ExpiryAlert alert) async {
    final model = ExpiryAlertModel.fromEntity(alert);
    await _alertBox.put(alert.id, model);
  }

  @override
  Future<ExpiryAlert?> getAlertById(String alertId) async {
    final model = _alertBox.get(alertId);
    return model?.toEntity();
  }

  @override
  Future<List<ExpiryAlert>> getAllAlerts() async {
    final models = _alertBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<ExpiryAlert>> getUnsentAlerts() async {
    final models = _alertBox.values.where((m) => !m.isAlertSent).toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<ExpiryAlert>> getExpiringAlerts(int daysThreshold) async {
    final models = _alertBox.values
        .where((m) => m.daysUntilExpiry <= daysThreshold && m.daysUntilExpiry > 0)
        .toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<ExpiryAlert>> getExpiredAlerts() async {
    final models = _alertBox.values.where((m) => m.daysUntilExpiry <= 0).toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<void> markAlertAsSent(String alertId) async {
    final model = _alertBox.get(alertId);
    if (model != null) {
      final updated = ExpiryAlertModel(
        id: model.id,
        productId: model.productId,
        productName: model.productName,
        expiryDate: model.expiryDate,
        daysUntilExpiry: model.daysUntilExpiry,
        stockCount: model.stockCount,
        isAlertSent: true,
        createdDate: model.createdDate,
      );
      await _alertBox.put(alertId, updated);
    }
  }

  @override
  Future<void> deleteAlert(String alertId) async {
    await _alertBox.delete(alertId);
  }

  @override
  Future<void> deleteAlertsForProduct(String productId) async {
    final keysToDelete = _alertBox.keys
        .where((key) => _alertBox.get(key)?.productId == productId)
        .toList();
    
    for (final key in keysToDelete) {
      await _alertBox.delete(key);
    }
  }

  @override
  Future<List<ExpiryAlert>> getAlertsByProductId(String productId) async {
    final models = _alertBox.values
        .where((m) => m.productId == productId)
        .toList();
    return models.map((model) => model.toEntity()).toList();
  }
}
