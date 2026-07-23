import 'package:equatable/equatable.dart';
import '../../../cafes/domain/entities/cafe.dart';

enum HomeSectionStatus { initial, loading, loaded, error }

class HomeState extends Equatable {
  final HomeSectionStatus nearbyStatus;
  final List<Cafe> nearbyCafes;
  final bool locationEnabled;
  final HomeSectionStatus popularStatus;
  final List<Cafe> popularCafes;
  final HomeSectionStatus recentStatus;
  final List<Cafe> recentCafes;

  const HomeState({
    this.nearbyStatus = HomeSectionStatus.initial,
    this.nearbyCafes = const [],
    this.locationEnabled = false,
    this.popularStatus = HomeSectionStatus.initial,
    this.popularCafes = const [],
    this.recentStatus = HomeSectionStatus.initial,
    this.recentCafes = const [],
  });

  /// Real cover images only, drawn from nearby results — never a stock/fabricated banner. Empty
  /// when no nearby cafe has one, so the hero carousel simply doesn't render rather than faking it.
  List<Cafe> get heroCandidates => nearbyCafes.where((c) => c.coverImageUrl != null).take(5).toList();

  HomeState copyWith({
    HomeSectionStatus? nearbyStatus,
    List<Cafe>? nearbyCafes,
    bool? locationEnabled,
    HomeSectionStatus? popularStatus,
    List<Cafe>? popularCafes,
    HomeSectionStatus? recentStatus,
    List<Cafe>? recentCafes,
  }) {
    return HomeState(
      nearbyStatus: nearbyStatus ?? this.nearbyStatus,
      nearbyCafes: nearbyCafes ?? this.nearbyCafes,
      locationEnabled: locationEnabled ?? this.locationEnabled,
      popularStatus: popularStatus ?? this.popularStatus,
      popularCafes: popularCafes ?? this.popularCafes,
      recentStatus: recentStatus ?? this.recentStatus,
      recentCafes: recentCafes ?? this.recentCafes,
    );
  }

  @override
  List<Object?> get props => [nearbyStatus, nearbyCafes, locationEnabled, popularStatus, popularCafes, recentStatus, recentCafes];
}
