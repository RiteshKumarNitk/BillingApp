class CustomerUser {
  final String id;
  final String name;
  final String email;
  final String? phone;

  CustomerUser({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
  });

  factory CustomerUser.fromJson(Map<String, dynamic> json) {
    return CustomerUser(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
    );
  }
}

class CustomerAuthResponse {
  final String token;
  final CustomerUser user;

  CustomerAuthResponse({required this.token, required this.user});

  factory CustomerAuthResponse.fromJson(Map<String, dynamic> json) {
    return CustomerAuthResponse(
      token: json['token'] ?? '',
      user: CustomerUser.fromJson(json['user'] ?? {}),
    );
  }
}
