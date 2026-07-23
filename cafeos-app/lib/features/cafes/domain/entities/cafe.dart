import 'package:equatable/equatable.dart';
import '../../../../core/theme/cafe_appearance.dart';

class Cafe extends Equatable {
  final String id;
  final String name;
  final String? websiteSlug;
  final String? tagline;
  final String? logoUrl;
  final String? coverImageUrl;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? businessHours;
  final double? distanceKm;
  final String? themeId;
  final CafeAppearance appearance;

  const Cafe({
    required this.id,
    required this.name,
    this.websiteSlug,
    this.tagline,
    this.logoUrl,
    this.coverImageUrl,
    this.address,
    this.latitude,
    this.longitude,
    this.businessHours,
    this.distanceKm,
    this.themeId,
    this.appearance = const CafeAppearance(),
  });

  String get distanceLabel {
    if (distanceKm == null) return '';
    if (distanceKm! < 1) return '${(distanceKm! * 1000).round()} m away';
    return '${distanceKm!.toStringAsFixed(1)} km away';
  }

  @override
  List<Object?> get props => [id, name, websiteSlug, tagline, logoUrl, coverImageUrl, address, latitude, longitude, businessHours, distanceKm, themeId, appearance];
}
