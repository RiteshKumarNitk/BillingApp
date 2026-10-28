import 'package:dio/dio.dart';

class CafeLoyalty {
  final String tenantId;
  final String cafeName;
  final String? logoUrl;
  final int points;
  final double valueRupees;
  final double totalSpent;

  const CafeLoyalty({
    required this.tenantId,
    required this.cafeName,
    required this.logoUrl,
    required this.points,
    required this.valueRupees,
    required this.totalSpent,
  });

  factory CafeLoyalty.fromJson(Map<String, dynamic> json) => CafeLoyalty(
        tenantId: json['tenantId'] as String,
        cafeName: json['cafeName'] as String? ?? 'Cafe',
        logoUrl: json['logoUrl'] as String?,
        points: (json['points'] as num?)?.toInt() ?? 0,
        valueRupees: (json['valueRupees'] as num?)?.toDouble() ?? 0,
        totalSpent: (json['totalSpent'] as num?)?.toDouble() ?? 0,
      );
}

class LoyaltySummary {
  final List<CafeLoyalty> cafes;
  final int totalPoints;
  final int earnRupeesPerPoint;
  final double pointValueRupees;

  const LoyaltySummary({
    required this.cafes,
    required this.totalPoints,
    required this.earnRupeesPerPoint,
    required this.pointValueRupees,
  });
}

/// GET /api/mobile/customer/loyalty — balances per cafe plus the programme rules (served by the
/// backend so the app never hard-codes the earn rate).
class LoyaltyRemoteDataSource {
  final Dio dio;
  LoyaltyRemoteDataSource(this.dio);

  Future<LoyaltySummary> getLoyalty() async {
    final response = await dio.get('/customer/loyalty');
    final data = response.data as Map<String, dynamic>;
    final rules = (data['rules'] as Map<String, dynamic>?) ?? const <String, dynamic>{};
    return LoyaltySummary(
      cafes: (data['cafes'] as List<dynamic>? ?? const <dynamic>[])
          .map((e) => CafeLoyalty.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalPoints: (data['totalPoints'] as num?)?.toInt() ?? 0,
      earnRupeesPerPoint: (rules['earnRupeesPerPoint'] as num?)?.toInt() ?? 100,
      pointValueRupees: (rules['pointValueRupees'] as num?)?.toDouble() ?? 1,
    );
  }
}
