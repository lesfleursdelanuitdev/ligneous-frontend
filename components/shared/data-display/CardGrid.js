'use client';

/**
 * CardGrid Component
 * Responsive grid of cards
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {Function} props.renderCard - Function to render each card: (item, index) => ReactNode
 * @param {number} props.columns - Number of columns (responsive: sm, md, lg, xl)
 * @param {string} props.className - Additional CSS classes
 */
export default function CardGrid({
  items = [],
  renderCard,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  className = '',
}) {
  if (!items || items.length === 0) return null;

  const getGridClasses = () => {
    const classes = ['grid gap-4'];
    
    if (columns.default) classes.push(`grid-cols-${columns.default}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl || columns.lg}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {items.map((item, index) => (
        <div key={item.id || index}>
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  );
}

