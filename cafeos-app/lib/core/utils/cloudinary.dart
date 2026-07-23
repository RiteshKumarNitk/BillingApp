/// Cafe branding images are stored on Cloudinary (billing-web's `/api/upload` route), which
/// already does thumbnail/medium/large/WebP/auto-format generation on the fly via URL segments —
/// no custom image-processing pipeline needed. Inserts a transform segment right after
/// `/upload/` in a `res.cloudinary.com` URL; any other host is returned unchanged, so this is safe
/// to call on a URL that might not actually be Cloudinary-hosted.
String cloudinaryThumbnail(String url, {int width = 400}) {
  const marker = '/upload/';
  final index = url.indexOf(marker);
  if (!url.contains('res.cloudinary.com') || index == -1) return url;
  final insertAt = index + marker.length;
  return '${url.substring(0, insertAt)}w_$width,q_auto,f_auto/${url.substring(insertAt)}';
}
