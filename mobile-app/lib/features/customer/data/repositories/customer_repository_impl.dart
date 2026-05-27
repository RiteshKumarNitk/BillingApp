import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/entities/customer.dart';
import '../../domain/repositories/customer_repository.dart';
import '../models/customer_model.dart';

class CustomerRepositoryImpl extends ICustomerRepository {
  static const String boxName = 'customers';
  final Box<CustomerModel> _customerBox;

  CustomerRepositoryImpl(this._customerBox);

  @override
  Future<void> saveCustomer(Customer customer) async {
    final model = CustomerModel.fromEntity(customer);
    await _customerBox.put(customer.id, model);
  }

  @override
  Future<Customer?> getCustomerById(String customerId) async {
    final model = _customerBox.get(customerId);
    return model?.toEntity();
  }

  @override
  Future<List<Customer>> getAllCustomers() async {
    final models = _customerBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Customer>> searchCustomers(String query) async {
    final allCustomers = await getAllCustomers();
    final lowerQuery = query.toLowerCase();
    
    return allCustomers
        .where((customer) =>
            customer.name.toLowerCase().contains(lowerQuery) ||
            customer.phone.contains(query) ||
            customer.email.toLowerCase().contains(lowerQuery))
        .toList();
  }

  @override
  Future<void> deleteCustomer(String customerId) async {
    await _customerBox.delete(customerId);
  }

  @override
  Future<void> updateLoyaltyPoints(String customerId, double points) async {
    final model = _customerBox.get(customerId);
    if (model != null) {
      final updated = CustomerModel(
        id: model.id,
        name: model.name,
        phone: model.phone,
        email: model.email,
        loyaltyPoints: model.loyaltyPoints + points,
        createdDate: model.createdDate,
        lastPurchaseDate: DateTime.now(),
        totalSpent: model.totalSpent,
      );
      await _customerBox.put(customerId, updated);
    }
  }

  @override
  Future<void> recordPurchase(String customerId, double amount) async {
    final model = _customerBox.get(customerId);
    if (model != null) {
      final loyaltyPoints = (amount / 100).floor().toDouble(); // 1 point per 100 units
      final updated = CustomerModel(
        id: model.id,
        name: model.name,
        phone: model.phone,
        email: model.email,
        loyaltyPoints: model.loyaltyPoints + loyaltyPoints,
        createdDate: model.createdDate,
        lastPurchaseDate: DateTime.now(),
        totalSpent: model.totalSpent + amount,
      );
      await _customerBox.put(customerId, updated);
    }
  }
}
