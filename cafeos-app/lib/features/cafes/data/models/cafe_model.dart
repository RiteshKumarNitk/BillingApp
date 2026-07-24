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
    super.shopFrontImageUrl,
    super.ownerImageUrl,
    super.heroImageUrl,
    super.address,
    super.landmark,
    super.city,
    super.state,
    super.country,
    super.postalCode,
    super.latitude,
    super.longitude,
    super.businessHours,
    super.hours,
    super.aboutText,
    super.email,
    super.phone,
    super.distanceKm,
    super.themeId,
    super.appearance,
    super.activeDiscounts,
    super.galleryImages,
  });

  factory CafeModel.fromJson(Map<String, dynamic> json) {
    return CafeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      websiteSlug: json['websiteSlug'] as String?,
      tagline: json['tagline'] as String?,
      logoUrl: json['logoUrl'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      shopFrontImageUrl: json['shopFrontImageUrl'] as String?,
      ownerImageUrl: json['ownerImageUrl'] as String?,
      heroImageUrl: json['heroImageUrl'] as String?,
      address: json['address'] as String?,
      landmark: json['landmark'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      country: json['country'] as String?,
      postalCode: json['postalCode'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      businessHours: json['businessHours'] as String?,
      hours: json['hours'] is Map ? CafeHours.fromJson(Map<String, dynamic>.from(json['hours'] as Map)) : null,
      aboutText: json['aboutText'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
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
      galleryImages: ((json['galleryImages'] as List<dynamic>?) ?? [])
          .map((g) => GalleryImage(url: g['url'] as String, caption: g['caption'] as String?))
          .toList(),
    );
  }
}
