import '../../features/cafes/domain/entities/cafe.dart';

/// Keyless Google Maps search URL — opens whatever navigation app the device already has (Google
/// Maps, Apple Maps, or any other compatible app), no API key needed. Falls back to a text search
/// on the address when coordinates aren't set. Shared by Cafe Details and the Map tab's marker
/// sheet so there's exactly one implementation of "get directions."
Uri directionsUriFor(Cafe cafe) => cafe.hasCoordinates
    ? Uri.parse('https://www.google.com/maps/search/?api=1&query=${cafe.latitude},${cafe.longitude}')
    : Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(cafe.address ?? cafe.name)}');
