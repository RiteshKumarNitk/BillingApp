import '../../../../core/theme/cafe_appearance.dart';
import '../../domain/entities/cafe.dart';

class CafeModel extends Cafe {
  const CafeModel({
    required super.id,
    required super.name,
    super.websiteSlug,
    super.tagline,
    super.logoUrl,
    super.coverImageUrl,
    super.address,
    super.latitude,
    super.longitude,
    super.businessHours,
    super.distanceKm,
    super.themeId,
    super.appearance,
    super.activeDiscounts,
  });

  factory CafeModel.fromJson(Map<String, dynamic> json) {
    return CafeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      websiteSlug: json['websiteSlug'] as String?,
      tagline: json['tagline'] as String?,
      logoUrl: json['logoUrl'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      address: json['address'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      businessHours: json['businessHours'] as String?,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      themeId: json['theme'] as String?,
      appearance: CafeAppearance.fromJson(json['appearance'] as Map<String, dynamic>?),
      activeDiscounts: ((json['activeDiscounts'] as List<dynamic>?) ?? [])
          .map((d) => CafeDiscountSummary(
                id: d['id'] as String,
                name: d['name'] as String,
                discountPercentage: (d['discountPercentage'] as num?)?.toDouble() ?? 0,
                applicableCategory: d['applicableCategory'] as String?,
                minimumQuantity: (d['minimumQuantity'] as num?)?.toInt() ?? 1,
              ))
          .toList(),
    );
  }
}
