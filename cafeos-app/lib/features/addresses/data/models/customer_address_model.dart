import '../../domain/entities/customer_address.dart';

class CustomerAddressModel extends CustomerAddress {
  const CustomerAddressModel({
    required super.id,
    super.label,
    required super.fullAddress,
    super.landmark,
    super.city,
    super.state,
    super.postalCode,
    super.latitude,
    super.longitude,
    super.isDefault,
  });

  factory CustomerAddressModel.fromJson(Map<String, dynamic> json) {
    return CustomerAddressModel(
      id: json['id'] as String,
      label: json['label'] as String?,
      fullAddress: json['fullAddress'] as String,
      landmark: json['landmark'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      postalCode: json['postalCode'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }
}
