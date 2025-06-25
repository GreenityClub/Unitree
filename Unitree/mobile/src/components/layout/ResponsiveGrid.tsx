import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { 
  getGridColumns, 
  getCardWidth, 
  rs, 
  isTablet,
  getLayoutConfig
} from '../../utils/responsive';

interface ResponsiveGridProps {
  children: React.ReactNode[];
  baseColumns?: number;
  gap?: number;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  renderItem?: (item: React.ReactNode, index: number) => React.ReactNode;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  baseColumns = 1,
  gap = 15,
  style,
  itemStyle,
  renderItem
}) => {
  const layoutConfig = getLayoutConfig();
  const columns = getGridColumns(baseColumns);
  const itemWidth = getCardWidth(columns);
  const gapSize = rs(gap);

  const renderRows = () => {
    const rows: React.ReactNode[][] = [];
    
    for (let i = 0; i < children.length; i += columns) {
      const row = children.slice(i, i + columns);
      rows.push(row);
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={[styles.row, { gap: gapSize }]}>
        {row.map((child, childIndex) => {
          const actualIndex = rowIndex * columns + childIndex;
          const content = renderItem ? renderItem(child, actualIndex) : child;
          
          return (
            <View
              key={childIndex}
              style={[
                styles.item,
                itemStyle,
                {
                  width: layoutConfig.isTablet ? itemWidth : undefined,
                  flex: layoutConfig.isTablet ? 0 : 1,
                }
              ]}
            >
              {content}
            </View>
          );
        })}
        
        {/* Fill remaining spaces in the last row */}
        {row.length < columns && layoutConfig.isTablet && (
          Array.from({ length: columns - row.length }).map((_, emptyIndex) => (
            <View
              key={`empty-${emptyIndex}`}
              style={[styles.item, { width: itemWidth }]}
            />
          ))
        )}
      </View>
    ));
  };

  return (
    <View style={[styles.container, style, { gap: gapSize }]}>
      {renderRows()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  item: {
    flexShrink: 0,
  },
}); 