import { PALETTE, fontStack, inputStyle } from '../styles/tema';

export function Button({ children, variant = 'primary', style, ...props }) {
  const variantes = {
    primary: { background: PALETTE.stripe, color: PALETTE.chalk, border: 'none' },
    brass: { background: PALETTE.brass, color: PALETTE.ink, border: 'none' },
    ghost: { background: 'rgba(255,255,255,0.06)', color: PALETTE.chalk, border: '1px solid rgba(244,246,241,0.2)' },
    danger: { background: 'rgba(200,30,44,0.15)', color: '#ff8a8a', border: '1px solid rgba(200,30,44,0.4)' },
  };
  return (
    <button
      {...props}
      style={{
        padding: '12px 18px',
        borderRadius: 12,
        fontFamily: fontStack.label,
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: 0.3,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...variantes[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 12, color: 'rgba(244,246,241,0.6)', marginBottom: 6,
        fontFamily: fontStack.label, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function PageWrapper({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(circle at 50% -10%, ${PALETTE.pitch} 0%, ${PALETTE.ink} 65%)`,
      fontFamily: fontStack.body,
    }}>
      {children}
    </div>
  );
}
