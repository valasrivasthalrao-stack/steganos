import React from 'react'
import { Panel, Tag, Steps } from './UI'
import s from './AboutScreen.module.css'

const ENDPOINTS = [
  ['GET',  '/api/steg/health',          'Health probe — returns server status + version'],
  ['POST', '/api/steg/capacity',         'Accepts image → width, height, max capacity chars'],
  ['POST', '/api/steg/encode',           'Image + message + passkey → base64 stego PNG (JSON)'],
  ['POST', '/api/steg/encode/download',  'Same as encode but returns raw PNG binary'],
  ['POST', '/api/steg/decode',           'Stego image + passkey → extracted message (JSON)'],
]

const TECH = [
  ['Spring Boot 3.2',   'REST framework',        'var(--purple)'],
  ['Java 17',           'Runtime',               'var(--purple)'],
  ['Java AWT ImageIO',  'PNG pixel read/write',  'var(--purple)'],
  ['Lombok',            'Boilerplate reduction',  'var(--muted)'],
  ['Maven',             'Build system',           'var(--muted)'],
  ['React 18',          'Frontend UI',            'var(--green)'],
  ['Vite 5',            'Dev server + bundler',   'var(--green)'],
  ['CSS Modules',       'Scoped component styles','var(--green)'],
  ['Vite Proxy',        '/api → :8080 in dev',   'var(--green)'],
]

const CAP = [
  ['640×480',   '307,200',   '~115,200'],
  ['1280×720',  '921,600',   '~345,600'],
  ['1920×1080', '2,073,600', '~777,600'],
  ['3840×2160', '8,294,400', '~3,110,400'],
]

