import { cn } from '@/lib/utils'

/**
 * Label + input + hint, hairline-quiet. Wraps the existing `.input`/`.label` classes
 * so forms stop hand-rolling inline styles. Pass `as="textarea"`/`as="select"` for variants.
 * Extra props spread onto the control. Server-safe (focus handled by `.input:focus` CSS).
 */
export function Field({ label, hint, id, as = 'input', className, children, ...props }) {
  const Control = as
  return (
    <div className={cn('w-full', className)}>
      {label ? <label htmlFor={id} className="label">{label}</label> : null}
      {as === 'select' ? (
        <Control id={id} className="input" {...props}>{children}</Control>
      ) : (
        <Control id={id} className="input" {...props} />
      )}
      {hint ? <p className="field-hint mt-1.5 text-xs text-muted-foreground" style={{ maxWidth: '56ch' }}>{hint}</p> : null}
    </div>
  )
}
