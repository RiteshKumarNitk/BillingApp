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

  /// Best-effort backend logout (revokes every outstanding token for the account) — the local
  /// token is always cleared regardless of whether the backend call succeeds, so the app never
  /// gets stuck "logged in" just because the request failed offline.
  Future<void> logout();

  Future<Either<Failure, Unit>> forgotPassword(String email);

  Future<Either<Failure, Unit>> resetPassword({required String email, required String code, required String newPassword});

  /// Sliding-session refresh: reissues a new token from the current one and stores it. Called
  /// opportunistically (app resume) or by DioClient after a 401 — failures are expected whenever
  /// there's no session yet and are not surfaced as user-facing errors.
  Future<Either<Failure, Unit>> refreshSession();

  /// True if a token is stored locally. Does not itself confirm the token is still valid with the
  /// server — callers that need that should hit a lightweight authenticated endpoint and handle a
  /// 401 (DioClient already clears the stored token automatically when that happens).
  Future<bool> hasStoredSession();
}
