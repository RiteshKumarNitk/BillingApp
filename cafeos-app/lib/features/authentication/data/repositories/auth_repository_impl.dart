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
      await remoteDataSource.register(name: name, email: email, password: password, phone: phone);
      // The register endpoint only creates the account (no token) — chain straight into login so
      // a new customer lands signed in, matching how Zomato/Swiggy-style signup flows behave.
      final (token, customer) = await remoteDataSource.login(email: email, password: password);
      await secureStorage.saveToken(token);
      return right(customer);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<void> logout() => secureStorage.clearToken();

  @override
  Future<bool> hasStoredSession() async => (await secureStorage.getToken()) != null;
}
