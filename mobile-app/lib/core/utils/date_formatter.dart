class DateFormatter {
  static const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /// Format date as "12 Jan" or "12 Jan 2024" if different year
  static String short(DateTime date) {
    return '${date.day} ${_months[date.month - 1]}';
  }

  /// Format date as "12 Jan 2024"
  static String full(DateTime date) {
    return '${date.day} ${_months[date.month - 1]} ${date.year}';
  }

  /// Format date as "12 Jan, 3:45 PM"
  static String withTime(DateTime date) {
    final hour = date.hour > 12 ? date.hour - 12 : date.hour;
    final amPm = date.hour >= 12 ? 'PM' : 'AM';
    return '${date.day} ${_months[date.month - 1]}, ${hour == 0 ? 12 : hour}:${date.minute.toString().padLeft(2, '0')} $amPm';
  }

  /// Relative time like "5m ago", "2h ago", "3d ago"
  static String timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return short(date);
  }
}
