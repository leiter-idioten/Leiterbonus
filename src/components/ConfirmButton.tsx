import { useEffect, useState, type ReactNode } from 'react';

/** Button, der zur Sicherheit ein zweites Antippen verlangt (statt Browser-Dialog) */
export function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  className = 'btn',
}: {
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      className={`${className} ${armed ? 'btn--armed' : ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
