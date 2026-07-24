import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/auth_repository.dart';

class ResetPasswordParams extends Equatable {
  final String email;
  final String code;
  final String newPassword;
  const ResetPasswordParams({required this.email, required this.code, required this.newPassword});

  @override
  List<Object?> get props => [email, code, newPassword];
}

class ResetPasswordUseCase implements UseCase<Unit, ResetPasswordParams> {
  final AuthRepository repository;
  ResetPasswordUseCase(this.repository);

  @override
  Future<Either<Failure, Unit>> call(ResetPasswordParams params) {
    return repository.resetPassword(email: params.email, code: params.code, newPassword: params.newPassword);
  }
}
