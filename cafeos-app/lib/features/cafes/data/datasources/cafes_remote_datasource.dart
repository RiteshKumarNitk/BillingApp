import 'package:dio/dio.dart';
import '../models/cafe_model.dart';

class CafesRemoteDataSource {
  final Dio dio;
  CafesRemoteDataSource(this.dio);

  Future<List<CafeModel>> getCafes({double? lat, double? lng, String? search, String? sort, int? limit}) async {
    final response = await dio.get('/customer/cafes', queryParameters: {
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (search != null && search.isNotEmpty) 'search': search,
      if (sort != null) 'sort': sort,
      if (limit != null) 'limit': limit,
    });
    final data = response.data as Map<String, dynamic>;
    final list = data['cafes'] as List<dynamic>;
    return list.map((e) => CafeModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CafeModel> getCafeById(String id) async {
    final response = await dio.get('/customer/cafes/$id');
    final data = response.data as Map<String, dynamic>;
    return CafeModel.fromJson(data['cafe'] as Map<String, dynamic>);
  }
}
