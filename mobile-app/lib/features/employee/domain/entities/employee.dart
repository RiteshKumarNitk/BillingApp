import 'package:equatable/equatable.dart';

enum EmployeeRole {
  admin,
  cashier,
  manager,
  inventory,
}

class Employee extends Equatable {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String password;
  final EmployeeRole role;
  final bool isActive;
  final DateTime createdDate;
  final double monthlySalesTarget;

  const Employee({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.password,
    required this.role,
    this.isActive = true,
    required this.createdDate,
    this.monthlySalesTarget = 0,
  });

  /// Get role display name
  String get roleDisplayName {
    switch (role) {
      case EmployeeRole.admin:
        return 'Administrator';
      case EmployeeRole.cashier:
        return 'Cashier';
      case EmployeeRole.manager:
        return 'Manager';
      case EmployeeRole.inventory:
        return 'Inventory Officer';
    }
  }

  /// Check if employee has admin privileges
  bool get isAdmin => role == EmployeeRole.admin;

  @override
  List<Object?> get props => [
    id,
    name,
    email,
    phone,
    password,
    role,
    isActive,
    createdDate,
    monthlySalesTarget,
  ];
}
