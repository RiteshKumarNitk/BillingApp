import '../entities/customer.dart';

abstract class ICustomerRepository {
  /// Add or update a customer
  Future<void> saveCustomer(Customer customer);

  /// Get customer by ID
  Future<Customer?> getCustomerById(String customerId);

  /// Get all customers
  Future<List<Customer>> getAllCustomers();

  /// Search customers by name or phone
  Future<List<Customer>> searchCustomers(String query);

  /// Delete customer by ID
  Future<void> deleteCustomer(String customerId);

  /// Update loyalty points for a customer
  Future<void> updateLoyaltyPoints(String customerId, double points);

  /// Update total spent and last purchase date
  Future<void> recordPurchase(String customerId, double amount);
}
