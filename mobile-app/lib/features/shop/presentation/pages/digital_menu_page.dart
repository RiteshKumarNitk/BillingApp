import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../bloc/shop_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/primary_button.dart';

class DigitalMenuPage extends StatefulWidget {
  const DigitalMenuPage({super.key});

  @override
  State<DigitalMenuPage> createState() => _DigitalMenuPageState();
}

class _DigitalMenuPageState extends State<DigitalMenuPage> {
  String? _tenantId;

  @override
  void initState() {
    super.initState();
    _loadTenantId();
  }

  Future<void> _loadTenantId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _tenantId = prefs.getString('tenant_id');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Digital Menu QR'),
        centerTitle: true,
      ),
      body: _tenantId == null
          ? const Center(child: CircularProgressIndicator())
          : Builder(
              builder: (context) {
                final menuUrl = 'https://billing-app-jade-beta.vercel.app/menu/$_tenantId';

                return Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text(
                        'Your Digital Menu',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Customers can scan this QR code to view your products and variants on their own devices.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                      ),
                      const SizedBox(height: 32),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: QrImageView(
                          data: menuUrl,
                          version: QrVersions.auto,
                          size: 200.0,
                        ),
                      ),
                      const SizedBox(height: 32),
                      SelectableText(
                        menuUrl,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.primaryColor,
                          decoration: TextDecoration.underline,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      TextButton.icon(
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: menuUrl));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Link copied to clipboard!')),
                          );
                        },
                        icon: const Icon(Icons.copy, size: 16),
                        label: const Text('Copy Link'),
                      ),
                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        child: PrimaryButton(
                          onPressed: () {
                            Share.share('Check out our digital menu: $menuUrl');
                          },
                          label: 'Share Link',
                          icon: Icons.share,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
