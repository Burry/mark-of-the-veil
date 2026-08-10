import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function SigilIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path d="M24 2 46 24 24 46 2 24 24 2Z" />
      <path d="M24 9v30M16 24h16M19 15l5-5 5 5M19 33l5 5 5-5" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path d="M24 4 40 10v12c0 10-6.6 17.2-16 22-9.4-4.8-16-12-16-22V10l16-6Z" />
      <path d="M24 10 34 14v8c0 6.6-3.8 11.6-10 15-6.2-3.4-10-8.4-10-15v-8l10-4Z" />
    </svg>
  );
}

export function ResolveIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path d="M20 5h8v13h13v8H28v17h-8V26H7v-8h13V5Z" />
      <path d="M14 4h20M4 12v24M44 12v24M14 44h20" />
    </svg>
  );
}

export function DashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M10 46c10-1 13-7 17-17 2-5 6-10 12-13-2 5-1 10 2 13l9-6c-2 10-8 19-18 26-7 5-15 5-22-3Z" />
      <path d="M5 25h16M9 18h15M4 33h13" />
    </svg>
  );
}

export function PulseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="m32 6 6 18 14-8-9 15 15 4-18 4 8 15-16-10-16 10 8-15-18-4 15-4-9-15 14 8 6-18Z" />
      <circle cx="32" cy="35" r="8" />
    </svg>
  );
}

export function OverdriveIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M32 5 19 30h10l-5 29 21-33H34l8-21H32Z" />
      <path d="M12 19 6 14M52 19l6-5M11 46l-6 5M53 46l6 5" />
    </svg>
  );
}

export function HeadphonesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path d="M7 27v-4C7 13 14 6 24 6s17 7 17 17v4" />
      <path d="M7 25h8v16H9a2 2 0 0 1-2-2V25Zm34 0h-8v16h6a2 2 0 0 0 2-2V25Z" />
    </svg>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <rect x="17" y="8" width="30" height="48" rx="2" />
      <path d="M8 27c2-9 8-16 17-19M8 27l-3-9M8 27l9-5M56 37c-2 9-8 16-17 19M56 37l3 9M56 37l-9 5" />
    </svg>
  );
}

export function CarrotIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M24 20c12-4 20 4 16 16L25 58 10 43l14-23Z" />
      <path d="M27 19C25 9 30 4 34 3c1 8-1 13-7 16Zm4 0c7-8 14-7 18-4-4 6-10 8-18 4ZM17 32l11 2M14 42l8 2" />
    </svg>
  );
}
