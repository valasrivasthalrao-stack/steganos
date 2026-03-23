import React, { useState } from 'react'
import Header from './components/Header'
import EncodeScreen from './components/EncodeScreen'
import DecodeScreen from './components/DecodeScreen'
import AboutScreen from './components/AboutScreen'
import s from './App.module.css'

export default function App() {
  const [tab, setTab] = useState('encode')
  return (
    <div className={s.app}>
      <Header tab={tab} onTab={setTab} />
      <main className={s.main}>
        {tab === 'encode' && <EncodeScreen />}
        {tab === 'decode' && <DecodeScreen />}
        {tab === 'about'  && <AboutScreen />}
      </main>
      <footer className={s.footer}>
        <span>STEGANOS — Spring Boot 3.2 + React 18 · MIT License · All processing local</span>
        <span style={{ color: 'var(--purple)' }}>LSB · XOR · JAVA AWT · CANVAS API</span>
      </footer>
    </div>
  )
}
