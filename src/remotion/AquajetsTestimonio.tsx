import {
  AbsoluteFill,
  Video,
  interpolate,
  spring,
  useCurrentFrame,
  staticFile,
} from 'remotion'

const FPS = 30
const s   = (sec: number) => sec * FPS

const MAGENTA = '#c026a8'
const WHITE   = '#ffffff'
const BLACK   = '#000000'

// ── Animación helpers ────────────────────────────────────────────────────────

function opacity(frame: number, inF: number, outF: number, fadeLen = 10) {
  return (
    interpolate(frame, [inF, inF + fadeLen], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) *
    interpolate(frame, [outF - fadeLen, outF],  [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  )
}

function slideY(frame: number, startF: number, fromPx = 40) {
  const p = spring({ frame: frame - startF, fps: FPS, config: { damping: 16, stiffness: 200 }, durationInFrames: 18 })
  return interpolate(p, [0, 1], [fromPx, 0])
}

function popScale(frame: number, startF: number) {
  return spring({ frame: frame - startF, fps: FPS, config: { damping: 12, stiffness: 180 }, durationInFrames: 20 })
}

// ── Gradiente inferior ───────────────────────────────────────────────────────

const Gradient = () => (
  <AbsoluteFill style={{
    background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 45%, transparent 75%)',
    pointerEvents: 'none',
  }} />
)

// ── OVERLAY 1: 0–7s — "100K en 30 días · Sin tocar el teléfono" ──────────────

const Apertura = ({ frame }: { frame: number }) => {
  const inF = s(0), outF = s(7)
  if (frame < inF || frame > outF) return null
  const op = opacity(frame, inF, outF)
  const y  = slideY(frame, inF)

  return (
    <div style={{
      position:  'absolute',
      bottom:    180,
      left:      60,
      opacity:   op,
      transform: `translateY(${y}px)`,
    }}>
      {/* Número grande */}
      <div style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize:   120,
        fontWeight: 900,
        color:      MAGENTA,
        lineHeight: 1,
        textShadow: '0 2px 30px rgba(192,38,168,0.5)',
      }}>
        100K $
      </div>
      {/* Línea magenta */}
      <div style={{ width: 80, height: 4, backgroundColor: MAGENTA, borderRadius: 2, margin: '12px 0 16px' }} />
      {/* Subtexto */}
      <div style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize:   44,
        fontWeight: 700,
        color:      WHITE,
        lineHeight: 1.2,
        textShadow: '0 2px 16px rgba(0,0,0,0.7)',
      }}>
        en 30 días
      </div>
      <div style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize:   38,
        fontWeight: 400,
        color:      'rgba(255,255,255,0.85)',
        marginTop:  8,
        textShadow: '0 2px 16px rgba(0,0,0,0.7)',
      }}>
        sin tocar el teléfono
      </div>
    </div>
  )
}

// ── OVERLAY 2B: 13.30–16.30s — Calendario hojas arrancadas ──────────────────

const HOJAS = [
  { dia: 'VIERNES',  hora: '23:47 🌙' },
  { dia: 'SÁBADO',   hora: '22:15 🌙' },
  { dia: 'DOMINGO',  hora: '14:30 🌙' },
  { dia: 'LUNES',    hora: '23:01 🌙' },
  { dia: 'MARTES',   hora: '11:52 PM 🌙' },
]

