import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer.dart';
import '../repositories/auth_repository.dart';

class UpdateProfileParams extends Equatable {
  final String name;
  final String? phone;
  final String? currentPassword;
  final String? newPassword;
  const UpdateProfileParams({required this.name, this.phone, this.currentPassword, this.newPassword});

  @override
  List<Object?> get props => [name, phone, currentPassword, newPassword];
}

class UpdateProfileUseCase implements UseCase<Customer, UpdateProfileParams> {
  final AuthRepository repository;
  UpdateProfileUseCase(this.repository);

  @override
  Future<Either<Failure, Customer>> call(UpdateProfileParams params) {
    return repository.updateProfile(
      name: params.name,
      phone: params.phone,
      currentPassword: params.currentPassword,
      newPassword: params.newPassword,
    );
  }
}
