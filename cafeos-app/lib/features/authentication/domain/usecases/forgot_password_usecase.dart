import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/auth_repository.dart';

class ForgotPasswordParams extends Equatable {
  final String email;
  const ForgotPasswordParams({required this.email});

  @override
  List<Object?> get props => [email];
}

class ForgotPasswordUseCase implements UseCase<Unit, ForgotPasswordParams> {
  final AuthRepository repository;
  ForgotPasswordUseCase(this.repository);

  @override
  Future<Either<Failure, Unit>> call(ForgotPasswordParams params) => repository.forgotPassword(params.email);
}
