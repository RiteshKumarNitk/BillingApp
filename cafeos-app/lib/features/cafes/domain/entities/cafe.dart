import 'package:equatable/equatable.dart';
import '../../../../core/theme/cafe_appearance.dart';

class CafeDiscountSummary extends Equatable {
  final String id;
  final String name;
  final double discountPercentage;
  final String? applicableCategory;
  final int minimumQuantity;

  const CafeDiscountSummary({
    required this.id,
    required this.name,
    required this.discountPercentage,
    this.applicableCategory,
    required this.minimumQuantity,
  });

  @override
  List<Object?> get props => [id, name, discountPercentage, applicableCategory, minimumQuantity];
}

class GalleryImage extends Equatable {
  final String url;
  final String? caption;

  const GalleryImage({required this.url, this.caption});

  @override
  List<Object?> get props => [url, caption];
}

class Cafe extends Equatable {
  final String id;
  final String name;
  final String? websiteSlug;
  final String? tagline;
  final String? logoUrl;
  final String? coverImageUrl;
  final String? shopFrontImageUrl;
  final String? ownerImageUrl;
  // Server-computed priority chain (cover -> shop front -> first gallery photo -> null) — the one
  // field UI should actually render as "the" hero/card image; see billing-web's
  // lib/cafes/heroImage.ts for the shared logic this mirrors.
  final String? heroImageUrl;
  final String? address;
  final String? landmark;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final String? businessHours;
  final String? aboutText;
  final String? email;
  final String? phone;
  final double? distanceKm;
  final String? themeId;
  final CafeAppearance appearance;
  final List<CafeDiscountSummary> activeDiscounts;
  final List<GalleryImage> galleryImages;

  const Cafe({
    required this.id,
    required this.name,
    this.websiteSlug,
    this.tagline,
    this.logoUrl,
    this.coverImageUrl,
    this.shopFrontImageUrl,
    this.ownerImageUrl,
    this.heroImageUrl,
    this.address,
    this.landmark,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.latitude,
    this.longitude,
    this.businessHours,
    this.aboutText,
    this.email,
    this.phone,
    this.distanceKm,
    this.themeId,
    this.appearance = const CafeAppearance(),
    this.activeDiscounts = const [],
    this.galleryImages = const [],
  });

  String get distanceLabel {
    if (distanceKm == null) return '';
    if (distanceKm! < 1) return '${(distanceKm! * 1000).round()} m away';
    return '${distanceKm!.toStringAsFixed(1)} km away';
  }

  bool get hasCoordinates => latitude != null && longitude != null;

  /// "Jaipur, Rajasthan 302001" — city/state/postal combined for a compact second address line;
  /// empty when none of the three are set (never a stray ", " with nothing around it).
  String get cityStateLine {
    final cityState = [city, state].where((s) => s != null && s.isNotEmpty).join(', ');
    return [cityState, postalCode].where((s) => s != null && s.isNotEmpty).join(' ');
  }

  @override
  List<Object?> get props => [
        id, name, websiteSlug, tagline, logoUrl, coverImageUrl, shopFrontImageUrl, ownerImageUrl,
        heroImageUrl, address, landmark, city, state, country, postalCode, latitude, longitude,
        businessHours, aboutText, email, phone, distanceKm, themeId, appearance, activeDiscounts,
        galleryImages,
      ];
}
