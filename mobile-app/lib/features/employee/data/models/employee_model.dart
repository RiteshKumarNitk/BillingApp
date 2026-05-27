import 'package:hive/hive.dart';
import '../../domain/entities/employee.dart';

part 'employee_model.g.dart';

@HiveType(typeId: 1)
class EmployeeRoleAdapter extends TypeAdapter<EmployeeRole> {
  @override
  final typeId = 11;

  @override
  EmployeeRole read(BinaryReader reader) {
    return EmployeeRole.values[reader.readByte()];
  }

  @override
  void write(BinaryWriter writer, EmployeeRole obj) {
    writer.writeByte(obj.index);
  }
}

@HiveType(typeId: 7)
class EmployeeModel extends Employee {
  @override
  @HiveField(0)
  final String id;

  @override
  @HiveField(1)
  final String name;

  @override
  @HiveField(2)
  final String email;

  @override
  @HiveField(3)
  final String phone;

  @override
  @HiveField(4)
  final String password;

  @override
  @HiveField(5)
  final EmployeeRole role;

  @override
  @HiveField(6)
  final bool isActive;

  @override
  @HiveField(7)
  final DateTime createdDate;

  @override
  @HiveField(8)
  final double monthlySalesTarget;

  const EmployeeModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.password,
    required this.role,
    this.isActive = true,
    required this.createdDate,
    this.monthlySalesTarget = 0,
  }) : super(
    id: id,
    name: name,
    email: email,
    phone: phone,
    password: password,
    role: role,
    isActive: isActive,
    createdDate: createdDate,
    monthlySalesTarget: monthlySalesTarget,
  );

  factory EmployeeModel.fromEntity(Employee employee) {
    return EmployeeModel(
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      password: employee.password,
      role: employee.role,
      isActive: employee.isActive,
      createdDate: employee.createdDate,
      monthlySalesTarget: employee.monthlySalesTarget,
    );
  }

  Employee toEntity() {
    return Employee(
      id: id,
      name: name,
      email: email,
      phone: phone,
      password: password,
      role: role,
      isActive: isActive,
      createdDate: createdDate,
      monthlySalesTarget: monthlySalesTarget,
    );
  }
}
