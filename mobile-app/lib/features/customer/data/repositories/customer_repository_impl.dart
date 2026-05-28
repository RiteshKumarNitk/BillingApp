import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/customer.dart';
import '../../domain/repositories/customer_repository.dart';
import '../models/customer_model.dart';

class CustomerRepositoryImpl extends ICustomerRepository {
  final Box<CustomerModel> _customerBox;
  final ApiClient _apiClient;

  CustomerRepositoryImpl(this._customerBox, this._apiClient);

  @override
  Future<void> saveCustomer(Customer customer) async {
    final model = CustomerModel.fromEntity(customer);
    await _customerBox.put(customer.id, model);
    try {
      await _apiClient.createCustomer({
        'name': customer.name,
        'phone': customer.phone,
        'email': customer.email,
        'totalSpent': customer.totalSpent,
        'loyaltyPoints': customer.loyaltyPoints,
        'lastPurchaseDate': customer.lastPurchaseDate.toIso8601String(),
      });
    } catch (e) {
      debugPrint('Failed to sync customer to API: $e');
    }
  }

  @override
  Future<Customer?> getCustomerById(String customerId) async {
    final model = _customerBox.get(customerId);
    return model?.toEntity();
  }

  @override
  Future<List<Customer>> getAllCustomers() async {
    try {
      final response = await _apiClient.getCustomers();
      if (response['customers'] != null) {
        final List<dynamic> jsonList = response['customers'];
        final customers = jsonList.map((json) => CustomerModel.fromJson(json)).toList();
        await _customerBox.clear();
        for (var model in customers) {
          await _customerBox.put(model.id, model);
        }
        return customers.map((m) => m.toEntity()).toList();
      }
    } catch (e) {
      debugPrint('API fetch failed, falling back to local: $e');
    }
    final models = _customerBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Customer>> searchCustomers(String query) async {
    try {
      final response = await _apiClient.getCustomers(search: query);
      if (response['customers'] != null) {
        final List<dynamic> jsonList = response['customers'];
        return jsonList.map((json) => CustomerModel.fromJson(json).toEntity()).toList();
      }
    } catch (e) {
      debugPrint('API search failed, falling back to local: $e');
    }
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
    try {
      await _apiClient.deleteCustomer(customerId);
    } catch (e) {
      debugPrint('Failed to delete customer from API: $e');
    }
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
      try {
        await _apiClient.updateCustomer(customerId, {
          'loyaltyPoints': updated.loyaltyPoints,
        });
      } catch (e) {
        debugPrint('Failed to sync loyalty points: $e');
      }
    }
  }

  @override
  Future<void> recordPurchase(String customerId, double amount) async {
    final model = _customerBox.get(customerId);
    if (model != null) {
      final loyaltyPoints = (amount / 100).floor().toDouble();
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
      try {
        await _apiClient.updateCustomer(customerId, {
          'loyaltyPoints': updated.loyaltyPoints,
          'totalSpent': updated.totalSpent,
          'lastPurchaseDate': updated.lastPurchaseDate.toIso8601String(),
        });
      } catch (e) {
        debugPrint('Failed to sync purchase record: $e');
      }
    }
  }
}
