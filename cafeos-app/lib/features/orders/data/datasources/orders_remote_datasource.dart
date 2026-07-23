import 'package:dio/dio.dart';
import '../models/order_model.dart';

class OrdersRemoteDataSource {
  final Dio dio;
  OrdersRemoteDataSource(this.dio);

  Future<List<OrderModel>> getOrders() async {
    final response = await dio.get('/customer/orders');
    final data = response.data as Map<String, dynamic>;
    final list = data['orders'] as List<dynamic>;
    return list.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<OrderModel> getOrderById(String id) async {
    final response = await dio.get('/customer/orders/$id');
    final data = response.data as Map<String, dynamic>;
    return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
  }
}
