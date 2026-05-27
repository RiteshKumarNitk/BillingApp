import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/entities/employee.dart';
import '../../domain/repositories/employee_repository.dart';
import '../models/employee_model.dart';

class EmployeeRepositoryImpl extends IEmployeeRepository {
  static const String boxName = 'employees';
  final Box<EmployeeModel> _employeeBox;

  EmployeeRepositoryImpl(this._employeeBox);

  @override
  Future<void> saveEmployee(Employee employee) async {
    final model = EmployeeModel.fromEntity(employee);
    await _employeeBox.put(employee.id, model);
  }

  @override
  Future<Employee?> getEmployeeById(String employeeId) async {
    final model = _employeeBox.get(employeeId);
    return model?.toEntity();
  }

  @override
  Future<List<Employee>> getAllEmployees() async {
    final models = _employeeBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Employee>> getActiveEmployees() async {
    final models = _employeeBox.values.where((m) => m.isActive).toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<void> deleteEmployee(String employeeId) async {
    await _employeeBox.delete(employeeId);
  }

  @override
  Future<Employee?> authenticateEmployee(String email, String password) async {
    try {
      final models = _employeeBox.values
          .where((m) => m.email == email && m.password == password && m.isActive)
          .toList();
      
      if (models.isEmpty) {
        return null;
      }
      return models.first.toEntity();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> recordEmployeeSale(String employeeId, double saleAmount) async {
    final model = _employeeBox.get(employeeId);
    if (model != null) {
      // Could track sales per employee here if needed
      // For now, just keep the model as is
    }
  }

  @override
  Future<Employee?> getEmployeeByEmail(String email) async {
    try {
      final models = _employeeBox.values.where((m) => m.email == email).toList();
      if (models.isEmpty) {
        return null;
      }
      return models.first.toEntity();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> toggleEmployeeStatus(String employeeId, bool isActive) async {
    final model = _employeeBox.get(employeeId);
    if (model != null) {
      final updated = EmployeeModel(
        id: model.id,
        name: model.name,
        email: model.email,
        phone: model.phone,
        password: model.password,
        role: model.role,
        isActive: isActive,
        createdDate: model.createdDate,
        monthlySalesTarget: model.monthlySalesTarget,
      );
      await _employeeBox.put(employeeId, updated);
    }
  }
}
