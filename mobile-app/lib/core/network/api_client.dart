import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Production API URL
  static const String baseUrl = 'https://billing-app-jade-beta.vercel.app/api/mobile';
  // static const String baseUrl = 'http://localhost:3001/api/mobile';

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
    final response = await http.post(url, headers: headers, body: body != null ? json.encode(body) : null);
    return _handleResponse(response);
  }

  Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.put(url, headers: headers, body: body != null ? json.encode(body) : null);
    return _handleResponse(response);
  }

  Future<dynamic> delete(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.delete(url, headers: headers);
    return _handleResponse(response);
  }

  Future<dynamic> patch(String endpoint, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.patch(url, headers: headers, body: body != null ? json.encode(body) : null);
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

  // ================== Auth Methods ==================
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await post('/auth/login', body: {
      'email': email,
      'password': password,
    });
    
    if (response['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', response['token']);
      await prefs.setString('last_mode', 'merchant');
      // Clear customer token to prevent stale auth on mode switch
      await prefs.remove('customer_token');
      if (response['user'] != null && response['user']['tenantId'] != null) {
        await prefs.setString('tenant_id', response['user']['tenantId']);
      }
    }
    
    return response;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('tenant_id');
  }

  // ================== Customer API (consolidated) ==================
  Future<Map<String, String>> _getCustomerHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('customer_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> _customerRequest(String method, String endpoint, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl/customer$endpoint');
    final headers = await _getCustomerHeaders();
    http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(url, headers: headers);
        break;
      case 'POST':
        response = await http.post(url, headers: headers, body: body != null ? json.encode(body) : null);
        break;
      case 'PATCH':
        response = await http.patch(url, headers: headers, body: body != null ? json.encode(body) : null);
        break;
      case 'PUT':
        response = await http.put(url, headers: headers, body: body != null ? json.encode(body) : null);
        break;
      default:
        throw Exception('Unsupported HTTP method: $method');
    }
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> customerRegister(Map<String, dynamic> data) async {
    return _customerRequest('POST', '/auth/register', body: data);
  }

  Future<Map<String, dynamic>> customerLogin(String email, String password) async {
    final response = await _customerRequest('POST', '/auth/login', body: {'email': email, 'password': password});
    if (response['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('customer_token', response['token']);
      await prefs.setString('last_mode', 'customer');
      // Clear merchant token to prevent stale auth on mode switch
      await prefs.remove('auth_token');
      await prefs.remove('tenant_id');
    }
    return response;
  }

  Future<void> customerLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('customer_token');
  }


  Future<String?> getCustomerToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('customer_token');
  }

  // ================== Customer Data APIs ==================
  Future<Map<String, dynamic>> getCustomerDashboard() => _customerRequest('GET', '/dashboard');
  Future<Map<String, dynamic>> getCustomerStores() => _customerRequest('GET', '/stores');
  Future<Map<String, dynamic>> getCustomerOrders() => _customerRequest('GET', '/orders');
  Future<Map<String, dynamic>> submitCustomerOrder(Map<String, dynamic> data) => _customerRequest('POST', '/orders', body: data);
  Future<Map<String, dynamic>> getCustomerNotifications({bool unreadOnly = false}) => _customerRequest('GET', '/notifications${unreadOnly ? '?unreadOnly=true' : ''}');
  Future<Map<String, dynamic>> markNotificationsRead(Map<String, dynamic> data) => _customerRequest('PATCH', '/notifications', body: data);
  Future<Map<String, dynamic>> getCustomerProfile() => _customerRequest('GET', '/profile');
  Future<Map<String, dynamic>> updateCustomerProfile(Map<String, dynamic> data) => _customerRequest('PUT', '/profile', body: data);
  Future<Map<String, dynamic>> getStoreMenu(String tenantId) => _customerRequest('GET', '/store-menu?tenantId=$tenantId');

  // ================== Merchant Customer API ==================
  Future<Map<String, dynamic>> getCustomers({int page = 1, int limit = 50, String? search}) async {
    String endpoint = '/customers?page=$page&limit=$limit';
    if (search != null && search.isNotEmpty) {
      endpoint += '&search=${Uri.encodeComponent(search)}';
    }
    return await get(endpoint);
  }

  Future<Map<String, dynamic>> createCustomer(Map<String, dynamic> data) async {
    return await post('/customers', body: data);
  }

  Future<Map<String, dynamic>> updateCustomer(String id, Map<String, dynamic> data) async {
    return await put('/customers/$id', body: data);
  }

  Future<void> deleteCustomer(String id) async {
    await delete('/customers/$id');
  }

  // ================== Discount API ==================
  Future<Map<String, dynamic>> getDiscounts({int page = 1, int limit = 50}) async {
    return await get('/discounts?page=$page&limit=$limit');
  }

  Future<Map<String, dynamic>> createDiscount(Map<String, dynamic> data) async {
    return await post('/discounts', body: data);
  }

  Future<Map<String, dynamic>> updateDiscount(String id, Map<String, dynamic> data) async {
    return await put('/discounts/$id', body: data);
  }

  Future<void> deleteDiscount(String id) async {
    await delete('/discounts/$id');
  }

  // ================== Shop API ==================
  Future<Map<String, dynamic>> getShop() async {
    return await get('/shop');
  }

  Future<Map<String, dynamic>> updateShop(Map<String, dynamic> data) async {
    return await put('/shop', body: data);
  }

  // ================== Transaction API ==================
  Future<Map<String, dynamic>> getTransactions({int page = 1, int limit = 1000}) async {
    return await get('/transactions?page=$page&limit=$limit');
  }

  Future<Map<String, dynamic>> createTransaction(Map<String, dynamic> data) async {
    return await post('/transactions', body: data);
  }

  // ================== Product API ==================
  Future<Map<String, dynamic>> updateProduct(String id, Map<String, dynamic> data) async {
    return await put('/products/$id', body: data);
  }

  Future<void> deleteProduct(String id) async {
    await delete('/products/$id');
  }

  Future<Map<String, dynamic>> bulkUpdateInventory(List<Map<String, dynamic>> products) async {
    return await put('/inventory/bulk', body: {'products': products});
  }

  // ================== User (Team) API ==================
  Future<Map<String, dynamic>> getUsers() async {
    return await get('/users');
  }

  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    return await post('/users', body: data);
  }

  Future<void> deleteUser(String id) async {
    await delete('/users/$id');
  }

  // ================== Role API ==================
  Future<Map<String, dynamic>> getRoles() async {
    return await get('/roles');
  }

  Future<Map<String, dynamic>> createRole(Map<String, dynamic> data) async {
    return await post('/roles', body: data);
  }

  Future<Map<String, dynamic>> updateRole(String id, Map<String, dynamic> data) async {
    return await put('/roles/$id', body: data);
  }

  Future<void> deleteRole(String id) async {
    await delete('/roles/$id');
  }

  // ================== Employee API ==================
  Future<Map<String, dynamic>> getEmployees({int page = 1, int limit = 50}) async {
    return await get('/employees?page=$page&limit=$limit');
  }

  Future<Map<String, dynamic>> createEmployee(Map<String, dynamic> data) async {
    return await post('/employees', body: data);
  }

  Future<Map<String, dynamic>> updateEmployee(String id, Map<String, dynamic> data) async {
    return await put('/employees/$id', body: data);
  }

  Future<void> deleteEmployee(String id) async {
    await delete('/employees/$id');
  }

  // ================== Merchant Order Queue API ==================
  Future<Map<String, dynamic>> getMerchantOrders({String status = 'PENDING'}) async {
    return await get('/merchant/orders?status=$status');
  }

  Future<Map<String, dynamic>> updateMerchantOrder(String orderId, String action) async {
    return await patch('/merchant/orders/$orderId', body: {'action': action});
  }
}
