import 'package:dio/dio.dart';
import '../models/order_model.dart';

class OrdersRemoteDataSource {
  final Dio dio;
  OrdersRemoteDataSource(this.dio);

  Future<List<OrderModel>> getOrders({String? status}) async {
    final response = await dio.get('/customer/orders', queryParameters: status != null ? {'status': status} : null);
    final data = response.data as Map<String, dynamic>;
    final list = data['orders'] as List<dynamic>;
    return list.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<OrderModel> getOrderById(String id) async {
    final response = await dio.get('/customer/orders/$id');
    final data = response.data as Map<String, dynamic>;
    return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
  }

  /// Cancels an order the cafe hasn't started yet. The server answers 409 once the cafe has
  /// accepted it (the message tells the customer to contact the cafe).
  Future<void> cancelOrder(String id) async {
    await dio.patch('/customer/orders/$id', data: {'action': 'CANCEL'});
  }
}
