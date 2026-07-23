import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer.dart';
import '../repositories/auth_repository.dart';

class RegisterParams extends Equatable {
  final String name;
  final String email;
  final String password;
  final String? phone;
  const RegisterParams({required this.name, required this.email, required this.password, this.phone});

  @override
  List<Object?> get props => [name, email, password, phone];
}

class RegisterUseCase implements UseCase<Customer, RegisterParams> {
  final AuthRepository repository;
  RegisterUseCase(this.repository);

  @override
  Future<Either<Failure, Customer>> call(RegisterParams params) {
    return repository.register(name: params.name, email: params.email, password: params.password, phone: params.phone);
  }
}
