import 'package:dio/dio.dart';
import '../models/customer_model.dart';

/// Talks to billing-web's existing app/api/mobile/customer/auth/* — no new backend auth needed,
/// this endpoint already existed and works (confirmed live during planning).
class AuthRemoteDataSource {
  final Dio dio;
  AuthRemoteDataSource(this.dio);

  Future<(String token, CustomerModel customer)> login({required String email, required String password}) async {
    final response = await dio.post('/customer/auth/login', data: {'email': email, 'password': password});
    final data = response.data as Map<String, dynamic>;
    return (data['token'] as String, CustomerModel.fromJson(data['user'] as Map<String, dynamic>));
  }

  /// Registration logs the customer in immediately (no email-verification step exists), so the
  /// backend returns a token in the same response — no separate login call needed.
  Future<(String token, CustomerModel customer)> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await dio.post('/customer/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
    final data = response.data as Map<String, dynamic>;
    return (data['token'] as String, CustomerModel.fromJson(data['user'] as Map<String, dynamic>));
  }

  Future<void> logout() => dio.post('/customer/auth/logout');

  Future<(String token, CustomerModel customer)> refresh() async {
    final response = await dio.post('/customer/auth/refresh');
    final data = response.data as Map<String, dynamic>;
    return (data['token'] as String, CustomerModel.fromJson(data['user'] as Map<String, dynamic>));
  }

  Future<void> forgotPassword(String email) => dio.post('/customer/auth/forgot-password', data: {'email': email});

  Future<void> resetPassword({required String email, required String code, required String newPassword}) {
    return dio.post('/customer/auth/reset-password', data: {'email': email, 'code': code, 'newPassword': newPassword});
  }
}
