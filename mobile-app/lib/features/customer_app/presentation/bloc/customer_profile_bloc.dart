import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/customer_profile_model.dart';

abstract class CustomerProfileEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadCustomerProfile extends CustomerProfileEvent {}
class UpdateCustomerProfile extends CustomerProfileEvent {
  final String? name;
  final String? phone;
  final String? currentPassword;
  final String? newPassword;
  UpdateCustomerProfile({this.name, this.phone, this.currentPassword, this.newPassword});
  @override
  List<Object?> get props => [name, phone, currentPassword, newPassword];
}

abstract class CustomerProfileState extends Equatable {
  @override
  List<Object?> get props => [];
}

class CustomerProfileInitial extends CustomerProfileState {}
class CustomerProfileLoading extends CustomerProfileState {}
class CustomerProfileLoaded extends CustomerProfileState {
  final CustomerProfile profile;
  final String? successMessage;
  CustomerProfileLoaded({required this.profile, this.successMessage});
  @override
  List<Object?> get props => [profile, successMessage];
}
class CustomerProfileSaving extends CustomerProfileState {
  final CustomerProfile profile;
  CustomerProfileSaving({required this.profile});
  @override
  List<Object?> get props => [profile];
}
class CustomerProfileError extends CustomerProfileState {
  final String message;
  final CustomerProfile? profile;
  CustomerProfileError({required this.message, this.profile});
  @override
  List<Object?> get props => [message, profile];
}

class CustomerProfileBloc extends Bloc<CustomerProfileEvent, CustomerProfileState> {
  final ApiClient _apiClient;

  CustomerProfileBloc({required ApiClient apiClient})
      : _apiClient = apiClient,
        super(CustomerProfileInitial()) {
    on<LoadCustomerProfile>(_onLoad);
    on<UpdateCustomerProfile>(_onUpdate);
  }

  Future<void> _onLoad(LoadCustomerProfile event, Emitter<CustomerProfileState> emit) async {
    emit(CustomerProfileLoading());
    try {
      final response = await _apiClient.getCustomerProfile();
      emit(CustomerProfileLoaded(profile: CustomerProfile.fromJson(response['profile'])));
    } catch (e) {
      emit(CustomerProfileError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onUpdate(UpdateCustomerProfile event, Emitter<CustomerProfileState> emit) async {
    CustomerProfile? currentProfile;
    if (state is CustomerProfileLoaded) currentProfile = (state as CustomerProfileLoaded).profile;
    if (state is CustomerProfileSaving) currentProfile = (state as CustomerProfileSaving).profile;

    if (currentProfile != null) {
      emit(CustomerProfileSaving(profile: currentProfile));
    }

    try {
      final body = <String, dynamic>{};
      if (event.name != null) body['name'] = event.name;
      if (event.phone != null) body['phone'] = event.phone;
      if (event.newPassword != null) {
        body['currentPassword'] = event.currentPassword;
        body['newPassword'] = event.newPassword;
      }
      final response = await _apiClient.updateCustomerProfile(body);
      if (response['profile'] != null && currentProfile != null) {
        emit(CustomerProfileLoaded(
          profile: currentProfile.copyWith(
            name: response['profile']['name'],
            phone: response['profile']['phone'],
          ),
          successMessage: 'Profile updated successfully!',
        ));
      }
    } catch (e) {
      // On error, stay on the loaded state so the UI doesn't flash
      if (currentProfile != null) {
        emit(CustomerProfileLoaded(profile: currentProfile));
      }
      // Then emit error with the profile so the UI can show the snackbar
      emit(CustomerProfileError(
        message: e.toString().replaceAll('Exception: ', ''),
        profile: currentProfile,
      ));
    }
  }
}
