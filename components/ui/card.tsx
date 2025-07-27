import * as React from 'react';
import { cn } from '@/lib/utils';

/*
 * A generic Card component used to wrap detail panels and other content in
 * the sidebar. It applies a border, background and subtle shadow using
 * Tailwind CSS classes. Additional classes can be passed through the
 * className prop.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export default Card;
export { Card };