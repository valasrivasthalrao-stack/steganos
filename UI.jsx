import React, { useState, useRef } from 'react'
import s from './UI.module.css'

// ── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' }
  return (
    <div className={`${s.alert} ${s[`a_${type}`]}`}>
      <span className={s.aIcon}>{icons[type]}</span>
      <span>{children}</span>
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Btn({ variant = 'green', loading, children, ...p }) {
  return (
    <button className={`${s.btn} ${s[`b_${variant}`]}`}
      disabled={loading || p.disabled} {...p}>
      {loading ? <span className={s.spin} /> : children}
    </button>
  )
}

// ── Panel ────────────────────────────────────────────────────────────────────
export function Panel({ label, icon, color, children, delay = 0, className = '', style = {} }) {
  const ic = color || 'var(--green)'
  return (
    <div className={`${s.panel} ${className} fu`} style={{ animationDelay: `${delay}s`, ...style }}>
      {label && (
        <div className={s.ph}>
          {icon && <span style={{ color: ic }}>{icon}</span>}
          <span>{label}</span>
        </div>
      )}
      <div className={s.pb}>{children}</div>
    </div>
  )
}

// ── DropZone ─────────────────────────────────────────────────────────────────
export function DropZone({ onFile, accept = 'image/*', active, accentColor, children }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()

  const handleDrop = e => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div
      className={`${s.drop} ${drag ? s.dragOver : ''} ${active ? s.dropActive : ''}`}
      style={active ? { borderColor: (accentColor || 'var(--green)') + '55' } : {}}
      onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <input ref={ref} type="file" accept={accept} hidden
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = '' }} />
      {children}
    </div>
  )
}

// ── Capacity Bar ─────────────────────────────────────────────────────────────
export function CapBar({ used, total }) {
  const pct   = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const color = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--amber)' : 'var(--green)'
  return (
    <div className={s.cap}>
      <div className={s.capRow}>
        <span>PAYLOAD</span>
        <span style={{ color }}>{Math.round(pct)}% — {used.toLocaleString()} / {total.toLocaleString()} chars</span>
      </div>
      <div className={s.capTrack}>
        <div className={s.capFill} style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}66` }} />
      </div>
    </div>
  )
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, color = 'var(--green)' }) {
  return (
    <span className={s.tag} style={{ color, borderColor: color + '50', background: color + '12' }}>
      {children}
    </span>
  )
}

// ── ImagePreview ─────────────────────────────────────────────────────────────
export function ImgPreview({ src, tags = [], onClear }) {
  return (
    <div className={s.imgWrap}>
      <img src={src} alt="" className={s.img} />
      {onClear && (
        <button className={s.clearBtn} onClick={e => { e.stopPropagation(); onClear() }} title="Remove image">✕</button>
      )}
      {tags.length > 0 && (
        <div className={s.imgMeta}>{tags.map((t, i) => <span key={i} className={s.imgTag}>{t}</span>)}</div>
      )}
    </div>
  )
}

// ── DropPlaceholder ───────────────────────────────────────────────────────────
export function DropPH({ title, sub, color = 'var(--green)' }) {
  return (
    <div className={s.dropPH}>
      <span className={s.dropHex}>⬡</span>
      <span className={s.dropTitle} style={{ color }}>{title}</span>
      <span className={s.dropSub}>{sub}</span>
    </div>
  )
}

// ── StepList ─────────────────────────────────────────────────────────────────
export function Steps({ items, color = 'var(--green)' }) {
  return (
    <div className={s.steps}>
      {items.map(([n, t], i) => (
        <div key={i} className={s.step}>
          <span className={s.stepN} style={{ color, borderColor: color + '45' }}>{n}</span>
          <span className={s.stepT} dangerouslySetInnerHTML={{ __html: t }} />
        </div>
      ))}
    </div>
  )
}

// ── PassField ────────────────────────────────────────────────────────────────
export function PassField({ value, onChange, placeholder, focusColor = 'var(--amber)' }) {
  const [show, setShow] = useState(false)
  return (
    <div className={s.passRow} style={{ '--fc': focusColor }}>
      <input
        type={show ? 'text' : 'password'}
        className={s.passInput}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button className={s.eye} onClick={() => setShow(p => !p)}>{show ? '◉' : '○'}</button>
    </div>
  )
}

// ── InfoGrid ─────────────────────────────────────────────────────────────────
export function InfoGrid({ rows }) {
  return (
    <div className={s.infoGrid}>
      {rows.map(([k, v, vc]) => (
        <div key={k} className={s.infoRow}>
          <span className={s.infoK}>{k}</span>
          <span className={s.infoV} style={vc ? { color: vc } : {}}>{v}</span>
        </div>
      ))}
    </div>
  )
}