const Calendario = ({ frame }: { frame: number }) => {
  const inF  = s(13.15)
  const outF = s(16.3)
  if (frame < inF || frame > outF) return null

  const totalFrames = outF - inF                       // 90f = 3s
  const framesPerHoja = totalFrames / HOJAS.length     // 18f cada hoja
  const localFrame = frame - inF

  const hojaIdx    = Math.floor(localFrame / framesPerHoja)
  const hojaLocal  = localFrame - hojaIdx * framesPerHoja  // 0-18 dentro de la hoja actual

  const TEAR_START = 10   // frames de visibilidad antes de arrancar
  const TEAR_DUR   = 8    // frames que dura el arranque

  // Hoja actual: se arranca hacia arriba
  const tearProgress = hojaLocal >= TEAR_START
    ? interpolate(hojaLocal, [TEAR_START, TEAR_START + TEAR_DUR], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 0

  const currentY      = interpolate(tearProgress, [0, 1], [0, -320])
  const currentRot    = interpolate(tearProgress, [0, 1], [0, -8])
  const currentOp     = interpolate(tearProgress, [0, 1], [1, 0])

  // Hoja siguiente: sube desde abajo mientras la actual se arranca
  const nextIdx = hojaIdx + 1
  const nextOp  = interpolate(tearProgress, [0, 1], [0, 1])
  const nextY   = interpolate(tearProgress, [0, 1], [60, 0])

  // Entrada general del widget
  const widgetOp = interpolate(frame, [inF, inF + 8, outF - 8, outF], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  const CardStyle: React.CSSProperties = {
    position:        'absolute',
    width:           420,
    borderRadius:    16,
    overflow:        'hidden',
    boxShadow:       '0 12px 40px rgba(0,0,0,0.6)',
    backgroundColor: '#fafafa',
  }

  const renderHoja = (idx: number, extraStyle: React.CSSProperties) => {
    if (idx >= HOJAS.length) return null
    const { dia, hora } = HOJAS[idx]
    return (
      <div style={{ ...CardStyle, ...extraStyle }}>
        {/* Argolla roja */}
        <div style={{
          backgroundColor: '#e02020',
          height:          28,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             16,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 18, height: 18,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.5)',
              backgroundColor: 'rgba(255,255,255,0.2)',
            }}/>
          ))}
        </div>
        {/* Contenido */}
        <div style={{
          padding:   '20px 24px 22px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily:  'system-ui, sans-serif',
            fontSize:    52,
            fontWeight:  900,
            color:       '#1a1a1a',
            letterSpacing: 2,
            lineHeight:  1,
            marginBottom: 10,
          }}>
            {dia}
          </div>
          <div style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize:   28,
            fontWeight: 500,
            color:      '#555',
          }}>
            {hora}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position:  'absolute',
      bottom:    180,
      left:      '50%',
      transform: 'translateX(-50%)',
      opacity:   widgetOp,
    }}>
      {/* Sombra base */}
      <div style={{ position: 'relative', width: 420, height: 180 }}>
        {/* Hoja siguiente (debajo) */}
        {nextIdx < HOJAS.length && renderHoja(nextIdx, {
          top:       0,
          left:      0,
          opacity:   nextOp,
          transform: `translateY(${nextY}px)`,
        })}
        {/* Hoja actual (encima, se arranca) */}
        {renderHoja(hojaIdx, {
          top:       0,
          left:      0,
          opacity:   currentOp,
          transform: `translateY(${currentY}px) rotate(${currentRot}deg)`,
          transformOrigin: 'center bottom',
        })}
      </div>
    </div>
  )
}

// ── OVERLAY 2: 13–18s — Banderas de idiomas ──────────────────────────────────

