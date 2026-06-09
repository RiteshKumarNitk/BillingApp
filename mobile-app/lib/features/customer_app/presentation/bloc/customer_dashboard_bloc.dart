import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/customer_dashboard_model.dart';

// Events
abstract class CustomerDashboardEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadCustomerDashboard extends CustomerDashboardEvent {}

// States
abstract class CustomerDashboardState extends Equatable {
  @override
  List<Object?> get props => [];
}

class CustomerDashboardInitial extends CustomerDashboardState {}
class CustomerDashboardLoading extends CustomerDashboardState {}
class CustomerDashboardLoaded extends CustomerDashboardState {
  final CustomerDashboardData data;
  CustomerDashboardLoaded({required this.data});
  @override
  List<Object?> get props => [data];
}
class CustomerDashboardError extends CustomerDashboardState {
  final String message;
  CustomerDashboardError({required this.message});
  @override
  List<Object?> get props => [message];
}

// BLoC
class CustomerDashboardBloc extends Bloc<CustomerDashboardEvent, CustomerDashboardState> {
  final ApiClient _apiClient;

  CustomerDashboardBloc({required ApiClient apiClient}) : _apiClient = apiClient, super(CustomerDashboardInitial()) {
    on<LoadCustomerDashboard>(_onLoad);
  }

  Future<void> _onLoad(LoadCustomerDashboard event, Emitter<CustomerDashboardState> emit) async {
    emit(CustomerDashboardLoading());
    try {
      final response = await _apiClient.getCustomerDashboard();
      emit(CustomerDashboardLoaded(data: CustomerDashboardData.fromJson(response)));
    } catch (e) {
      emit(CustomerDashboardError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }
}
