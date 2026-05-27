import '../entities/expiry_alert.dart';

abstract class IExpiryAlertRepository {
  /// Create an expiry alert
  Future<void> createAlert(ExpiryAlert alert);

  /// Get alert by ID
  Future<ExpiryAlert?> getAlertById(String alertId);

  /// Get all alerts
  Future<List<ExpiryAlert>> getAllAlerts();

  /// Get active/unsent alerts
  Future<List<ExpiryAlert>> getUnsentAlerts();

  /// Get alerts for expiring soon (within N days)
  Future<List<ExpiryAlert>> getExpiringAlerts(int daysThreshold);

  /// Get expired alerts
  Future<List<ExpiryAlert>> getExpiredAlerts();

  /// Mark alert as sent
  Future<void> markAlertAsSent(String alertId);

  /// Delete alert by ID
  Future<void> deleteAlert(String alertId);

  /// Delete alerts for a product
  Future<void> deleteAlertsForProduct(String productId);

  /// Get alerts by product ID
  Future<List<ExpiryAlert>> getAlertsByProductId(String productId);
}
