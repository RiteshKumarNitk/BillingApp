import 'package:equatable/equatable.dart';
import '../../domain/entities/customer.dart';

enum AuthStatus { unknown, authenticated, guest, unauthenticated }

class AuthState extends Equatable {
  final AuthStatus status;
  final Customer? customer;
  final bool isSubmitting;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.customer,
    this.isSubmitting = false,
    this.errorMessage,
  });

  bool get isLoggedIn => status == AuthStatus.authenticated;

  AuthState copyWith({
    AuthStatus? status,
    Customer? customer,
    bool? isSubmitting,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      customer: customer ?? this.customer,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [status, customer, isSubmitting, errorMessage];
}
