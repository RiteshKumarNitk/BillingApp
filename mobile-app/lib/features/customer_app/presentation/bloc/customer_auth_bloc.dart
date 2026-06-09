import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/customer_user_model.dart';

// Events
abstract class CustomerAuthEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class CustomerAuthCheckSession extends CustomerAuthEvent {}

class CustomerAuthLogin extends CustomerAuthEvent {
  final String email;
  final String password;
  CustomerAuthLogin({required this.email, required this.password});
  @override
  List<Object?> get props => [email, password];
}

class CustomerAuthRegister extends CustomerAuthEvent {
  final String name;
  final String email;
  final String password;
  final String? phone;
  CustomerAuthRegister({required this.name, required this.email, required this.password, this.phone});
  @override
  List<Object?> get props => [name, email, password, phone];
}

class CustomerAuthLogout extends CustomerAuthEvent {}

// States
abstract class CustomerAuthState extends Equatable {
  @override
  List<Object?> get props => [];
}

class CustomerAuthInitial extends CustomerAuthState {}
class CustomerAuthLoading extends CustomerAuthState {}
class CustomerAuthAuthenticated extends CustomerAuthState {
  final CustomerUser user;
  CustomerAuthAuthenticated({required this.user});
  @override
  List<Object?> get props => [user];
}
class CustomerAuthUnauthenticated extends CustomerAuthState {}
class CustomerAuthError extends CustomerAuthState {
  final String message;
  CustomerAuthError({required this.message});
  @override
  List<Object?> get props => [message];
}
class CustomerAuthRegisterSuccess extends CustomerAuthState {}

// BLoC
class CustomerAuthBloc extends Bloc<CustomerAuthEvent, CustomerAuthState> {
  final ApiClient _apiClient;

  CustomerAuthBloc({required ApiClient apiClient}) : _apiClient = apiClient, super(CustomerAuthInitial()) {
    on<CustomerAuthCheckSession>(_onCheckSession);
    on<CustomerAuthLogin>(_onLogin);
    on<CustomerAuthRegister>(_onRegister);
    on<CustomerAuthLogout>(_onLogout);
  }

  Future<void> _onCheckSession(CustomerAuthCheckSession event, Emitter<CustomerAuthState> emit) async {
    emit(CustomerAuthLoading());
    try {
      final token = await _apiClient.getCustomerToken();
      if (token == null) {
        emit(CustomerAuthUnauthenticated());
        return;
      }
      final response = await _apiClient.getCustomerProfile();
      if (response['profile'] != null) {
        emit(CustomerAuthAuthenticated(user: CustomerUser.fromJson(response['profile'])));
      } else {
        await _apiClient.customerLogout();
        emit(CustomerAuthUnauthenticated());
      }
    } catch (e) {
      await _apiClient.customerLogout();
      emit(CustomerAuthUnauthenticated());
    }
  }

  Future<void> _onLogin(CustomerAuthLogin event, Emitter<CustomerAuthState> emit) async {
    emit(CustomerAuthLoading());
    try {
      final response = await _apiClient.customerLogin(event.email, event.password);
      if (response['token'] != null) {
        // Save last mode and clear merchant token to prevent stale auth
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('last_mode', 'customer');
        await prefs.remove('auth_token');
        await prefs.remove('tenant_id');
        emit(CustomerAuthAuthenticated(user: CustomerUser.fromJson(response['user'])));
      } else {
        emit(CustomerAuthError(message: response['error'] ?? 'Login failed'));
      }
    } catch (e) {
      emit(CustomerAuthError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onRegister(CustomerAuthRegister event, Emitter<CustomerAuthState> emit) async {
    emit(CustomerAuthLoading());
    try {
      await _apiClient.customerRegister({
        'name': event.name,
        'email': event.email,
        'password': event.password,
        if (event.phone != null) 'phone': event.phone,
      });
      emit(CustomerAuthRegisterSuccess());
    } catch (e) {
      emit(CustomerAuthError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLogout(CustomerAuthLogout event, Emitter<CustomerAuthState> emit) async {
    await _apiClient.customerLogout();
    emit(CustomerAuthUnauthenticated());
  }
}