export default function AboutScreen() {
  return (
    <div className={s.wrap}>

      {/* Hero */}
      <div className={`${s.hero} fu`}>
        <div className={s.heroLogo}>STEG<span style={{ color: 'var(--green)' }}>ANOS</span></div>
        <div className={s.heroSub}>Full-Stack LSB Image Steganography · React 18 + Spring Boot 3.2</div>
        <div className={s.heroBadges}>
          {[
            ['LSB Algorithm','var(--green)'],['XOR Encryption','var(--amber)'],
            ['Spring Boot 3.2','var(--purple)'],['Java 17','var(--purple)'],
            ['React 18','var(--green)'],['Zero Uploads','var(--muted)'],
          ].map(([t,c]) => <Tag key={t} color={c}>{t}</Tag>)}
        </div>
      </div>

      {/* Architecture diagram */}
      <div className={`fu1`}>
        <Panel label="Architecture" icon="◉" color="var(--purple)">
          <div className={s.arch}>
            <div className={s.archBox} style={{ borderColor: 'rgba(0,255,157,.3)' }}>
              <div className={s.archTitle} style={{ color: 'var(--green)' }}>FRONTEND · :3000</div>
              <div className={s.archSub}>React 18 · Vite · CSS Modules</div>
              <div className={s.archChips}>
                {['EncodeScreen','DecodeScreen','AboutScreen','api.js','UI.jsx','Header','CapBar','DropZone']
                  .map(c => <span key={c} className={s.chip}>{c}</span>)}
              </div>
            </div>
            <div className={s.archArrow}>
              <div className={s.arrowLine} />
              <div className={s.arrowLabel}>HTTP<br/>multipart + JSON</div>
              <div className={s.arrowLine} />
            </div>
            <div className={s.archBox} style={{ borderColor: 'rgba(139,92,246,.3)' }}>
              <div className={s.archTitle} style={{ color: 'var(--purple)' }}>BACKEND · :8080</div>
              <div className={s.archSub}>Spring Boot 3.2 · Java 17 · Maven</div>
              <div className={s.archChips}>
                {['SteganoController','SteganographyService','CorsConfig',
                  'GlobalExceptionHandler','Java AWT ImageIO','XOR Cipher','LSB Encode','LSB Decode']
                  .map(c => <span key={c} className={s.chip}>{c}</span>)}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className={s.grid}>

        {/* Endpoints */}
        <Panel label="REST API Endpoints" icon="⬡" color="var(--green)" delay={0.05} className={`fu2`}>
          <div className={s.eps}>
            {ENDPOINTS.map(([m, p, d]) => (
              <div key={p} className={s.ep}>
                <span className={s.method}
                  style={{
                    color:        m === 'GET' ? 'var(--green)' : 'var(--purple)',
                    borderColor:  m === 'GET' ? 'rgba(0,255,157,.35)' : 'rgba(139,92,246,.35)',
                    background:   m === 'GET' ? 'rgba(0,255,157,.08)' : 'rgba(139,92,246,.08)',
                  }}>
                  {m}
                </span>
                <div>
                  <div className={s.epPath}>{p}</div>
                  <div className={s.epDesc}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* LSB steps */}
        <Panel label="LSB Algorithm (Backend)" icon="⬛" color="var(--green)" delay={0.08} className={`fu2`}>
          <Steps color="var(--green)" items={[
            ['01', '<strong>ImageIO.read()</strong> loads carrier into BufferedImage (ARGB)'],
            ['02', 'Message bytes optionally <strong>XOR-encrypted</strong> with passkey'],
            ['03', '<code>STGNS::</code> header + payload bytes combined'],
            ['04', '32-bit big-endian length header written first'],
            ['05', 'Each bit stored in <strong>R/G/B LSB</strong> of pixels in raster order'],
            ['06', 'Modified image serialised back to <strong>lossless PNG → base64 JSON</strong>'],
          ]} />
        </Panel>

        {/* Tech stack */}
        <Panel label="Tech Stack" icon="◈" color="var(--amber)" delay={0.10} className={`fu3`}>
          <div className={s.techGrid}>
            {TECH.map(([n, d, c]) => (
              <div key={n} className={s.techRow}>
                <span style={{ color: c, fontSize: '.74rem', fontWeight: 700 }}>{n}</span>
                <span className={s.techDesc}>{d}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Capacity */}
        <Panel label="Capacity Formula" icon="⬡" color="var(--purple)" delay={0.12} className={`fu3`}>
          <div className={s.formula}>max_chars = ⌊ (W × H × 3 − 32) ÷ 8 ⌋</div>
          <table className={s.table}>
            <thead><tr><th>Resolution</th><th>Pixels</th><th>Max Chars</th></tr></thead>
            <tbody>
              {CAP.map(([r, p, c]) => (
                <tr key={r}>
                  <td>{r}</td><td>{p}</td>
                  <td style={{ color: 'var(--purple)' }}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Security */}
        <Panel label="Security Notes" icon="◈" color="var(--red)" delay={0.14}
          className={`fu4 ${s.fullCol}`}>
          <div className={s.secGrid}>
            {[
              ['✓','var(--green)','CORS locked to localhost — no cross-origin exposure'],
              ['✓','var(--green)','File size capped at 50 MB server-side'],
              ['✓','var(--green)','MIME type validated before processing'],
              ['✓','var(--green)','All image processing in-memory — no temp files on disk'],
              ['✓','var(--green)','Printability check prevents wrong-key silent failures'],
              ['⚠','var(--amber)','XOR is not AES — use for casual privacy; encrypt externally for high security'],
              ['⚠','var(--amber)','Never expose port 8080 publicly without auth'],
              ['⚠','var(--red)',  'JPEG recompression permanently destroys LSB payload — always use PNG'],
            ].map(([i, c, t]) => (
              <div key={t} className={s.secRow}>
                <span style={{ color: c, flexShrink: 0, fontWeight: 700 }}>{i}</span>
                <span style={{ fontSize: '.75rem', color: 'var(--text)', lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className={s.footer}>
        STEGANOS Full-Stack · Spring Boot 3.2 + React 18 · MIT License · All processing is local
      </div>
    </div>
  )
}
