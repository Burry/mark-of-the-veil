import type { PropsWithChildren } from 'react';

interface FrameProps extends PropsWithChildren {
  className?: string;
  label?: string;
}

export function Frame({ children, className = '', label }: FrameProps) {
  return (
    <section className={`engraved-frame ${className}`} aria-label={label}>
      <i className="frame-corner frame-corner--tl" aria-hidden="true" />
      <i className="frame-corner frame-corner--tr" aria-hidden="true" />
      <i className="frame-corner frame-corner--bl" aria-hidden="true" />
      <i className="frame-corner frame-corner--br" aria-hidden="true" />
      {children}
    </section>
  );
}

interface MenuButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
}

export function MenuButton({
  children,
  onClick,
  primary = false,
  autoFocus = false,
  className = '',
  disabled = false,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      className={`menu-button ${primary ? 'menu-button--primary' : ''} ${className}`}
      onClick={onClick}
      data-menu-item
      data-autofocus={autoFocus ? 'true' : undefined}
      disabled={disabled}
    >
      <span className="menu-button__sigil" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

export function Keycap({ children }: PropsWithChildren) {
  return <kbd className="keycap">{children}</kbd>;
}
