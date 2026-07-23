import 'package:equatable/equatable.dart';
import '../../domain/entities/cafe.dart';

enum CafesStatus { initial, loading, loaded, error }

class CafesState extends Equatable {
  final CafesStatus status;
  final List<Cafe> cafes;
  final String? errorMessage;
  final bool locationEnabled;

  const CafesState({
    this.status = CafesStatus.initial,
    this.cafes = const [],
    this.errorMessage,
    this.locationEnabled = false,
  });

  CafesState copyWith({CafesStatus? status, List<Cafe>? cafes, String? errorMessage, bool? locationEnabled}) {
    return CafesState(
      status: status ?? this.status,
      cafes: cafes ?? this.cafes,
      errorMessage: errorMessage,
      locationEnabled: locationEnabled ?? this.locationEnabled,
    );
  }

  @override
  List<Object?> get props => [status, cafes, errorMessage, locationEnabled];
}
