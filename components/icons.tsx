type IconProps = {
  className?: string;
};

function LineIcon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </LineIcon>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </LineIcon>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </LineIcon>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </LineIcon>
  );
}

export function MessageIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
    </LineIcon>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
    </LineIcon>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </LineIcon>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M20 6 9 17l-5-5" />
    </LineIcon>
  );
}

export function HeartIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
