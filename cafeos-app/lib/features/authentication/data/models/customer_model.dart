import '../../domain/entities/customer.dart';

class CustomerModel extends Customer {
  const CustomerModel({required super.id, required super.name, required super.email, super.phone});

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
    );
  }
}
