import { useState, useEffect, useRef } from "react";

const DESTINATIONS = [
  { name: "Santorini", country: "Greece", emoji: "🏛️", color: "#60a5fa" },
  { name: "Bali", country: "Indonesia", emoji: "🌴", color: "#34d399" },
  { name: "Paris", country: "France", emoji: "🗼", color: "#f472b6" },
  { name: "Tokyo", country: "Japan", emoji: "⛩️", color: "#fb7185" },
  { name: "Maldives", country: "Indian Ocean", emoji: "🌊", color: "#22d3ee" },
  { name: "Dubai", country: "UAE", emoji: "🏙️", color: "#fbbf24" },
  { name: "Rome", country: "Italy", emoji: "🏟️", color: "#f97316" },
  { name: "Machu Picchu", country: "Peru", emoji: "🏔️", color: "#a3e635" },
];

const STATS = [
  { value: "61+", label: "Destinations" },
  { value: "50K+", label: "Travelers" },
  { value: "4.9★", label: "Rating" },
  { value: "12+", label: "Years" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [activeDestIdx, setActiveDestIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<{id:number,x:number,y:number,vx:number,vy:number,size:number,opacity:number,color:string}[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Rotate destination cards
  useEffect(() => {
    const t = setInterval(() => setActiveDestIdx(i => (i + 1) % DESTINATIONS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Parallax mouse
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Floating particles
  useEffect(() => {
    const colors = ["#a78bfa","#60a5fa","#f472b6","#34d399","#fbbf24"];
    const init = Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[i % colors.length],
    }));
    setParticles(init);

    let current = init.map(p => ({ ...p }));
    const animate = () => {
      current = current.map(p => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;
        if (nx < 0 || nx > 100) p.vx *= -1;
        if (ny < 0 || ny > 100) p.vy *= -1;
        return { ...p, x: Math.max(0, Math.min(100, nx)), y: Math.max(0, Math.min(100, ny)) };
      });
      setParticles([...current]);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleSubmit = () => {
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 2500);
  };

  const dest = DESTINATIONS[activeDestIdx];

  const stars = Array.from({ length: 100 }, (_, i) => ({
    x: (Math.sin(i * 137.508) * 0.5 + 0.5) * 100,
    y: (Math.cos(i * 137.508) * 0.5 + 0.5) * 100,
    s: (i % 4) * 0.5 + 0.5,
    d: (i % 7) * 0.4,
  }));

  return (
    <div ref={containerRef} style={{
      minHeight: "100vh",
      width: "100%",
      background: `radial-gradient(ellipse at ${20 + mousePos.x * 20}% ${20 + mousePos.y * 20}%, #2d1b6940 0%, transparent 60%),
                   radial-gradient(ellipse at ${70 + mousePos.x * 10}% ${70 + mousePos.y * 10}%, #1e3a8a50 0%, transparent 60%),
                   linear-gradient(145deg, #0f0520 0%, #1a1040 30%, #0d1b3e 60%, #0f0520 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden",
      position: "relative",
      transition: "background 0.1s ease",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input { outline: none; }

        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-40px) scale(1.1)} 66%{transform:translate(-30px,30px) scale(0.95)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,40px) scale(1.08)} }
        @keyframes orb3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.2)} }
        @keyframes twinkle { 0%,100%{opacity:0.1;transform:scale(0.7)} 50%{opacity:1;transform:scale(1.4)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideLeft { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(139,92,246,0.3)} 50%{box-shadow:0 0 50px rgba(139,92,246,0.7)} }
        @keyframes progressFill { from{width:0} to{width:100%} }
        @keyframes dotPulse { 0%,80%,100%{transform:scale(0);opacity:0.5} 40%{transform:scale(1);opacity:1} }

        .panel-left { animation: slideRight 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .panel-right { animation: slideLeft 0.9s cubic-bezier(0.16,1,0.3,1) both 0.15s; }
        .dest-card { animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .form-field { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .shimmer-text {
          background: linear-gradient(90deg, #c4b5fd, #93c5fd, #f9a8d4, #6ee7b7, #c4b5fd);
          background-size: 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }
        .submit-btn {
          background: linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb);
          border: none; cursor: pointer;
          transition: all 0.3s ease;
          position: relative; overflow: hidden;
        }
        .submit-btn::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6);
          opacity: 0; transition: opacity 0.3s;
        }
        .submit-btn:hover::after { opacity: 1; }
        .submit-btn:hover { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(124,58,237,0.6) !important; }
        .submit-btn span { position: relative; z-index: 1; }
        .social-btn { transition: all 0.25s ease; cursor: pointer; }
        .social-btn:hover { background: rgba(255,255,255,0.12) !important; transform: translateY(-2px); border-color: rgba(167,139,250,0.5) !important; }
        .tab-btn { transition: all 0.3s ease; cursor: pointer; }
        .link { transition: color 0.2s; cursor: pointer; }
        .link:hover { color: #c4b5fd !important; }
        .dest-dot { transition: all 0.3s ease; cursor: pointer; }
        .dest-dot:hover { transform: scale(1.3); }
        .stat-item { animation: fadeIn 0.6s ease both; }
        .input-field { transition: all 0.3s ease; }
        .logo-wrap { animation: float 4s ease-in-out infinite; }
        .glow-card { animation: glow 4s ease-in-out infinite; }
      `}</style>

      {/* Animated orbs */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {[
          { w:700, h:700, top:-200, left:-200, c:"rgba(109,40,217,0.25)", anim:"orb1 14s ease-in-out infinite" },
          { w:600, h:600, bottom:-150, right:-150, c:"rgba(37,99,235,0.3)", anim:"orb2 11s ease-in-out infinite" },
          { w:400, h:400, top:"45%", left:"38%", c:"rgba(196,181,253,0.12)", anim:"orb3 17s ease-in-out infinite" },
          { w:300, h:300, top:"10%", right:"15%", c:"rgba(244,114,182,0.15)", anim:"orb1 9s ease-in-out infinite reverse" },
          { w:250, h:250, bottom:"20%", left:"20%", c:"rgba(52,211,153,0.12)", anim:"orb2 13s ease-in-out infinite reverse" },
        ].map((o,i) => (
          <div key={i} style={{
            position:"absolute", width:o.w, height:o.h,
            top:(o as any).top, bottom:(o as any).bottom, left:(o as any).left, right:(o as any).right,
            borderRadius:"50%",
            background:`radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
            filter:"blur(60px)",
            animation: o.anim,
          }}/>
        ))}
      </div>

      {/* Stars */}
      {stars.map((s,i) => (
        <div key={i} style={{
          position:"absolute", left:`${s.x}%`, top:`${s.y}%`,
          width:s.s, height:s.s, borderRadius:"50%", background:"white",
          animation:`twinkle ${2+s.d}s ease-in-out infinite`,
          animationDelay:`${s.d}s`,
        }}/>
      ))}

      {/* Floating particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size, borderRadius:"50%",
          background:p.color, opacity:p.opacity,
          filter:"blur(0.5px)",
          pointerEvents:"none",
        }}/>
      ))}

      {/* Grid */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(167,139,250,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.03) 1px,transparent 1px)",
        backgroundSize:"80px 80px",
      }}/>

      {/* Main wrapper */}
      <div style={{
        display:"flex",
        width:"min(1000px, 96vw)",
        minHeight:600,
        borderRadius:32,
        overflow:"hidden",
        boxShadow:"0 50px 150px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
        position:"relative", zIndex:10,
      }}>

        {/* ── LEFT PANEL ── */}
        <div className="panel-left" style={{
          flex:1,
          padding:"48px 40px",
          background:"rgba(255,255,255,0.03)",
          backdropFilter:"blur(30px)",
          borderRight:"1px solid rgba(255,255,255,0.07)",
          display:"flex", flexDirection:"column", gap:0,
          position:"relative", overflow:"hidden",
        }}>

          {/* subtle world outline */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.04, pointerEvents:"none" }} viewBox="0 0 500 600" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="250" cy="300" rx="200" ry="220" stroke="white" strokeWidth="0.7" fill="none"/>
            <ellipse cx="250" cy="300" rx="200" ry="80" stroke="white" strokeWidth="0.5" fill="none"/>
            <line x1="50" y1="300" x2="450" y2="300" stroke="white" strokeWidth="0.5"/>
            <line x1="250" y1="80" x2="250" y2="520" stroke="white" strokeWidth="0.5"/>
            <ellipse cx="250" cy="300" rx="200" ry="160" stroke="white" strokeWidth="0.4" fill="none"/>
            {[180,220,260,300,340,380].map(y => (
              <line key={y} x1="50" y1={y} x2="450" y2={y} stroke="white" strokeWidth="0.3"/>
            ))}
            {[130,170,210,250,290,330,370].map(x => (
              <line key={x} x1={x} y1="80" x2={x} y2="520" stroke="white" strokeWidth="0.3"/>
            ))}
            {[{x:180,y:200},{x:300,y:260},{x:150,y:350},{x:320,y:380},{x:230,y:180}].map((p,i)=>(
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="5" fill="white" opacity="0.8"/>
                <circle cx={p.x} cy={p.y} r="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4"/>
              </g>
            ))}
          </svg>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:44 }}>
            <div className="logo-wrap" style={{
              width:52, height:52,
              background:"linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb)",
              borderRadius:16,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:26,
              boxShadow:"0 8px 32px rgba(124,58,237,0.5)",
              border:"1px solid rgba(167,139,250,0.4)",
            }}>✈️</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", color:"white", fontWeight:700, fontSize:22, letterSpacing:"-0.5px" }}>
                TravelDreams
              </div>
              <div style={{ color:"rgba(196,181,253,0.5)", fontSize:10, letterSpacing:"3px", textTransform:"uppercase", marginTop:2 }}>
                explore · dream · discover
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div style={{ marginBottom:36 }}>
            <h1 style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:38, fontWeight:700,
              color:"white", lineHeight:1.15,
              letterSpacing:"-1px", margin:"0 0 14px",
            }}>
              The world is<br/>
              <span className="shimmer-text">waiting for you</span>
            </h1>
            <p style={{ color:"rgba(196,181,253,0.55)", fontSize:14, lineHeight:1.8, maxWidth:300 }}>
              Discover 61 breathtaking destinations. Plan perfect trips, find dream hotels, and create memories that last forever.
            </p>
          </div>

          {/* Destination showcase */}
          <div style={{ marginBottom:36 }}>
            <p style={{ color:"rgba(255,255,255,0.2)", fontSize:10, letterSpacing:"3px", textTransform:"uppercase", marginBottom:14 }}>
              Featured destination
            </p>
            <div key={activeDestIdx} className="dest-card glow-card" style={{
              padding:"18px 20px",
              background:"rgba(255,255,255,0.06)",
              backdropFilter:"blur(20px)",
              border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:18,
              display:"flex", alignItems:"center", gap:16,
              position:"relative", overflow:"hidden",
            }}>
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg, ${dest.color}, transparent)`,
                animation:"progressFill 3s linear forwards",
              }}/>
              <div style={{
                width:56, height:56,
                background:`linear-gradient(135deg, ${dest.color}30, ${dest.color}15)`,
                borderRadius:14,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:28,
                border:`1px solid ${dest.color}30`,
              }}>{dest.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:"white", fontWeight:700, fontSize:18, letterSpacing:"-0.3px" }}>
                  {dest.name}
                </div>
                <div style={{ color:"rgba(196,181,253,0.5)", fontSize:13, marginTop:2 }}>
                  {dest.country}
                </div>
              </div>
              <div style={{
                padding:"6px 12px",
                background:`${dest.color}20`,
                border:`1px solid ${dest.color}40`,
                borderRadius:20,
                color:dest.color, fontSize:11, fontWeight:600,
              }}>Trending ↑</div>
            </div>

            {/* Dots */}
            <div style={{ display:"flex", gap:6, marginTop:12, paddingLeft:4 }}>
              {DESTINATIONS.map((_,i) => (
                <div key={i} className="dest-dot"
                  onClick={() => setActiveDestIdx(i)}
                  style={{
                    width: i === activeDestIdx ? 20 : 6,
                    height:6, borderRadius:3,
                    background: i === activeDestIdx ? DESTINATIONS[i].color : "rgba(255,255,255,0.2)",
                    transition:"all 0.4s ease",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:0, borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:28 }}>
            {STATS.map((s,i) => (
              <div key={s.label} className="stat-item" style={{
                flex:1, textAlign:"center",
                borderRight: i < STATS.length-1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                animationDelay:`${0.1*i}s`,
              }}>
                <div style={{ color:"white", fontWeight:800, fontSize:20, letterSpacing:"-0.5px" }}>{s.value}</div>
                <div style={{ color:"rgba(196,181,253,0.4)", fontSize:11, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="panel-right" style={{
          width:420,
          background:"rgba(255,255,255,0.07)",
          backdropFilter:"blur(60px)",
          display:"flex", flexDirection:"column",
          borderLeft:"1px solid rgba(255,255,255,0.08)",
          position:"relative", overflow:"hidden",
        }}>

          {/* Top decorative bar */}
          <div style={{
            height:3,
            background:"linear-gradient(90deg, #7c3aed, #4f46e5, #2563eb, #7c3aed)",
            backgroundSize:"200%",
            animation:"shimmer 3s linear infinite",
          }}/>

          <div style={{ padding:"42px 40px 40px", flex:1, display:"flex", flexDirection:"column" }}>

            {/* Tabs */}
            <div style={{
              display:"flex", gap:0,
              background:"rgba(0,0,0,0.2)",
              borderRadius:14, padding:4,
              marginBottom:36,
            }}>
              {(["login","register"] as const).map(t => (
                <button key={t} className="tab-btn"
                  onClick={() => setStep(t)}
                  style={{
                    flex:1, padding:"10px",
                    background: step===t ? "linear-gradient(135deg,rgba(124,58,237,0.8),rgba(79,70,229,0.8))" : "transparent",
                    border:"none",
                    borderRadius:11,
                    color: step===t ? "white" : "rgba(196,181,253,0.45)",
                    fontSize:14, fontWeight: step===t ? 600 : 400,
                    boxShadow: step===t ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  }}>
                  {t === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Greeting */}
            <div style={{ marginBottom:28 }}>
              <h2 style={{
                fontFamily:"'Playfair Display',serif",
                color:"white", fontSize:24, fontWeight:700,
                letterSpacing:"-0.5px", margin:"0 0 6px",
              }}>
                {step==="login" ? "Welcome back, explorer" : "Start your journey"}
              </h2>
              <p style={{ color:"rgba(196,181,253,0.45)", fontSize:13 }}>
                {step==="login" ? "Sign in to access your travel dashboard" : "Join 50,000+ travelers worldwide"}
              </p>
            </div>

            {/* Social */}
            <div style={{ display:"flex", gap:10, marginBottom:24 }}>
              {[{icon:"G",label:"Google",c:"#ea4335"},{icon:"f",label:"Facebook",c:"#1877f2"}].map(s=>(
                <button key={s.label} className="social-btn" style={{
                  flex:1, padding:"11px 8px",
                  background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:12, color:"rgba(255,255,255,0.75)",
                  fontSize:13, fontWeight:500,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                  <span style={{color:s.c, fontWeight:800, fontSize:16}}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.07)"}}/>
              <span style={{ color:"rgba(196,181,253,0.35)", fontSize:11, letterSpacing:"1px" }}>OR WITH EMAIL</span>
              <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.07)"}}/>
            </div>

            {/* Fields */}
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:22 }}>
              {step === "register" && (
                <div className="form-field" style={{ animationDelay:"0.05s" }}>
                  <label style={{ display:"block", color:"rgba(196,181,253,0.55)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", marginBottom:7 }}>
                    Full Name
                  </label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.45 }}>👤</span>
                    <input
                      className="input-field"
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onFocus={() => setFocused("name")}
                      onBlur={() => setFocused(null)}
                      style={{
                        width:"100%", padding:"13px 14px 13px 42px",
                        background: focused==="name" ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
                        border: focused==="name" ? "1px solid rgba(167,139,250,0.7)" : "1px solid rgba(255,255,255,0.09)",
                        borderRadius:12, color:"white", fontSize:14,
                        boxShadow: focused==="name" ? "0 0 30px rgba(124,58,237,0.2)" : "none",
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="form-field" style={{ animationDelay:"0.1s" }}>
                <label style={{ display:"block", color:"rgba(196,181,253,0.55)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", marginBottom:7 }}>
                  Email Address
                </label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.45 }}>✉️</span>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    style={{
                      width:"100%", padding:"13px 14px 13px 42px",
                      background: focused==="email" ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
                      border: focused==="email" ? "1px solid rgba(167,139,250,0.7)" : "1px solid rgba(255,255,255,0.09)",
                      borderRadius:12, color:"white", fontSize:14,
                      boxShadow: focused==="email" ? "0 0 30px rgba(124,58,237,0.2)" : "none",
                    }}
                  />
                  {email.includes("@") && (
                    <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:"#34d399", fontSize:14 }}>✓</span>
                  )}
                </div>
              </div>

              <div className="form-field" style={{ animationDelay:"0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                  <label style={{ color:"rgba(196,181,253,0.55)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase" }}>Password</label>
                  {step==="login" && <span className="link" style={{ color:"rgba(196,181,253,0.35)", fontSize:12 }}>Forgot?</span>}
                </div>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.45 }}>🔒</span>
                  <input
                    className="input-field"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                    style={{
                      width:"100%", padding:"13px 44px 13px 42px",
                      background: focused==="pass" ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
                      border: focused==="pass" ? "1px solid rgba(167,139,250,0.7)" : "1px solid rgba(255,255,255,0.09)",
                      borderRadius:12, color:"white", fontSize:14,
                      boxShadow: focused==="pass" ? "0 0 30px rgba(124,58,237,0.2)" : "none",
                    }}
                  />
                  <button onClick={() => setShowPass(!showPass)} style={{
                    position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", color:"rgba(196,181,253,0.4)", cursor:"pointer", fontSize:14, padding:4,
                  }}>{showPass ? "🙈" : "👁️"}</button>
                </div>

                {/* Password strength */}
                {step==="register" && password.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {[1,2,3,4].map(l => (
                        <div key={l} style={{
                          flex:1, height:3, borderRadius:2,
                          background: password.length >= l*3
                            ? l<=1 ? "#ef4444" : l<=2 ? "#f59e0b" : l<=3 ? "#3b82f6" : "#10b981"
                            : "rgba(255,255,255,0.1)",
                          transition:"background 0.3s",
                        }}/>
                      ))}
                    </div>
                    <p style={{ color:"rgba(196,181,253,0.4)", fontSize:11, marginTop:4 }}>
                      {password.length < 3 ? "Weak" : password.length < 6 ? "Fair" : password.length < 9 ? "Good" : "Strong"} password
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button className="submit-btn"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width:"100%", padding:"15px",
                borderRadius:14, color:"white",
                fontWeight:600, fontSize:15,
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                boxShadow:"0 12px 40px rgba(124,58,237,0.4)",
                marginBottom:20,
              }}
            >
              {loading ? (
                <span style={{ display:"flex", gap:6 }}>
                  {[0,1,2].map(i=>(
                    <span key={i} style={{
                      width:8, height:8, borderRadius:"50%", background:"white",
                      display:"inline-block",
                      animation:`dotPulse 1.4s ease-in-out infinite`,
                      animationDelay:`${i*0.16}s`,
                    }}/>
                  ))}
                </span>
              ) : (
                <span>
                  {step==="login" ? "✈️ Sign In to TravelDreams" : "🌍 Create My Account"}
                </span>
              )}
            </button>

            <p style={{ color:"rgba(196,181,253,0.35)", fontSize:13, textAlign:"center" }}>
              {step==="login" ? "New explorer? " : "Already a member? "}
              <span className="link" style={{ color:"#a78bfa", fontWeight:600 }}
                onClick={() => setStep(step==="login" ? "register" : "login")}>
                {step==="login" ? "Create free account →" : "Sign in →"}
              </span>
            </p>

            {/* Trust badges */}
            <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:24, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              {["🔐 SSL Secured","🛡️ Private","⭐ 4.9 Rated"].map(b => (
                <span key={b} style={{ color:"rgba(196,181,253,0.3)", fontSize:11 }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
