import React, { useState, useCallback } from 'react'
import {
  Panel, Btn, Alert, DropZone, Tag,
  ImgPreview, DropPH, Steps, PassField
} from './UI'
import { decodeMessage } from '../utils/api'
import s from './DecodeScreen.module.css'

export default function DecodeScreen() {
  const [img,     setImg]     = useState(null)
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState(null)
  const [decoded, setDecoded] = useState(null)   // { text, charCount, wasEncrypted }
  const [copied,  setCopied]  = useState(false)

  const handleFile = useCallback(file => {
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', msg: 'Please select a valid image file.' }); return
    }
    setStatus(null); setDecoded(null)
    setImg({ file, url: URL.createObjectURL(file) })
  }, [])

  const clearImg = () => {
    if (img?.url) URL.revokeObjectURL(img.url)
    setImg(null); setDecoded(null); setStatus(null)
  }

  const doDecode = async () => {
    if (!img) return
    setLoading(true); setStatus(null); setDecoded(null)
    try {
      const r = await decodeMessage(img.file, pass)
      setDecoded({ text: r.hiddenText, charCount: r.charCount, wasEncrypted: r.wasEncrypted })
      setStatus({ type: 'success',
        msg: `✓ Spring Boot extracted ${r.charCount.toLocaleString()} chars${r.wasEncrypted ? ' (decrypted)' : ''}.` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  const copyText = async () => {
    if (!decoded) return
    await navigator.clipboard.writeText(decoded.text)
    setCopied(true); setTimeout(() => setCopied(false), 2200)
  }

  const downloadTxt = () => {
    if (!decoded) return
    const url = URL.createObjectURL(new Blob([decoded.text], { type: 'text/plain' }))
    const a   = Object.assign(document.createElement('a'),
                  { href: url, download: `steganos_${Date.now()}.txt` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const clear = () => { clearImg(); setPass(''); setStatus(null); setDecoded(null) }

  return (
    <div className={s.layout}>

      {/* ── LEFT ── */}
      <div className={s.col}>
        <Panel label="Stego Image" icon="⬜" color="var(--purple)" delay={0}>
          <DropZone onFile={handleFile} active={!!img} accentColor="var(--purple)">
            {img
              ? <ImgPreview src={img.url} onClear={clearImg}
                  tags={[img.file.name, 'Click to change']} />
              : <DropPH title="DROP STEGO IMAGE" color="var(--purple)"
                  sub="Must be STEGANOS-encoded PNG — JPEG destroys LSB data" />
            }
          </DropZone>
        </Panel>

        <Panel label="Passkey" icon="◈" color="var(--amber)" delay={0.06}>
          <PassField value={pass} onChange={setPass}
            placeholder="Enter key if message was encrypted (leave blank otherwise)" />
          <p className={s.hint}>
            Decryption is performed server-side by Spring Boot (Java XOR cipher).
            Wrong key → garbled output → API returns an error.
          </p>
        </Panel>

        <div className={s.actions}>
          <Btn variant="purple" onClick={doDecode}
            disabled={!img || loading} loading={loading}>
            ⬜ EXTRACT VIA API
          </Btn>
          <Btn variant="ghost" onClick={clear} disabled={loading}>CLEAR</Btn>
        </div>

        {status && <Alert type={status.type}>{status.msg}</Alert>}

        {/* API flow */}
        <Panel label="Backend Flow" icon="◉" color="var(--purple)" delay={0.12}
          className={s.flowPanel}>
          <Steps color="var(--purple)" items={[
            ['01', 'React POSTs stego image + passkey to <code>/api/steg/decode</code>'],
            ['02', 'Spring Boot reads pixel LSBs using <strong>Java AWT</strong>'],
            ['03', 'Reads 32-bit length header → reconstructs payload bytes'],
            ['04', 'Verifies <code>STGNS::</code> signature, decrypts if passkey given'],
            ['05', 'Returns extracted message as <strong>JSON</strong>'],
          ]} />
        </Panel>
      </div>

      {/* ── RIGHT ── */}
      <div className={s.col}>
        <Panel label="Extracted Message" icon="◉" color="var(--purple)" delay={0.04}>
          {decoded ? (
            <div className={s.decodedSection}>
              <div className={s.decodedMeta}>
                <Tag color="var(--purple)">{decoded.charCount.toLocaleString()} chars</Tag>
                {decoded.wasEncrypted && <Tag color="var(--amber)">DECRYPTED</Tag>}
                <Tag color="var(--green)">STGNS:: VERIFIED</Tag>
                <Tag color="var(--muted)">FROM SPRING BOOT</Tag>
              </div>
              <div className={s.decodedBox}>
                <pre className={s.decodedText}>{decoded.text}</pre>
              </div>
              <div className={s.outputActions}>
                <Btn variant="ghostP" onClick={copyText}>
                  {copied ? '✓ COPIED!' : 'COPY TEXT'}
                </Btn>
                <Btn variant="ghostP" onClick={downloadTxt}>DOWNLOAD .TXT</Btn>
              </div>
            </div>
          ) : (
            <div className={s.empty}>
              <span className={s.emptyIcon}>⬜</span>
              <span className={s.emptyTitle}>AWAITING EXTRACTION</span>
              <span className={s.emptyBody}>
                Drop a STEGANOS-encoded PNG, optionally enter the passkey,
                then click Extract Via API.
              </span>
              <Steps color="var(--purple)" items={[
                ['01', 'Drop a STEGANOS PNG'],
                ['02', 'Enter passkey if encrypted'],
                ['03', 'Click Extract Via API'],
              ]} />
            </div>
          )}
        </Panel>

        {/* Warnings */}
        <Panel label="Important Notes" icon="⚠" color="var(--red)" delay={0.10}
          className={s.warnPanel}>
          {[
            ['var(--red)',    '✕ JPEG KILLS DATA',
              'The stego file must remain PNG. Re-saving as JPEG permanently destroys all LSB data.'],
            ['var(--green)',  '✓ PRIVACY',
              'Files are POSTed to your local Spring Boot server only. Nothing reaches the internet.'],
            ['var(--amber)', '⚠ WRONG KEY',
              'Incorrect passkey produces non-printable bytes. The API detects this and returns an error.'],
          ].map(([c, t, b]) => (
            <div key={t} className={s.note} style={{ borderColor: c + '30' }}>
              <strong style={{ color: c }}>{t}</strong> {b}
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
