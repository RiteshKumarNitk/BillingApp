import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/app_toast.dart';

Future<void> launchExternalUrl(BuildContext context, Uri uri) async {
  if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    if (context.mounted) AppToast.error(context, 'Could not open that link');
  }
}
