import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/utils/location_service.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../domain/entities/customer_address.dart';
import '../../domain/usecases/create_address_usecase.dart';
import '../../domain/usecases/update_address_usecase.dart';

/// Add or edit a saved address — `existing` non-null means edit. Talks straight to the usecases
/// (no cubit) since this screen is a one-shot form pushed on its own route; the addresses list
/// screen reloads itself when this pops with `true`, same as the reorder/forgot-password flows
/// elsewhere in the app that don't need a shared cubit instance across routes.
class AddressFormPage extends StatefulWidget {
  final CustomerAddress? existing;
  const AddressFormPage({super.key, this.existing});

  @override
  State<AddressFormPage> createState() => _AddressFormPageState();
}

class _AddressFormPageState extends State<AddressFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final _labelController = TextEditingController(text: widget.existing?.label ?? '');
  late final _addressController = TextEditingController(text: widget.existing?.fullAddress ?? '');
  late final _landmarkController = TextEditingController(text: widget.existing?.landmark ?? '');
  late final _cityController = TextEditingController(text: widget.existing?.city ?? '');
  late final _stateController = TextEditingController(text: widget.existing?.state ?? '');
  late final _postalCodeController = TextEditingController(text: widget.existing?.postalCode ?? '');
  double? _latitude;
  double? _longitude;
  bool _isSubmitting = false;
  bool _isLocating = false;

  @override
  void initState() {
    super.initState();
    _latitude = widget.existing?.latitude;
    _longitude = widget.existing?.longitude;
  }

  @override
  void dispose() {
    _labelController.dispose();
    _addressController.dispose();
    _landmarkController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _postalCodeController.dispose();
    super.dispose();
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLocating = true);
    final position = await sl<LocationService>().getCurrentPosition();
    if (!mounted) return;
    setState(() => _isLocating = false);
    if (position == null) {
      AppToast.error(context, 'Could not get your location. Check location permissions and try again.');
      return;
    }
    setState(() {
      _latitude = position.$1;
      _longitude = position.$2;
    });
    AppToast.success(context, 'Location captured.');
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _isSubmitting = true);

    final label = _labelController.text.trim();
    final fullAddress = _addressController.text.trim();
    final landmark = _landmarkController.text.trim();
    final city = _cityController.text.trim();
    final state = _stateController.text.trim();
    final postalCode = _postalCodeController.text.trim();

    final failure = widget.existing == null
        ? await sl<CreateAddressUseCase>()(CreateAddressParams(
            label: label.isEmpty ? null : label,
            fullAddress: fullAddress,
            landmark: landmark.isEmpty ? null : landmark,
            city: city.isEmpty ? null : city,
            state: state.isEmpty ? null : state,
            postalCode: postalCode.isEmpty ? null : postalCode,
            latitude: _latitude,
            longitude: _longitude,
          )).then((r) => r.match((f) => f, (_) => null))
        : await sl<UpdateAddressUseCase>()(UpdateAddressParams(
            id: widget.existing!.id,
            label: label,
            fullAddress: fullAddress,
            landmark: landmark,
            city: city,
            state: state,
            postalCode: postalCode,
            latitude: _latitude,
            longitude: _longitude,
          )).then((r) => r.match((f) => f, (_) => null));

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (failure != null) {
      AppToast.error(context, failure.message);
      return;
    }
    AppToast.success(context, widget.existing == null ? 'Address added.' : 'Address updated.');
    context.pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Edit Address' : 'Add Address')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTextField(controller: _labelController, label: 'Label (e.g. Home, Work)', prefixIcon: Icons.label_outline_rounded),
              const SizedBox(height: 14),
              AppTextField(
                controller: _addressController,
                label: 'Full address',
                prefixIcon: Icons.location_on_outlined,
                maxLines: 2,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter the address' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(controller: _landmarkController, label: 'Landmark (optional)', prefixIcon: Icons.near_me_outlined),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: AppTextField(controller: _cityController, label: 'City')),
                  const SizedBox(width: 12),
                  Expanded(child: AppTextField(controller: _stateController, label: 'State')),
                ],
              ),
              const SizedBox(height: 14),
              AppTextField(controller: _postalCodeController, label: 'Postal code', keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _isLocating ? null : _useCurrentLocation,
                icon: _isLocating
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.my_location_rounded, size: 18),
                label: Text(_latitude != null ? 'Location captured' : 'Use My Current Location'),
              ),
              const SizedBox(height: 24),
              PrimaryButton(label: isEdit ? 'Save Changes' : 'Save Address', onPressed: _isSubmitting ? null : _submit, isLoading: _isSubmitting),
            ],
          ),
        ),
      ),
    );
  }
}
