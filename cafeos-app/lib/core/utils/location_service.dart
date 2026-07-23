import 'package:geolocator/geolocator.dart';

/// Thin wrapper over geolocator — callers get a plain (lat, lng) or null, never have to deal with
/// permission/service-enabled branching themselves. Discovery gracefully falls back to an
/// unsorted cafe list when this returns null (denied permission, disabled location services,
/// timeout) rather than blocking the whole screen on it.
class LocationService {
  Future<(double lat, double lng)?> getCurrentPosition() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return null;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 8)),
      );
      return (position.latitude, position.longitude);
    } catch (_) {
      return null;
    }
  }
}
