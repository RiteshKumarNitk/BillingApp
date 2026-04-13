part of 'expiry_alert_bloc.dart';

abstract class ExpiryEvent extends Equatable {
  const ExpiryEvent();

  @override
  List<Object?> get props => [];
}

class LoadExpiringAlerts extends ExpiryEvent {
  final int daysThreshold;

  const LoadExpiringAlerts({this.daysThreshold = 7});

  @override
  List<Object?> get props => [daysThreshold];
}

class ResetExpiryState extends ExpiryEvent {
  const ResetExpiryState();
}
