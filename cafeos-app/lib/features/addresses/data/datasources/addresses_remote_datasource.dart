import 'package:dio/dio.dart';
import '../models/customer_address_model.dart';

class AddressesRemoteDataSource {
  final Dio dio;
  AddressesRemoteDataSource(this.dio);

  Future<List<CustomerAddressModel>> getAddresses() async {
    final response = await dio.get('/customer/addresses');
    final data = response.data as Map<String, dynamic>;
    final list = data['addresses'] as List<dynamic>;
    return list.map((e) => CustomerAddressModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CustomerAddressModel> createAddress({
    String? label,
    required String fullAddress,
    String? landmark,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
    bool? isDefault,
  }) async {
    final response = await dio.post('/customer/addresses', data: {
      if (label != null) 'label': label,
      'fullAddress': fullAddress,
      if (landmark != null) 'landmark': landmark,
      if (city != null) 'city': city,
      if (state != null) 'state': state,
      if (postalCode != null) 'postalCode': postalCode,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (isDefault != null) 'isDefault': isDefault,
    });
    final data = response.data as Map<String, dynamic>;
    return CustomerAddressModel.fromJson(data['address'] as Map<String, dynamic>);
  }

  Future<CustomerAddressModel> updateAddress({
    required String id,
    String? label,
    String? fullAddress,
    String? landmark,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
    bool? isDefault,
  }) async {
    final response = await dio.put('/customer/addresses/$id', data: {
      if (label != null) 'label': label,
      if (fullAddress != null) 'fullAddress': fullAddress,
      if (landmark != null) 'landmark': landmark,
      if (city != null) 'city': city,
      if (state != null) 'state': state,
      if (postalCode != null) 'postalCode': postalCode,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (isDefault != null) 'isDefault': isDefault,
    });
    final data = response.data as Map<String, dynamic>;
    return CustomerAddressModel.fromJson(data['address'] as Map<String, dynamic>);
  }

  Future<void> deleteAddress(String id) => dio.delete('/customer/addresses/$id');
}
