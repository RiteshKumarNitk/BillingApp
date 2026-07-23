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

  Future<CustomerModel> register({
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
    return CustomerModel.fromJson(data['user'] as Map<String, dynamic>);
  }
}
