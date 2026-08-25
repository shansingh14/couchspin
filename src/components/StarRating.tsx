interface StarRatingProps {
  value?: number
  onChange?: (v: number | undefined) => void
  size?: number
  readonly?: boolean
}

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.76 5.92 6.24.85-4.56 4.4 1.14 6.33L12 17.1l-5.58 3-1.14-6.33L.72 9.37l6.24-.85z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StarRating({ value, onChange, size = 24, readonly }: StarRatingProps) {
  if (readonly) {
    return (
      <span className="stars readonly" aria-label={value ? `${value} out of 5` : 'unrated'}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= (value ?? 0) ? 'star on' : 'star'}>
            <Star filled={n <= (value ?? 0)} size={size} />
          </span>
        ))}
      </span>
    )
  }

  return (
    <div className="stars" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={n <= (value ?? 0) ? 'star on' : 'star'}
          onClick={() => onChange?.(value === n ? undefined : n)}
        >
          <Star filled={n <= (value ?? 0)} size={size} />
        </button>
      ))}
      {value ? (
        <button type="button" className="star-clear" onClick={() => onChange?.(undefined)}>
          clear
        </button>
      ) : null}
    </div>
  )
}
