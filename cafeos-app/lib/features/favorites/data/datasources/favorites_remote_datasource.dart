import 'package:dio/dio.dart';
import '../../../cafes/data/models/cafe_model.dart';

class FavoritesRemoteDataSource {
  final Dio dio;
  FavoritesRemoteDataSource(this.dio);

  Future<List<CafeModel>> getFavorites() async {
    final response = await dio.get('/customer/favorites');
    final data = response.data as Map<String, dynamic>;
    final list = data['cafes'] as List<dynamic>;
    return list.map((e) => CafeModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> addFavorite(String tenantId) => dio.post('/customer/favorites', data: {'tenantId': tenantId});

  Future<void> removeFavorite(String tenantId) => dio.delete('/customer/favorites', queryParameters: {'tenantId': tenantId});
}
