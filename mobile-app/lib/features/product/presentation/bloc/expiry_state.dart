part of 'expiry_alert_bloc.dart';

enum ExpiryStatus { initial, loading, success, error }

class ExpiryState extends Equatable {
  final ExpiryStatus status;
  final List<ExpiryAlert> alerts;
  final String errorMessage;
  final int daysThreshold;

  const ExpiryState({
    this.status = ExpiryStatus.initial,
    this.alerts = const [],
    this.errorMessage = '',
    this.daysThreshold = 7, // Default: upcoming within 7 days
  });

  ExpiryState copyWith({
    ExpiryStatus? status,
    List<ExpiryAlert>? alerts,
    String? errorMessage,
    int? daysThreshold,
  }) {
    return ExpiryState(
      status: status ?? this.status,
      alerts: alerts ?? this.alerts,
      errorMessage: errorMessage ?? this.errorMessage,
      daysThreshold: daysThreshold ?? this.daysThreshold,
    );
  }

  @override
  List<Object?> get props => [status, alerts, errorMessage, daysThreshold];
}
