import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Production API URL
  static const String baseUrl = 'https://billing-app-jade-beta.vercel.app/api/mobile';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> get(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();

    final response = await http.get(url, headers: headers);
    return _handleResponse(response);
  }

  Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();

    final response = await http.post(
      url,
      headers: headers,
      body: body != null ? json.encode(body) : null,
    );
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return json.decode(response.body);
    } else {
      String message = 'API Error ${response.statusCode}';
      try {
        final errorData = json.decode(response.body);
        message = errorData['error'] ?? message;
      } catch (_) {}
      throw Exception(message);
    }
  }

  // Auth Methods
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await post('/auth/login', body: {
      'email': email,
      'password': password,
    });
    
    if (response['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', response['token']);
    }
    
    return response;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }
}
