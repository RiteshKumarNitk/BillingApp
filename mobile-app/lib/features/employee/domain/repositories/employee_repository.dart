import '../entities/employee.dart';

abstract class IEmployeeRepository {
  /// Add or update an employee
  Future<void> saveEmployee(Employee employee);

  /// Get employee by ID
  Future<Employee?> getEmployeeById(String employeeId);

  /// Get all employees
  Future<List<Employee>> getAllEmployees();

  /// Get active employees only
  Future<List<Employee>> getActiveEmployees();

  /// Delete employee by ID
  Future<void> deleteEmployee(String employeeId);

  /// Authenticate employee (login)
  Future<Employee?> authenticateEmployee(String email, String password);

  /// Update employee sales
  Future<void> recordEmployeeSale(String employeeId, double saleAmount);

  /// Get employee by email
  Future<Employee?> getEmployeeByEmail(String email);

  /// Toggle employee active status
  Future<void> toggleEmployeeStatus(String employeeId, bool isActive);
}
