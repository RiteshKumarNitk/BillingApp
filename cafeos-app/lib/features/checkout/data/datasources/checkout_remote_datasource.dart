import 'package:dio/dio.dart';
import '../../../cart/domain/entities/cart_item.dart';
import '../models/placed_order_model.dart';

class CheckoutRemoteDataSource {
  final Dio dio;
  CheckoutRemoteDataSource(this.dio);

  Future<PlacedOrderModel> placeOrder({
    required String tenantId,
    required List<CartItem> items,
    String? notes,
    String? tableToken,
    String? idempotencyKey,
  }) async {
    final response = await dio.post('/customer/orders', data: {
      'tenantId': tenantId,
      'items': items.map((i) => i.toOrderItemJson()).toList(),
      if (notes != null && notes.isNotEmpty) 'notes': notes,
      if (tableToken != null) 'tableToken': tableToken,
      if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
    });
    final data = response.data as Map<String, dynamic>;
    return PlacedOrderModel.fromJson(data['order'] as Map<String, dynamic>);
  }
}
