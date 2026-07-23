import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../cubit/favorites_cubit.dart';
import '../cubit/favorites_state.dart';

/// Animated heart toggle — used on CafeCard (list) and CafeDetailsPage (header). Reads/writes the
/// single app-wide FavoritesCubit via context, so every instance stays in sync automatically.
class FavoriteButton extends StatelessWidget {
  final Cafe cafe;
  final double size;
  const FavoriteButton({super.key, required this.cafe, this.size = 20});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FavoritesCubit, FavoritesState>(
      buildWhen: (prev, curr) => prev.isFavorite(cafe.id) != curr.isFavorite(cafe.id),
      builder: (context, state) {
        final isFavorite = state.isFavorite(cafe.id);
        return InkWell(
          onTap: () => context.read<FavoritesCubit>().toggleFavorite(cafe),
          customBorder: const CircleBorder(),
          child: Container(
            padding: EdgeInsets.all(size * 0.35),
            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.4), shape: BoxShape.circle),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
              child: Icon(
                isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                key: ValueKey(isFavorite),
                color: isFavorite ? const Color(0xFFE5484D) : Colors.white,
                size: size,
              ),
            ),
          ),
        );
      },
    );
  }
}
