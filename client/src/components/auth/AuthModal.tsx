import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import styles from './AuthModal.module.css'
import { checkPasswordRules, isValidEmail } from '@/utils/validation'
import { useToast } from '@/components/toast/ToastProvider'

type Mode = 'login' | 'signup'

type AuthModalProps = {
  open: boolean
  initialMode?: Mode
  onClose: () => void
  onLogin: (payload: { email: string; password: string; remember?: boolean }) => Promise<void>
  onSignup: (payload: { firstName: string; lastName: string; email: string; password: string; remember?: boolean }) => Promise<void>
}

export default function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onLogin,
  onSignup,
}: AuthModalProps) {
  const toast = useToast()
  const [rendered, setRendered] = useState(open)
  const [closing, setClosing] = useState(false)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ firstName: false, lastName: false, email: false, password: false })

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create your account'), [mode])

  const emailNormalized = email.trim()
  const firstNameNormalized = firstName.trim()
  const lastNameNormalized = lastName.trim()

  const firstNameError = useMemo(() => {
    if (mode !== 'signup') return null
    if (firstNameNormalized.length === 0) return 'First name is required.'
    return null
  }, [firstNameNormalized, mode])

  const lastNameError = useMemo(() => {
    if (mode !== 'signup') return null
    if (lastNameNormalized.length === 0) return 'Last name is required.'
    return null
  }, [lastNameNormalized, mode])

  const emailError = useMemo(() => {
    if (emailNormalized.length === 0) return 'Email is required.'
    if (mode === 'login') return null
    if (!isValidEmail(emailNormalized)) return 'Enter a valid email address.'
    return null
  }, [emailNormalized, mode])

  const passwordRules = useMemo(() => checkPasswordRules(password), [password])

  const passwordError = useMemo(() => {
    if (password.length === 0) return 'Password is required.'
    if (mode === 'login') return null

    if (
      passwordRules.length &&
      passwordRules.lowercase &&
      passwordRules.uppercase &&
      passwordRules.number &&
      passwordRules.special
    ) {
      return null
    }

    return 'Password does not meet complexity requirements.'
  }, [mode, password.length, passwordRules.length, passwordRules.lowercase, passwordRules.number, passwordRules.special, passwordRules.uppercase])

  const canSubmit = useMemo(() => {
    if (mode === 'login') {
      return emailNormalized.length > 0 && password.trim().length > 0
    }

    const baseValid = !emailError && password.trim().length > 0
    if (!baseValid) return false

    if (firstNameNormalized.length === 0 || lastNameNormalized.length === 0) return false

    return (
      passwordRules.length &&
      passwordRules.lowercase &&
      passwordRules.uppercase &&
      passwordRules.number &&
      passwordRules.special
    )
  }, [emailError, emailNormalized.length, firstNameNormalized.length, lastNameNormalized.length, mode, password, passwordRules.length, passwordRules.lowercase, passwordRules.number, passwordRules.special, passwordRules.uppercase])

  useEffect(() => {
    if (open) {
      setRendered(true)
      setClosing(false)
      setMode(initialMode)
      setError(null)
      setSubmitting(false)
      setTouched({ firstName: false, lastName: false, email: false, password: false })
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setShowPassword(false)
      setCapsLockOn(false)
      return
    }

    if (!rendered) return

    setClosing(true)
    const t = window.setTimeout(() => {
      setRendered(false)
      setClosing(false)
    }, 170)

    return () => window.clearTimeout(t)
  }, [open, rendered])

  useEffect(() => {
    if (!rendered) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, rendered])

  if (!rendered) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    setTouched({ firstName: true, lastName: true, email: true, password: true })

    if (!canSubmit) {
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'login') {
        await onLogin({ email: emailNormalized, password, remember })
        toast.success('Logged in')
      } else {
        await onSignup({ firstName: firstNameNormalized, lastName: lastNameNormalized, email: emailNormalized, password, remember })
        toast.success('Account created')
      }

      onClose()
    } catch (err) {
      const message =
        typeof (err as any)?.response?.data?.message === 'string'
          ? (err as any).response.data.message
          : mode === 'login'
            ? 'Incorrect email or password.'
            : 'Could not create account. Please try again.'

      setError(message)
      toast.error(mode === 'login' ? 'Login failed' : 'Signup failed', message)
    } finally {
      setSubmitting(false)
    }
  }

  function passwordToggleLabel() {
    return showPassword ? 'Hide password' : 'Show password'
  }

  function EyeIcon({ open }: { open: boolean }) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {!open ? (
          <path
            d="M4 4l16 16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : null}
      </svg>
    )
  }

  return (
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className={`${styles.modal} ${closing ? styles.modalClosing : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
          >
            Sign up
          </button>
        </div>

        <div className={`${styles.formWrapper} ${mode === 'signup' ? styles.formWrapperScrollable : ''}`}>
          <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label className={styles.label} htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  className={styles.input}
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                  aria-invalid={touched.firstName || firstName.length > 0 ? Boolean(firstNameError) : undefined}
                  aria-describedby="firstName-msg"
                  required
                />
                <p
                  id="firstName-msg"
                  className={`${styles.fieldMessage} ${
                    touched.firstName || firstName.length > 0 ? styles.fieldMessageVisible : ''
                  } ${firstNameError ? styles.fieldMessageError : ''}`}
                >
                  {touched.firstName || firstName.length > 0 ? firstNameError ?? '' : ''}
                </p>
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                <label className={styles.label} htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  className={styles.input}
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                  aria-invalid={touched.lastName || lastName.length > 0 ? Boolean(lastNameError) : undefined}
                  aria-describedby="lastName-msg"
                  required
                />
                <p
                  id="lastName-msg"
                  className={`${styles.fieldMessage} ${
                    touched.lastName || lastName.length > 0 ? styles.fieldMessageVisible : ''
                  } ${lastNameError ? styles.fieldMessageError : ''}`}
                >
                  {touched.lastName || lastName.length > 0 ? lastNameError ?? '' : ''}
                </p>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 6 }}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type={mode === 'login' ? 'text' : 'email'}
              inputMode="email"
              autoComplete={mode === 'login' ? 'email' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={touched.email || email.length > 0 ? Boolean(emailError) : undefined}
              aria-describedby="email-msg"
              required
            />
            <p
              id="email-msg"
              className={`${styles.fieldMessage} ${
                touched.email || email.length > 0 ? styles.fieldMessageVisible : ''
              } ${emailError ? styles.fieldMessageError : ''}`}
            >
              {touched.email || email.length > 0 ? emailError ?? '' : ''}
            </p>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                className={`${styles.input} ${styles.passwordInput}`}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                onKeyUp={(e) => setCapsLockOn(Boolean((e as any).getModifierState?.('CapsLock')))}
                onKeyDown={(e) => setCapsLockOn(Boolean((e as any).getModifierState?.('CapsLock')))}
                aria-invalid={touched.password || password.length > 0 ? Boolean(passwordError) : undefined}
                aria-describedby="password-msg"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={passwordToggleLabel()}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <p
              id="password-msg"
              className={`${styles.fieldMessage} ${
                touched.password || password.length > 0 ? styles.fieldMessageVisible : ''
              } ${passwordError ? styles.fieldMessageError : ''}`}
            >
              {touched.password || password.length > 0 ? passwordError ?? '' : ''}
            </p>

            {capsLockOn ? <p className={styles.capsWarning}>Caps Lock is ON</p> : null}

            {mode === 'signup' ? (
              <div className={styles.ruleList} aria-label="Password requirements">
                <div className={`${styles.ruleItem} ${passwordRules.length ? styles.ruleOk : ''}`}>At least 8 characters</div>
                <div className={`${styles.ruleItem} ${passwordRules.uppercase ? styles.ruleOk : ''}`}>1 uppercase letter</div>
                <div className={`${styles.ruleItem} ${passwordRules.lowercase ? styles.ruleOk : ''}`}>1 lowercase letter</div>
                <div className={`${styles.ruleItem} ${passwordRules.number ? styles.ruleOk : ''}`}>1 number</div>
                <div className={`${styles.ruleItem} ${passwordRules.special ? styles.ruleOk : ''}`}>1 special character</div>
              </div>
            ) : null}
          </div>

          <div className={styles.row}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Keep me logged in
            </label>
            <p className={styles.helper}>Cookie-based session</p>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button className={styles.primary} type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>

          <p className={styles.helper}>
            {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.92)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
          </form>
        </div>
      </div>
    </div>
  )
}
