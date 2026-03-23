import React, { useState, useCallback } from 'react'
import {
  Panel, Btn, Alert, CapBar, DropZone, Tag,
  ImgPreview, DropPH, Steps, PassField, InfoGrid
} from './UI'
import { checkCapacity, encodeMessage, downloadBase64Png } from '../utils/api'
import s from './EncodeScreen.module.css'

export default function EncodeScreen() {
  const [img,     setImg]     = useState(null)   // { file, url, w, h, cap, size, fmt }
  const [msg,     setMsg]     = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState(null)

  const cap    = img?.cap || 0
  const canEnc = !!img && msg.trim().length > 0 && !loading

  // ── Load image → capacity check via API ──────────────────────────────────
  const handleFile = useCallback(async file => {
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', msg: 'Please select a valid image (PNG, JPG, WEBP, BMP).' })
      return
    }
    setStatus(null)
    const url = URL.createObjectURL(file)
    setImg({ file, url, w: '…', h: '…', cap: 0, size: file.size, fmt: '…' })

    try {
      const r = await checkCapacity(file)
      setImg({ file, url, w: r.width, h: r.height, cap: r.capacityChars,
               size: r.fileSizeBytes, fmt: r.imageFormat })
      setStatus({ type: 'success',
        msg: `✓ Image loaded — ${r.width}×${r.height}px · capacity ~${r.capacityChars.toLocaleString()} chars` })
    } catch (e) {
      setStatus({ type: 'error', msg: 'Capacity check failed: ' + e.message })
    }
  }, [])

  const clearImg = () => {
    if (img?.url) URL.revokeObjectURL(img.url)
    setImg(null); setStatus(null)
  }

  // ── Encode via Spring Boot ────────────────────────────────────────────────
  const doEncode = async () => {
    if (!canEnc) return
    setLoading(true); setStatus(null)
    try {
      const r = await encodeMessage(img.file, msg, pass)
      downloadBase64Png(r.imageBase64, r.filename)
      setStatus({ type: 'success',
        msg: `✓ Spring Boot encoded ${r.usedChars.toLocaleString()} chars into ` +
             `${r.originalWidth}×${r.originalHeight}px PNG — downloading!` })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  const clear = () => { clearImg(); setMsg(''); setPass(''); setStatus(null) }

  return (
    <div className={s.layout}>

      {/* ── LEFT ── */}
      <div className={s.col}>
        <Panel label="Carrier Image" icon="⬛" color="var(--green)" delay={0}>
          <DropZone onFile={handleFile} active={!!img}>
            {img
              ? <ImgPreview src={img.url} onClear={clearImg}
                  tags={[`${img.w}×${img.h}px`, `~${cap.toLocaleString()} chars max`, img.fmt]} />
              : <DropPH title="DROP IMAGE HERE" sub="PNG · JPG · WEBP · BMP — larger = more capacity" />
            }
          </DropZone>

          {img && cap > 0 && (
            <InfoGrid rows={[
              ['FILE',      img.file.name],
              ['SIZE',      (img.size / 1024).toFixed(1) + ' KB'],
              ['DIMENSIONS',`${img.w} × ${img.h} px`],
              ['CAPACITY',  `~${cap.toLocaleString()} characters`, 'var(--green)'],
            ]} />
          )}
        </Panel>

        {/* API flow */}
        <Panel label="Backend Flow" icon="◉" color="var(--purple)" delay={0.08}
          className={s.flowPanel}>
          <Steps color="var(--purple)" items={[
            ['01', 'React sends <strong>multipart/form-data</strong> POST to <code>/api/steg/encode</code>'],
            ['02', 'Spring Boot reads pixels via <strong>Java AWT ImageIO</strong>'],
            ['03', 'Message bytes optionally <strong>XOR-encrypted</strong> with passkey'],
            ['04', '<code>STGNS::</code> header + 32-bit length embedded into RGB LSBs'],
            ['05', 'Returns <strong>base64 PNG JSON</strong> — React triggers browser download'],
          ]} />
        </Panel>
      </div>

      {/* ── RIGHT ── */}
      <div className={s.col}>
        <Panel label="Secret Message" icon="⬡" color="var(--green)" delay={0.05}>
          <textarea className={s.ta} rows={8}
            placeholder="Type the message to hide inside the image…"
            value={msg} onChange={e => setMsg(e.target.value)} />
          <div className={s.charRow}>
            <span className={s.charCnt}>{msg.length.toLocaleString()} characters</span>
            {msg.length > cap * 0.85 && cap > 0 &&
              <span style={{ color: 'var(--red)', fontSize: '.68rem' }}>⚠ NEAR LIMIT</span>}
          </div>
          {cap > 0 && <CapBar used={msg.length} total={cap} />}
        </Panel>

        <Panel label="Passkey Encryption (Optional)" icon="◈" color="var(--amber)" delay={0.10}>
          <PassField value={pass} onChange={setPass}
            placeholder="XOR encryption key — share separately with recipient" />
          <p className={s.hint}>
            Applied server-side by Spring Boot (Java XOR cipher).
            Leave blank for no encryption. Recipient needs the same key to decode.
          </p>
        </Panel>

        {status && <Alert type={status.type}>{status.msg}</Alert>}

        <div className={s.actions}>
          <Btn variant="green" onClick={doEncode} disabled={!canEnc} loading={loading}>
            ⬛ ENCODE VIA API & DOWNLOAD
          </Btn>
          <Btn variant="ghost" onClick={clear} disabled={loading}>CLEAR</Btn>
        </div>

        <div className={s.apiNote}>
          <span>🖥</span>
          <span>
            All steganography runs on the <strong>Spring Boot backend</strong>.
            The encoded PNG is returned as base64 JSON and downloaded here.
          </span>
        </div>
      </div>
    </div>
  )
}
