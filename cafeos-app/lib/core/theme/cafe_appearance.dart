import 'package:equatable/equatable.dart';

/// Mirrors the shape of `WebsiteConfig.appearance` in billing-web (lib/website/types.ts /
/// themeDefinitions.ts) — the same Theme Engine data the website itself renders from. Comes back
/// as `theme`/`appearance` on GET /api/mobile/customer/cafes and (once fetched) a cafe's own
/// detail/menu response, so a cafe picked "Luxury Coffee" on the web sees the same gold-on-dark
/// palette in the app once a customer is inside their menu.
class CafeAppearance extends Equatable {
  final String? primaryColor;
  final String? secondaryColor;
  final String? accentColor;
  final String? backgroundColor;
  final String? textColor;
  final String? headingFont;
  final String? bodyFont;

  const CafeAppearance({
    this.primaryColor,
    this.secondaryColor,
    this.accentColor,
    this.backgroundColor,
    this.textColor,
    this.headingFont,
    this.bodyFont,
  });

  factory CafeAppearance.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const CafeAppearance();
    final colors = json['colors'] as Map<String, dynamic>?;
    final typography = json['typography'] as Map<String, dynamic>?;
    return CafeAppearance(
      primaryColor: colors?['primary'] as String?,
      secondaryColor: colors?['secondary'] as String?,
      accentColor: colors?['accent'] as String?,
      backgroundColor: colors?['background'] as String?,
      textColor: colors?['text'] as String?,
      headingFont: typography?['headingFont'] as String?,
      bodyFont: typography?['bodyFont'] as String?,
    );
  }

  @override
  List<Object?> get props => [primaryColor, secondaryColor, accentColor, backgroundColor, textColor, headingFont, bodyFont];
}