const Banderas = ({ frame }: { frame: number }) => {
  const inF = s(16.3), outF = s(18)
  if (frame < inF || frame > outF) return null

  const banderas = ['🇪🇸', '🇺🇸', '🇮🇹', '🇫🇷']

  return (
    <div style={{
      position:       'absolute',
      top:            160,
      left:           0,
      right:          0,
      display:        'flex',
      justifyContent: 'center',
      gap:            28,
    }}>
      {banderas.map((flag, i) => {
        const sc = popScale(frame, inF + i * 5)
        const op = opacity(frame, inF + i * 3, outF)
        return (
          <div
            key={i}
            style={{
              fontSize:        90,
              transform:       `scale(${sc})`,
              opacity:         op,
              filter:          'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            }}
          >
            {flag}
          </div>
        )
      })}
    </div>
  )
}

// ── OVERLAY 3B: 24–29s — Notificaciones apiladas ────────────────────────────

const WA_NOTIFS = [
  { sender: 'Carlos M.',   msg: 'Hola! tenéis kayaks para el sábado a las 11pm? 🙏', time: '23:47', delay: s(31.27) },
  { sender: 'Anna K.',     msg: 'Hi! Do you have availability tomorrow sunday?',       time: '00:12', delay: s(32.77) },
  { sender: 'Marco R.',    msg: 'Salve! Quanti posti avete liberi domenica sera?',     time: '01:34', delay: s(34.27) },
]

const WhatsAppIcon = () => (
  <div style={{
    width:           52,
    height:          52,
    borderRadius:    13,
    backgroundColor: '#25D366',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  }}>
    {/* Burbuja de WhatsApp simplificada */}
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <path d="M15 2C8 2 2 8 2 15c0 2.3.6 4.4 1.7 6.3L2 28l6.9-1.7C10.7 27.4 12.8 28 15 28c7 0 13-6 13-13S22 2 15 2z" fill="white"/>
      <path d="M11 9.5c-.3-.7-.6-.7-.9-.7-.2 0-.5 0-.8 0-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 3.9 1.7 4.2c.2.3 2.8 4.5 6.9 6.1 1 .4 1.7.6 2.3.8.9.3 1.8.2 2.4.2.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.1-.3-.2-.7-.4s-2.2-1.1-2.5-1.2c-.3-.1-.6-.2-.8.2-.3.4-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.6.2-.2.2-.4.4-.6.1-.3 0-.5-.1-.7C13 12 11.3 9.5 11 9.5z" fill="#25D366"/>
    </svg>
  </div>
)

const NotificacionesApiladas = ({ frame }: { frame: number }) => {
  const inF  = s(31.27)
  const outF = s(37.06)
  if (frame < inF || frame > outF) return null

  const widgetOp = interpolate(frame, [outF - 8, outF], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <div style={{
      position:  'absolute',
      bottom:    200,
      left:      '50%',
      transform: 'translateX(-50%)',
      opacity:   widgetOp,
      width:     820,
    }}>
      {WA_NOTIFS.map(({ sender, msg, time, delay }, i) => {
        if (frame < delay) return null

        const sc  = spring({ frame: frame - delay, fps: FPS, config: { damping: 16, stiffness: 220 }, durationInFrames: 18 })
        const y   = interpolate(sc, [0, 1], [-90, 0])
        const op  = interpolate(sc, [0, 1], [0, 1])

        return (
          <div
            key={i}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             18,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius:    22,
              padding:         '18px 24px',
              marginBottom:    14,
              opacity:         op,
              transform:       `translateY(${y}px)`,
              boxShadow:       '0 8px 32px rgba(0,0,0,0.45)',
            }}
          >
            {/* Icono WhatsApp */}
            <WhatsAppIcon />

            {/* Contenido */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize:   30,
                  fontWeight: 800,
                  color:      '#111',
                }}>
                  {sender}
                </span>
                <span style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize:   26,
                  color:      '#999',
                  fontWeight: 500,
                }}>
                  {time}
                </span>
              </div>
              {/* Mensaje */}
              <div style={{
                fontFamily:   'system-ui, sans-serif',
                fontSize:     30,
                color:        '#222',
                fontWeight:   500,
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
              }}>
                {msg}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── OVERLAY 3C: 24–29s — Contador de costos ─────────────────────────────────

const ContadorCostos = ({ frame }: { frame: number }) => {
  const inF  = s(25)
  const outF = s(29.5)
  if (frame < inF || frame > outF) return null

  const progress = interpolate(frame, [inF, outF - 6], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // Contador sube de 0 a 4.800 €
  const valor = Math.round(interpolate(progress, [0, 1], [0, 4800]) / 100) * 100
  const formatted = valor.toLocaleString('es-ES')

  const op = interpolate(frame, [inF, inF + 8, outF - 6, outF], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // Pulso rápido en el número (vibra mientras sube)
  const pulse = interpolate(Math.sin(frame * 0.6), [-1, 1], [0.97, 1.03])

  return (
    <div style={{
      position:  'absolute',
      bottom:    200,
      left:      '50%',
      transform: 'translateX(-50%)',
      opacity:   op,
      textAlign: 'center',
    }}>
      {/* Label superior */}
      <div style={{
        fontFamily:   'system-ui, sans-serif',
        fontSize:     32,
        fontWeight:   500,
        color:        'rgba(255,255,255,0.7)',
        marginBottom: 12,
        letterSpacing: 1,
      }}>
        Coste de contratar personal
      </div>

      {/* Número grande */}
      <div style={{
        display:    'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap:        8,
        transform:  `scale(${pulse})`,
      }}>
        <span style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize:   130,
          fontWeight: 900,
          color:      '#ef4444',
          lineHeight: 1,
          textShadow: '0 4px 30px rgba(239,68,68,0.5)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatted} €
        </span>
      </div>

      {/* /mes */}
      <div style={{
        fontFamily:  'system-ui, sans-serif',
        fontSize:    42,
        fontWeight:  600,
        color:       'rgba(255,255,255,0.6)',
        marginTop:   8,
      }}>
        / mes
      </div>

      {/* Barra de progreso */}
      <div style={{
        marginTop:       20,
        width:           500,
        height:          6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius:    3,
        overflow:        'hidden',
      }}>
        <div style={{
          width:           `${progress * 100}%`,
          height:          '100%',
          backgroundColor: '#ef4444',
          borderRadius:    3,
          boxShadow:       '0 0 12px rgba(239,68,68,0.8)',
          transition:      'width 0.05s linear',
        }} />
      </div>
    </div>
  )
}

// ── OVERLAY 3: 18–25s — Opciones ────────────────────────────────────────────

const Opciones = ({ frame }: { frame: number }) => {
  const inF = s(18), outF = s(25)
  if (frame < inF || frame > outF) return null

  const items = [
    { num: '1', texto: 'Pegarse al teléfono 24h' },
    { num: '2', texto: 'Contratar más personal' },
  ]

  return (
    <div style={{
      position: 'absolute',
      bottom:   180,
      left:     60,
      right:    60,
    }}>
      <div style={{
        fontFamily:   'system-ui, sans-serif',
        fontSize:     38,
        fontWeight:   600,
        color:        'rgba(255,255,255,0.7)',
        marginBottom: 28,
        opacity:      opacity(frame, inF, outF),
        textShadow:   '0 2px 10px rgba(0,0,0,0.6)',
      }}>
        Solamente tenía 2 opciones:
      </div>

      {items.map(({ num, texto }, i) => {
        const itemIn = inF + i * 10
        const op = opacity(frame, itemIn, outF)
        const y  = slideY(frame, itemIn)

        return (
          <div
            key={i}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          28,
              marginBottom: 28,
              opacity:      op,
              transform:    `translateY(${y}px)`,
            }}
          >
            {/* Número en círculo magenta */}
            <div style={{
              width:           88,
              height:          88,
              borderRadius:    '50%',
              backgroundColor: MAGENTA,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              flexShrink:      0,
              boxShadow:       '0 4px 24px rgba(192,38,168,0.55)',
            }}>
              <span style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize:   42,
                fontWeight: 900,
                color:      WHITE,
              }}>{num}</span>
            </div>
            {/* Texto */}
            <span style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize:   58,
              fontWeight: 800,
              color:      WHITE,
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            }}>
              {texto}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── OVERLAY 4: 47–53s — Resultado grande ────────────────────────────────────

const Resultado = ({ frame }: { frame: number }) => {
  const inF = s(47), outF = s(53)
  if (frame < inF || frame > outF) return null

  const lineas = [
    { texto: '$100.000',                  color: MAGENTA, size: 116, delay: 0  },
    { texto: 'en 30 días',                color: WHITE,   size:  72, delay: 8  },
    { texto: 'Sin contratar a nadie.',    color: WHITE,   size:  42, delay: 16 },
    { texto: 'Sin perderse una consulta.',color: WHITE,   size:  42, delay: 22 },
  ]

  return (
    <div style={{ position: 'absolute', bottom: 140, left: 60 }}>
      {lineas.map(({ texto, color, size, delay }, i) => {
        const op = opacity(frame, inF + delay, outF)
        const y  = slideY(frame, inF + delay)
        return (
          <div key={i} style={{
            fontFamily:   'system-ui, sans-serif',
            fontSize:     size,
            fontWeight:   900,
            color,
            lineHeight:   1.05,
            marginBottom: i < 2 ? 6 : 4,
            opacity:      op,
            transform:    `translateY(${y}px)`,
            textShadow:   '0 3px 24px rgba(0,0,0,0.8)',
          }}>
            {texto}
          </div>
        )
      })}
    </div>
  )
}

// ── OVERLAY 5: 53–61s — Cierre "Desliza →" ──────────────────────────────────

const Cierre = ({ frame }: { frame: number }) => {
  const inF = s(53), outF = s(61)
  if (frame < inF || frame > outF) return null

  const pulse = interpolate(Math.sin(frame * 0.12), [-1, 1], [0.92, 1.08])
  const op    = opacity(frame, inF, outF)

  return (
    <>
      {/* Badge centro abajo */}
      <div style={{
        position:        'absolute',
        bottom:          220,
        left:            '50%',
        transform:       `translateX(-50%) scale(${popScale(frame, inF)})`,
        transformOrigin: 'center center',
        opacity:         opacity(frame, inF, outF),
        whiteSpace:      'nowrap',
      }}>
        <span style={{
          backgroundColor: MAGENTA,
          color:           WHITE,
          borderRadius:    999,
          padding:         '22px 52px',
          fontSize:        56,
          fontWeight:      800,
          fontFamily:      'system-ui, sans-serif',
          boxShadow:       '0 6px 32px rgba(192,38,168,0.6)',
        }}>
          Empleado digital
        </span>
      </div>

      {/* Desliza → abajo derecha */}
      <div style={{
        position:        'absolute',
        bottom:          120,
        right:           60,
        opacity:         op,
        transform:       `scale(${pulse})`,
        transformOrigin: 'right bottom',
        textAlign:       'right',
      }}>
        <div style={{
          fontFamily:   'system-ui, sans-serif',
          fontSize:     40,
          fontWeight:   700,
          color:        WHITE,
          textShadow:   '0 2px 16px rgba(0,0,0,0.6)',
          marginBottom: 10,
        }}>
          Desliza →
        </div>
        <div style={{
          width:           90,
          height:          4,
          backgroundColor: MAGENTA,
          borderRadius:    2,
          marginLeft:      'auto',
          boxShadow:       '0 0 14px rgba(192,38,168,0.8)',
        }} />
      </div>
    </>
  )
}

// ── COMPOSICIÓN PRINCIPAL ─────────────────────────────────────────────────────

export const AquajetsTestimonio: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK }}>
      <Video
        src={staticFile('remotion/aquajets_web.mp4')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <Gradient />
      <Apertura  frame={frame} />
      <Calendario frame={frame} />
      <Banderas  frame={frame} />
      <Opciones             frame={frame} />
      <ContadorCostos         frame={frame} />
      <NotificacionesApiladas frame={frame} />
      <Resultado frame={frame} />
      <Cierre    frame={frame} />
    </AbsoluteFill>
  )
}
