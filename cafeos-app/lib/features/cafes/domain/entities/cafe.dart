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

/// One day's hours, e.g. {"open": "09:00", "close": "18:00"} or {"closed": true}. Mirrors the
/// Website Builder's Business Info tab shape exactly (billing-web's WebsiteConfig.businessInfo.hours)
/// — a cafe that hasn't set this for a given day simply has no entry, never a fabricated value.
class DayHours extends Equatable {
  final String? open;
  final String? close;
  final bool closed;

  const DayHours({this.open, this.close, this.closed = false});

  factory DayHours.fromJson(Map<String, dynamic> json) => DayHours(
        open: json['open'] as String?,
        close: json['close'] as String?,
        closed: json['closed'] as bool? ?? false,
      );

  @override
  List<Object?> get props => [open, close, closed];
}

int? _parseMinutesOfDay(String? hhmm) {
  if (hhmm == null) return null;
  final parts = hhmm.split(':');
  if (parts.length != 2) return null;
  final h = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (h == null || m == null) return null;
  return h * 60 + m;
}

class CafeHours extends Equatable {
  final DayHours? monday;
  final DayHours? tuesday;
  final DayHours? wednesday;
  final DayHours? thursday;
  final DayHours? friday;
  final DayHours? saturday;
  final DayHours? sunday;

  const CafeHours({this.monday, this.tuesday, this.wednesday, this.thursday, this.friday, this.saturday, this.sunday});

  factory CafeHours.fromJson(Map<String, dynamic> json) {
    DayHours? day(String key) {
      final v = json[key];
      return v is Map ? DayHours.fromJson(Map<String, dynamic>.from(v)) : null;
    }

    return CafeHours(
      monday: day('monday'),
      tuesday: day('tuesday'),
      wednesday: day('wednesday'),
      thursday: day('thursday'),
      friday: day('friday'),
      saturday: day('saturday'),
      sunday: day('sunday'),
    );
  }

  DayHours? forWeekday(int weekday) {
    switch (weekday) {
      case DateTime.monday:
        return monday;
      case DateTime.tuesday:
        return tuesday;
      case DateTime.wednesday:
        return wednesday;
      case DateTime.thursday:
        return thursday;
      case DateTime.friday:
        return friday;
      case DateTime.saturday:
        return saturday;
      case DateTime.sunday:
        return sunday;
    }
    return null;
  }

  @override
  List<Object?> get props => [monday, tuesday, wednesday, thursday, friday, saturday, sunday];
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
  // Structured per-day hours from the Website Builder's Business Info tab — null when the cafe
  // hasn't set it (falls back to the free-text businessHours above for display purposes only;
  // isOpenNow never fabricates a status from the free-text field).
  final CafeHours? hours;
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
    this.hours,
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

  /// null = unknown (no structured hours set for today) — never fabricated true/false.
  /// false for a day explicitly marked closed; otherwise compares local time against open/close,
  /// handling an overnight window (close time past midnight, e.g. open 18:00 / close 02:00).
  bool? get isOpenNow {
    final today = hours?.forWeekday(DateTime.now().weekday);
    if (today == null) return null;
    if (today.closed) return false;
    final openMin = _parseMinutesOfDay(today.open);
    final closeMin = _parseMinutesOfDay(today.close);
    if (openMin == null || closeMin == null) return null;
    final nowMin = DateTime.now().hour * 60 + DateTime.now().minute;
    if (closeMin > openMin) return nowMin >= openMin && nowMin < closeMin;
    return nowMin >= openMin || nowMin < closeMin;
  }

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
        businessHours, hours, aboutText, email, phone, distanceKm, themeId, appearance, activeDiscounts,
        galleryImages,
      ];
}
