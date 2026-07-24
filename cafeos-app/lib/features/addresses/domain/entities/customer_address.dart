import 'package:equatable/equatable.dart';

class CustomerAddress extends Equatable {
  final String id;
  final String? label;
  final String fullAddress;
  final String? landmark;
  final String? city;
  final String? state;
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final bool isDefault;

  const CustomerAddress({
    required this.id,
    this.label,
    required this.fullAddress,
    this.landmark,
    this.city,
    this.state,
    this.postalCode,
    this.latitude,
    this.longitude,
    this.isDefault = false,
  });

  /// "Jaipur, Rajasthan 302001" — compact second line, empty when nothing is set.
  String get cityStateLine {
    final cityState = [city, state].where((s) => s != null && s.isNotEmpty).join(', ');
    return [cityState, postalCode].where((s) => s != null && s.isNotEmpty).join(' ');
  }

  @override
  List<Object?> get props => [id, label, fullAddress, landmark, city, state, postalCode, latitude, longitude, isDefault];
}
