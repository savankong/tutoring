import 'package:flutter/material.dart';

class ColorPicker extends StatelessWidget {
  const ColorPicker({super.key, required this.selected, required this.onSelect});

  static const List<Color> colors = [
    Colors.black,
    Colors.red,
    Colors.blue,
    Colors.green,
    Colors.orange,
    Colors.purple,
  ];

  final Color selected;
  final ValueChanged<Color> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: colors.map((color) {
          final isSelected = color.toARGB32() == selected.toARGB32();
          return GestureDetector(
            onTap: () => onSelect(color),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? Colors.white : Colors.transparent,
                  width: 3,
                ),
                boxShadow: isSelected
                    ? const [BoxShadow(color: Colors.black45, blurRadius: 4)]
                    : null,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
