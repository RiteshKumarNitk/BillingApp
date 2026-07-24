import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/create_address_usecase.dart';
import '../../domain/usecases/delete_address_usecase.dart';
import '../../domain/usecases/get_addresses_usecase.dart';
import '../../domain/usecases/update_address_usecase.dart';
import 'addresses_state.dart';

class AddressesCubit extends Cubit<AddressesState> {
  final GetAddressesUseCase _getAddressesUseCase;
  final CreateAddressUseCase _createAddressUseCase;
  final UpdateAddressUseCase _updateAddressUseCase;
  final DeleteAddressUseCase _deleteAddressUseCase;

  AddressesCubit({
    required GetAddressesUseCase getAddressesUseCase,
    required CreateAddressUseCase createAddressUseCase,
    required UpdateAddressUseCase updateAddressUseCase,
    required DeleteAddressUseCase deleteAddressUseCase,
  })  : _getAddressesUseCase = getAddressesUseCase,
        _createAddressUseCase = createAddressUseCase,
        _updateAddressUseCase = updateAddressUseCase,
        _deleteAddressUseCase = deleteAddressUseCase,
        super(const AddressesState());

  Future<void> loadAddresses() async {
    emit(state.copyWith(status: AddressesStatus.loading));
    final result = await _getAddressesUseCase(const NoParams());
    result.match(
      (failure) => emit(state.copyWith(status: AddressesStatus.error, errorMessage: failure.message)),
      (addresses) => emit(state.copyWith(status: AddressesStatus.loaded, addresses: addresses)),
    );
  }

  /// Returns the failure (if any) so the calling form can show it inline; success just refreshes
  /// the list and lets the caller pop/navigate.
  Future<Failure?> createAddress(CreateAddressParams params) async {
    emit(state.copyWith(isMutating: true));
    final result = await _createAddressUseCase(params);
    return result.match(
      (failure) {
        emit(state.copyWith(isMutating: false));
        return failure;
      },
      (_) {
        emit(state.copyWith(isMutating: false));
        loadAddresses();
        return null;
      },
    );
  }

  Future<Failure?> updateAddress(UpdateAddressParams params) async {
    emit(state.copyWith(isMutating: true));
    final result = await _updateAddressUseCase(params);
    return result.match(
      (failure) {
        emit(state.copyWith(isMutating: false));
        return failure;
      },
      (_) {
        emit(state.copyWith(isMutating: false));
        loadAddresses();
        return null;
      },
    );
  }

  Future<void> setDefault(String id) => updateAddress(UpdateAddressParams(id: id, isDefault: true));

  Future<Failure?> deleteAddress(String id) async {
    emit(state.copyWith(isMutating: true));
    final result = await _deleteAddressUseCase(id);
    return result.match(
      (failure) {
        emit(state.copyWith(isMutating: false));
        return failure;
      },
      (_) {
        emit(state.copyWith(isMutating: false));
        loadAddresses();
        return null;
      },
    );
  }
}
