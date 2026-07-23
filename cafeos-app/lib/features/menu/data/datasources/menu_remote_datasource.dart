import 'package:dio/dio.dart';
import '../models/menu_item_model.dart';

class MenuRemoteDataSource {
  final Dio dio;
  MenuRemoteDataSource(this.dio);

  Future<List<MenuCategoryModel>> getMenu({required String tenantId, String? search}) async {
    final response = await dio.get('/customer/store-menu', queryParameters: {
      'tenantId': tenantId,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    final data = response.data as Map<String, dynamic>;
    final list = data['categorizedProducts'] as List<dynamic>;
    return list.map((e) => MenuCategoryModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
