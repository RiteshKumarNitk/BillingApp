import 'package:equatable/equatable.dart';
import '../../../cafes/domain/entities/cafe.dart';

enum FavoritesStatus { initial, loading, loaded, error }

class FavoritesState extends Equatable {
  final FavoritesStatus status;
  final List<Cafe> cafes;
  final Set<String> favoriteIds;
  final String? errorMessage;

  const FavoritesState({
    this.status = FavoritesStatus.initial,
    this.cafes = const [],
    this.favoriteIds = const {},
    this.errorMessage,
  });

  bool isFavorite(String tenantId) => favoriteIds.contains(tenantId);

  FavoritesState copyWith({FavoritesStatus? status, List<Cafe>? cafes, Set<String>? favoriteIds, String? errorMessage}) {
    return FavoritesState(
      status: status ?? this.status,
      cafes: cafes ?? this.cafes,
      favoriteIds: favoriteIds ?? this.favoriteIds,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, cafes, favoriteIds, errorMessage];
}
