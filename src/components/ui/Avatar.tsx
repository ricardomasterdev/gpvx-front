import React from 'react';
import { cn } from '../../utils/cn';
import { User } from 'lucide-react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  alt,
  name,
  size = 'md',
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);

  if (src && !imageError) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden flex-shrink-0',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold flex-shrink-0',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {name ? (
        getInitials(name)
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  );
};
