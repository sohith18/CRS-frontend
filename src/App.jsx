import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, RefreshCw, ArrowRight } from 'lucide-react'
import { RoomAPI } from './api.js'
import './App.css'

const CONFIG = {
  serverUrl: import.meta.env.VITE_SERVER_URL || 'http://localhost:8000',
}

// ── Decorative orb ─────────────────────────────────────────────────────────
function GlowOrb({ size = 'lg', pulse = false }) {
  const cls = ['orb-wrapper', `orb-${size}`, pulse ? 'orb-pulse' : ''].join(' ')
  return (
    <div className={cls}>
      <div className="orb-glow-bg" />
      <div className="orb-ring" />
      <div className="orb-inner-glow" />
    </div>
  )
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator({ label }) {
  return (
    <div className="msg-row msg-row--ai">
      <div className="msg-avatar"><GlowOrb size="xs" /></div>
      <div className="typing-bubble">
        <span className="typing-dots"><span /><span /><span /></span>
        {label && <span className="typing-label">{label}</span>}
      </div>
    </div>
  )
}

// ── A/B comparison images shown above each question ─────────────────────────
function ComparisonImages({ images, serverUrl }) {
  const [leftErr,  setLeftErr]  = useState(false)
  const [rightErr, setRightErr] = useState(false)
  if (!images) return null

  const src = (urlPath) => `${serverUrl}${urlPath}`

  return (
    <div className="comparison-images">
      <div className="comparison-images__pair">
        <div className="comparison-img-wrap">
          <div className="comparison-img-label">Layout A</div>
          {!leftErr
            ? <img src={src(images.left)}  alt="Layout A"
                   className="comparison-img"
                   onError={() => setLeftErr(true)}
                   loading="lazy" />
            : <div className="comparison-img-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.4" opacity="0.3">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
                <span>No image</span>
              </div>
          }
        </div>

        <div className="comparison-divider">vs</div>

        <div className="comparison-img-wrap">
          <div className="comparison-img-label">Layout B</div>
          {!rightErr
            ? <img src={src(images.right)} alt="Layout B"
                   className="comparison-img"
                   onError={() => setRightErr(true)}
                   loading="lazy" />
            : <div className="comparison-img-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.4" opacity="0.3">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
                <span>No image</span>
              </div>
          }
        </div>
      </div>
    </div>
  )
}

// ── Single chat message ─────────────────────────────────────────────────────
function Message({ msg, serverUrl }) {
  if (msg.role === 'system') {
    if (msg.type === 'result') return <ResultPanel results={msg.results} serverUrl={serverUrl} />
    if (msg.type === 'info')   return <div className="msg-info">{msg.content}</div>
    if (msg.type === 'error')  return <div className="msg-error"><span>⚠</span>{msg.content}</div>
    return null
  }

  const isUser = msg.role === 'user'

  return (
    <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--ai'}`}>
      {!isUser && <div className="msg-avatar"><GlowOrb size="xs" /></div>}

      <div className={`msg-bubble-col ${isUser ? 'msg-bubble-col--user' : ''}`}>
        {/* Comparison images sit above the question bubble (AI only) */}
        {!isUser && msg.comparisonImages && (
          <ComparisonImages images={msg.comparisonImages} serverUrl={serverUrl} />
        )}
        <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--ai'}`}>
          {msg.phase && (
            <div className="msg-phase">
              Phase {msg.phase} · Turn {msg.turn}
              {msg.remaining != null && <> · {msg.remaining} layouts left</>}
            </div>
          )}
          <p>{msg.content}</p>
        </div>
      </div>

      {isUser && <div className="msg-avatar-user">{msg.initials}</div>}
    </div>
  )
}

// ── Final result panel — all surviving layouts ─────────────────────────────
function ResultPanel({ results, serverUrl }) {
  if (!results || results.length === 0) return null
  return (
    <div className="result-panel">
      <div className="result-panel__header">
        <div className="result-badge">✦ Recommended Layouts</div>
        <span className="result-count">
          {results.length} match{results.length !== 1 ? 'es' : ''}
        </span>
      </div>
      <div className="result-panel__grid">
        {results.map((layout, idx) => (
          <ResultCard key={layout.id} layout={layout} rank={idx + 1} serverUrl={serverUrl} />
        ))}
      </div>
    </div>
  )
}

// ── Single result card ─────────────────────────────────────────────────────
function ResultCard({ layout, rank, serverUrl }) {
  const [imgError, setImgError] = useState(false)

  const imgUrl = layout.image_url
    ? `${serverUrl}${layout.image_url}`
    : layout.image_path
    ? `${serverUrl}/image/${encodeURIComponent(layout.image_path)}`
    : null

  return (
    <div className="result-card-item">
      <div className="result-card-item__header">
        <span className="result-card-item__rank">#{rank}</span>
        <span className="result-id">{layout.id}</span>
      </div>
      {!imgError && imgUrl ? (
        <div className="result-card-item__img-wrap">
          <img
            src={imgUrl}
            alt={`Layout ${layout.id}`}
            className="result-card-item__img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="result-card-item__placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.4" opacity="0.3">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          <span>{layout.image_path || 'No image'}</span>
        </div>
      )}
    </div>
  )
}

// ── Welcome / start screen ─────────────────────────────────────────────────
function WelcomeScreen({ onStart }) {
  const [furniture, setFurniture] = useState('')
  const [focused,   setFocused]   = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 400) }, [])

  const canStart     = furniture.trim().length > 0
  const handleSubmit = () => { if (canStart) onStart(furniture.trim()) }
  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }

  return (
    <div className="welcome">
      <div className="welcome__ambient" />
      <div className="welcome__orb"><GlowOrb size="lg" /></div>

      <div className="welcome__text">
        <h1>Room Layout AI</h1>
        <p>Describe the furniture you need and I'll find your perfect layout.</p>
      </div>

      <div className={`welcome__field ${focused ? 'welcome__field--focused' : ''} ${canStart ? 'welcome__field--filled' : ''}`}>
        <div className="welcome__field-inner">
          <div className="welcome__field-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            className="welcome__input"
            placeholder="bed, desk, wardrobe…"
            value={furniture}
            onChange={e => setFurniture(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            className={`welcome__go ${canStart ? 'welcome__go--active' : ''}`}
            onClick={handleSubmit}
            disabled={!canStart}
            aria-label="Start"
          >
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="welcome__field-glow" />
      </div>

      <p className="welcome__hint">
        Separate items with commas · Press <kbd>Enter</kbd> to start
      </p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main App
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [messages,       setMessages]       = useState([])
  const [inputValue,     setInputValue]     = useState('')
  const [appState,       setAppState]       = useState('welcome')
  const [sessionStatus,  setSessionStatus]  = useState('idle')
  const [isTyping,       setIsTyping]       = useState(false)
  const [typingLabel,    setTypingLabel]    = useState('')
  const [canSubmit,      setCanSubmit]      = useState(false)
  const [chosenFurniture,setChosenFurniture]= useState('')

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const pollingRef     = useRef(null)
  const lastTurnRef    = useRef(0)
  const apiRef         = useRef(new RoomAPI(CONFIG.serverUrl))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addMsg = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }])
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
  }, [])

  // ── Poll handler ──────────────────────────────────────────────────────────
  const handlePollData = useCallback((data) => {
    const s = data.status

    if (s === 'waiting') {
      setIsTyping(false)
      if (data.turn > lastTurnRef.current) {
        lastTurnRef.current = data.turn
        setCanSubmit(true)
        setSessionStatus('waiting')
        addMsg({
          role:             'ai',
          content:          data.question,
          phase:            data.phase,
          turn:             data.turn,
          remaining:        data.remaining_count,
          comparisonImages: data.comparison_images || null,  // images always passed now
        })
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } else if (s === 'initializing') {
      setIsTyping(true)
      setTypingLabel('Initializing engine…')
      setSessionStatus('initializing')
    } else if (s === 'processing') {
      setIsTyping(true)
      setTypingLabel('Analyzing your preference…')
      setCanSubmit(false)
      setSessionStatus('processing')
    } else if (s === 'done') {
      stopPolling()
      setIsTyping(false)
      setCanSubmit(false)
      setSessionStatus('done')
      setAppState('done')

      const results = Array.isArray(data.result)
        ? data.result
        : (data.result ? [data.result] : [])

      addMsg({
        role:    'ai',
        content: results.length === 1
          ? '✦ Found your perfect layout!'
          : `✦ Found ${results.length} layouts that match your preferences!`,
      })
      addMsg({ role: 'system', type: 'result', results })
    } else if (s === 'error') {
      stopPolling()
      setIsTyping(false)
      setCanSubmit(false)
      setSessionStatus('error')
      setAppState('error')
      addMsg({ role: 'system', type: 'error', content: data.error || 'An unexpected error occurred.' })
    }
  }, [addMsg, stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    pollingRef.current = setInterval(async () => {
      try { handlePollData(await apiRef.current.getQuestion()) } catch { /* network hiccup */ }
    }, 1500)
  }, [stopPolling, handlePollData])

  // ── Start — furniture is local only, NOT sent to backend ─────────────────
  const startSession = useCallback(async (furniture) => {
    setChosenFurniture(furniture)
    setAppState('chat')
    setSessionStatus('starting')
    setIsTyping(true)
    setTypingLabel('Connecting to server…')
    lastTurnRef.current = 0

    addMsg({ role: 'system', type: 'info', content: `Furniture preference noted: ${furniture}` })

    try {
      await apiRef.current.start({})
      setTypingLabel('Loading room layouts…')
      startPolling()
    } catch (err) {
      setIsTyping(false)
      setSessionStatus('error')
      setAppState('error')
      addMsg({ role: 'system', type: 'error', content: err.message })
    }
  }, [addMsg, startPolling])

  // ── Submit answer ─────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async () => {
    const answer = inputValue.trim()
    if (!answer || sessionStatus !== 'waiting') return

    setInputValue('')
    setCanSubmit(false)
    addMsg({ role: 'user', content: answer, initials: 'U' })

    try {
      await apiRef.current.submitAnswer(answer)
      setIsTyping(true)
      setTypingLabel('Processing your answer…')
      setSessionStatus('processing')
    } catch (err) {
      addMsg({ role: 'system', type: 'error', content: err.message })
    }
  }, [inputValue, sessionStatus, addMsg])

  const handleSend    = () => { if (sessionStatus === 'waiting') submitAnswer() }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleReset = useCallback(async () => {
    stopPolling()
    try { await apiRef.current.reset() } catch { /* ignore */ }
    setMessages([])
    setAppState('welcome')
    setSessionStatus('idle')
    setIsTyping(false)
    setCanSubmit(false)
    setInputValue('')
    setChosenFurniture('')
    lastTurnRef.current = 0
  }, [stopPolling])

  const isInputDisabled = sessionStatus !== 'waiting'
  const sendDisabled    = !inputValue.trim() || isInputDisabled

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <GlowOrb size="xxs" />
          <span className="app-header__title">Room Layout AI</span>
        </div>
        <div className="app-header__right">
          {appState !== 'welcome' && (
            <button className="icon-btn" onClick={handleReset} title="Start over">
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {appState === 'welcome' ? (
          <WelcomeScreen onStart={startSession} />
        ) : (
          <div className="chat">
            <div className="chat__messages">
              {messages.length === 0 && (
                <div className="chat__empty">
                  <GlowOrb size="sm" />
                  <p>Starting your recommendation session…</p>
                </div>
              )}
              {messages.map(msg => (
                <Message key={msg.id} msg={msg} serverUrl={CONFIG.serverUrl} />
              ))}
              {isTyping && <TypingIndicator label={typingLabel} />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {appState !== 'welcome' && (
        <div className="input-bar">
          <div className={`input-wrap ${isInputDisabled ? 'input-wrap--disabled' : ''}`}>
            <textarea
              ref={inputRef}
              className="input-field"
              placeholder={
                sessionStatus === 'waiting'
                  ? 'Type your answer…'
                  : sessionStatus === 'done'
                  ? 'Session complete — press ↺ to start again'
                  : 'Waiting for AI…'
              }
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isInputDisabled}
              rows={1}
            />
            <button
              className={`send-btn ${!sendDisabled ? 'send-btn--active' : ''}`}
              onClick={handleSend}
              disabled={sendDisabled}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="input-hint">
            {chosenFurniture && sessionStatus !== 'done' && (
              <span className="hint-furniture">Furniture: {chosenFurniture}</span>
            )}
            {sessionStatus === 'waiting' && (
              <><span className="hint-dot hint-dot--green" />Waiting for your answer</>
            )}
            {['initializing', 'processing', 'starting'].includes(sessionStatus) && (
              <><span className="hint-dot hint-dot--amber" />AI is thinking…</>
            )}
            {sessionStatus === 'done' && (
              <><span className="hint-dot hint-dot--blue" />Session complete</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}