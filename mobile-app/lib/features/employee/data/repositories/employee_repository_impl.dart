import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/employee.dart';
import '../../domain/repositories/employee_repository.dart';
import '../models/employee_model.dart';

class EmployeeRepositoryImpl extends IEmployeeRepository {
  final Box<EmployeeModel> _employeeBox;
  final ApiClient _apiClient;

  EmployeeRepositoryImpl(this._employeeBox, this._apiClient);

  @override
  Future<void> saveEmployee(Employee employee) async {
    final model = EmployeeModel.fromEntity(employee);
    await _employeeBox.put(employee.id, model);
    try {
      await _apiClient.createEmployee(model.toJson());
    } catch (e) {
      debugPrint('Failed to sync employee to API: $e');
    }
  }

  @override
  Future<Employee?> getEmployeeById(String employeeId) async {
    final model = _employeeBox.get(employeeId);
    return model?.toEntity();
  }

  @override
  Future<List<Employee>> getAllEmployees() async {
    try {
      final response = await _apiClient.getEmployees();
      if (response['employees'] != null) {
        final List<dynamic> jsonList = response['employees'];
        final employees = jsonList.map((json) => EmployeeModel.fromJson(json)).toList();
        await _employeeBox.clear();
        for (var model in employees) {
          await _employeeBox.put(model.id, model);
        }
        return employees.map((m) => m.toEntity()).toList();
      }
    } catch (e) {
      debugPrint('API fetch failed, falling back to local: $e');
    }
    final models = _employeeBox.values.toList();
    return models.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Employee>> getActiveEmployees() async {
    final all = await getAllEmployees();
    return all.where((e) => e.isActive).toList();
  }

  @override
  Future<void> deleteEmployee(String employeeId) async {
    await _employeeBox.delete(employeeId);
    try {
      await _apiClient.deleteEmployee(employeeId);
    } catch (e) {
      debugPrint('Failed to delete employee from API: $e');
    }
  }

  @override
  Future<Employee?> authenticateEmployee(String email, String password) async {
    try {
      final models = _employeeBox.values
          .where((m) => m.email == email && m.password == password && m.isActive)
          .toList();
      if (models.isEmpty) return null;
      return models.first.toEntity();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> recordEmployeeSale(String employeeId, double saleAmount) async {
    final model = _employeeBox.get(employeeId);
    if (model != null) {}
  }

  @override
  Future<Employee?> getEmployeeByEmail(String email) async {
    try {
      final models = _employeeBox.values.where((m) => m.email == email).toList();
      if (models.isEmpty) return null;
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
      try {
        await _apiClient.updateEmployee(employeeId, {'isActive': isActive});
      } catch (e) {
        debugPrint('Failed to sync employee status: $e');
      }
    }
  }
}
