import React, { useEffect, useState } from 'react'
import { healthCheck } from '../utils/api'
import s from './Header.module.css'

const TABS = [
  { id: 'encode', label: '⬛ ENCODE', sub: 'Hide message' },
  { id: 'decode', label: '⬜ DECODE', sub: 'Extract message' },
  { id: 'about',  label: '◈ ABOUT',  sub: 'How it works' },
]

export default function Header({ tab, onTab }) {
  const [api, setApi] = useState('checking')

  useEffect(() => {
    healthCheck().then(() => setApi('up')).catch(() => setApi('down'))
  }, [])

  const apiLabel = { checking: 'CONNECTING…', up: 'API CONNECTED', down: 'API OFFLINE — START BACKEND' }
  const apiColor = { checking: 'var(--amber)', up: 'var(--green)', down: 'var(--red)' }

  return (
    <header className={s.header}>
      <div className={s.brand}>
        <div className={s.logo}>
          STEG<span className={s.acc}>ANOS</span>
          <span className={s.glitch} aria-hidden>STEGANOS</span>
        </div>
        <div className={s.sub}>
          <span className={s.dot} style={{ background: apiColor[api] }} />
          <span className={s.subTxt} style={{ color: apiColor[api] }}>{apiLabel[api]}</span>
          <span className={s.divider}>·</span>
          <span className={s.subTxt}>LSB STEGANOGRAPHY</span>
        </div>
      </div>

      <div className={s.pill} style={{ borderColor: apiColor[api] + '45', color: apiColor[api] }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
        <span style={{ fontSize: '.6rem', letterSpacing: '.18em' }}>
          {api === 'up' ? 'SPRING BOOT :8080' : api === 'down' ? 'OFFLINE' : 'CHECKING'}
        </span>
      </div>

      <nav className={s.nav}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${s.tab} ${tab === t.id ? s.tabActive : ''}`}
            onClick={() => onTab(t.id)}>
            <span className={s.tabL}>{t.label}</span>
            <span className={s.tabS}>{t.sub}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}
