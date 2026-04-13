import 'package:fpdart/fpdart.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/employee.dart';
import '../repositories/employee_repository.dart';

class AuthenticateEmployeeUseCase extends UseCase<Employee, EmployeeLoginParams> {
  final IEmployeeRepository repository;

  AuthenticateEmployeeUseCase(this.repository);

  @override
  Future<Either<Failure, Employee>> call(EmployeeLoginParams params) async {
    try {
      if (params.email.isEmpty || params.password.isEmpty) {
        return Left(CacheFailure('Email and password are required'));
      }
      final employee = await repository.authenticateEmployee(params.email, params.password);
      if (employee == null) {
        return Left(CacheFailure('Invalid email or password'));
      }
      return Right(employee);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}

class EmployeeLoginParams extends Equatable {
  final String email;
  final String password;

  const EmployeeLoginParams({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}
