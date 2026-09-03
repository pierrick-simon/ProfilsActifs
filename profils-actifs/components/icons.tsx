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

export function EyeIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </LineIcon>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.36M6.06 6.06C3.3 7.7 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.83" />
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
      <path d="m2 2 20 20" />
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

export function LockIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </LineIcon>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </LineIcon>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="m6 9 6 6 6-6" />
    </LineIcon>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="m15 18-6-6 6-6" />
    </LineIcon>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="m9 18 6-6-6-6" />
    </LineIcon>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </LineIcon>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </LineIcon>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </LineIcon>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </LineIcon>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </LineIcon>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </LineIcon>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" />
    </LineIcon>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
