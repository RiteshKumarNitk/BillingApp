import 'package:equatable/equatable.dart';
import '../../domain/entities/cafe.dart';

enum CafesStatus { initial, loading, loaded, error }

class CafesState extends Equatable {
  final CafesStatus status;
  final List<Cafe> cafes;
  final String? errorMessage;
  final bool locationEnabled;
  // null = "Nearest" (server's default distance/recency sort); 'popular' = ranked by real order
  // volume. The backend doesn't compute distanceKm at all on the popular path, so radiusKm has no
  // effect while this is 'popular' — see radiusKm below.
  final String? sort;
  // Client-side only (see the plan: "calculate on the client initially, keep the architecture
  // ready for server-side") — filters the already-fetched, already-distance-annotated list rather
  // than a new backend query param.
  final double? radiusKm;

  const CafesState({
    this.status = CafesStatus.initial,
    this.cafes = const [],
    this.errorMessage,
    this.locationEnabled = false,
    this.sort,
    this.radiusKm,
  });

  List<Cafe> get visibleCafes {
    if (radiusKm == null || sort == 'popular') return cafes;
    return cafes.where((c) => c.distanceKm != null && c.distanceKm! <= radiusKm!).toList();
  }

  CafesState copyWith({
    CafesStatus? status,
    List<Cafe>? cafes,
    String? errorMessage,
    bool? locationEnabled,
    String? sort,
    bool clearSort = false,
    double? radiusKm,
    bool clearRadius = false,
  }) {
    return CafesState(
      status: status ?? this.status,
      cafes: cafes ?? this.cafes,
      errorMessage: errorMessage,
      locationEnabled: locationEnabled ?? this.locationEnabled,
      sort: clearSort ? null : (sort ?? this.sort),
      radiusKm: clearRadius ? null : (radiusKm ?? this.radiusKm),
    );
  }

  @override
  List<Object?> get props => [status, cafes, errorMessage, locationEnabled, sort, radiusKm];
}
