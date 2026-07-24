import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/entities/customer.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService secureStorage;

  AuthRepositoryImpl({required this.remoteDataSource, required this.secureStorage});

  @override
  Future<Either<Failure, Customer>> login({required String email, required String password}) async {
    try {
      final (token, customer) = await remoteDataSource.login(email: email, password: password);
      await secureStorage.saveToken(token);
      return right(customer);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, Customer>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      final (token, customer) = await remoteDataSource.register(name: name, email: email, password: password, phone: phone);
      await secureStorage.saveToken(token);
      return right(customer);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<void> logout() async {
    try {
      await remoteDataSource.logout();
    } catch (_) {
      // Offline or already-invalid token — still clear the local session below.
    }
    await secureStorage.clearToken();
  }

  @override
  Future<Either<Failure, Unit>> forgotPassword(String email) async {
    try {
      await remoteDataSource.forgotPassword(email);
      return right(unit);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, Unit>> resetPassword({required String email, required String code, required String newPassword}) async {
    try {
      await remoteDataSource.resetPassword(email: email, code: code, newPassword: newPassword);
      return right(unit);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, Unit>> refreshSession() async {
    try {
      final (token, _) = await remoteDataSource.refresh();
      await secureStorage.saveToken(token);
      return right(unit);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<bool> hasStoredSession() async => (await secureStorage.getToken()) != null;
}
