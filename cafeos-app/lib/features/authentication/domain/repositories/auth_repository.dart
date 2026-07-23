import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../entities/customer.dart';

abstract class AuthRepository {
  Future<Either<Failure, Customer>> login({required String email, required String password});

  Future<Either<Failure, Customer>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  });

  Future<void> logout();

  /// True if a token is stored locally. Does not itself confirm the token is still valid with the
  /// server — callers that need that should hit a lightweight authenticated endpoint and handle a
  /// 401 (DioClient already clears the stored token automatically when that happens).
  Future<bool> hasStoredSession();
}
