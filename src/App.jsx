import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:5000/api";

const COLORS = {
  bg: "#0a0a0f", surface: "#111118", surfaceUp: "#18181f",
  border: "#1e1e2a", borderUp: "#2a2a38", accent: "#7c6aff",
  accentGlow: "#7c6aff33", success: "#22d3a0", successGlow: "#22d3a022",
  warn: "#f59e0b", danger: "#f43f5e", text: "#e8e8f0",
  textMuted: "#6b6b8a", textFaint: "#3a3a52",
};

const priorityConfig = {
  high:   { label:"High",   color:"#f43f5e", bg:"#f43f5e18", dot:"🔴" },
  medium: { label:"Medium", color:"#f59e0b", bg:"#f59e0b18", dot:"🟡" },
  low:    { label:"Low",    color:"#22d3a0", bg:"#22d3a018", dot:"🟢" },
};

const categoryConfig = {
  work:     { label:"Work",     icon:"💼", color:"#7c6aff" },
  study:    { label:"Study",    icon:"📚", color:"#38bdf8" },
  personal: { label:"Personal", icon:"🌿", color:"#22d3a0" },
  shopping: { label:"Shopping", icon:"🛒", color:"#f59e0b" },
  health:   { label:"Health",   icon:"❤️",  color:"#f43f5e" },
  finance:  { label:"Finance",  icon:"💰", color:"#a78bfa" },
};

// ── API HELPERS ──────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const apiCall = async (endpoint, method="GET", body=null) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, {
    method, headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ── UTILITIES ────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const isOverdue  = (t) => t.status !== "completed" && t.due_date && t.due_date < today();
const isDueToday = (t) => t.due_date === today() && t.status !== "completed";

// ── MINI COMPONENTS ──────────────────────────────────────
const Badge = ({ children, color=COLORS.accent, bg }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:600, color, background:bg||color+"22" }}>{children}</span>
);

const Pill = ({ children, active, onClick }) => (
  <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} onClick={onClick}
    style={{ padding:"5px 14px", borderRadius:99, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:active?COLORS.accent:COLORS.surfaceUp, color:active?"#fff":COLORS.textMuted }}>
    {children}
  </motion.button>
);

const IconBtn = ({ icon, onClick, title, danger, active }) => (
  <motion.button whileHover={{ scale:1.15 }} whileTap={{ scale:0.9 }} onClick={onClick} title={title}
    style={{ background:active?COLORS.accentGlow:"transparent", border:"none", cursor:"pointer", padding:"5px 6px", borderRadius:6, color:danger?COLORS.danger:active?COLORS.accent:COLORS.textMuted, fontSize:14 }}>
    {icon}
  </motion.button>
);

const Input = ({ style={}, ...props }) => (
  <input {...props} style={{ background:COLORS.surfaceUp, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"8px 12px", color:COLORS.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", ...style }}
    onFocus={e=>e.target.style.borderColor=COLORS.accent}
    onBlur={e=>e.target.style.borderColor=COLORS.border}/>
);

const Select = ({ style={}, children, ...props }) => (
  <select {...props} style={{ background:COLORS.surfaceUp, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"8px 12px", color:COLORS.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", ...style }}>
    {children}
  </select>
);

const Textarea = ({ style={}, ...props }) => (
  <textarea {...props} style={{ background:COLORS.surfaceUp, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"8px 12px", color:COLORS.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", minHeight:80, ...style }}
    onFocus={e=>e.target.style.borderColor=COLORS.accent}
    onBlur={e=>e.target.style.borderColor=COLORS.border}/>
);

const Toast = ({ toasts, remove }) => (
  <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
    <AnimatePresence>
      {toasts.map(t=>(
        <motion.div key={t.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:40 }}
          style={{ background:COLORS.surfaceUp, border:`1px solid ${COLORS.borderUp}`, borderRadius:10, padding:"12px 16px", minWidth:240, boxShadow:"0 8px 32px #0008", borderLeft:`3px solid ${t.type==="success"?COLORS.success:t.type==="error"?COLORS.danger:COLORS.accent}`, display:"flex", alignItems:"center", gap:10 }}>
          <span>{t.type==="success"?"✅":t.type==="error"?"❌":"ℹ️"}</span>
          <span style={{ fontSize:13, color:COLORS.text, flex:1 }}>{t.message}</span>
          <button onClick={()=>remove(t.id)} style={{ background:"none", border:"none", color:COLORS.textMuted, cursor:"pointer", fontSize:16 }}>×</button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

const MiniBar = ({ data, color=COLORS.accent }) => {
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:48 }}>
      {data.map((d,i)=>(
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <motion.div initial={{ height:0 }} animate={{ height:`${(d.value/max)*40}px` }} transition={{ delay:i*0.05 }}
            style={{ width:"100%", background:color, borderRadius:"3px 3px 0 0", minHeight:3 }}/>
          <span style={{ fontSize:9, color:COLORS.textMuted }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── LOGIN PAGE ───────────────────────────────────────────
const LoginPage = ({ onLogin, onGoRegister }) => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await apiCall("/auth/login", "POST", { email, password });
      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"'DM Sans',sans-serif" }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:18, padding:"36px 32px", width:"100%", maxWidth:420, boxShadow:"0 24px 64px #00000099" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:14, margin:"0 auto 12px", background:`linear-gradient(135deg, ${COLORS.accent}, #a855f7)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>✦</div>
          <h1 style={{ color:COLORS.text, fontSize:22, fontWeight:800, margin:0 }}>Welcome back</h1>
          <p style={{ color:COLORS.textMuted, fontSize:14, margin:"6px 0 0" }}>Sign in to TaskFlow</p>
        </div>
        {error&&<div style={{ background:"#f43f5e18", border:"1px solid #f43f5e44", borderRadius:8, padding:"10px 14px", color:COLORS.danger, fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>EMAIL</label>
            <Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div>
            <label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>PASSWORD</label>
            <Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} type="submit" disabled={loading}
            style={{ background:`linear-gradient(135deg, ${COLORS.accent}, #a855f7)`, border:"none", borderRadius:9, padding:12, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading?"Signing in...":"Sign In →"}
          </motion.button>
        </form>
        <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:COLORS.textMuted }}>
          No account?{" "}
          <button onClick={onGoRegister} style={{ background:"none", border:"none", color:COLORS.accent, fontWeight:700, cursor:"pointer", fontSize:13 }}>Sign up free</button>
        </p>
      </motion.div>
    </div>
  );
};

// ── REGISTER PAGE ────────────────────────────────────────
const RegisterPage = ({ onLogin, onGoLogin }) => {
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError("Password must be 6+ characters");
    setError(""); setLoading(true);
    try {
      const data = await apiCall("/auth/register", "POST", { full_name:fullName, email, password });
      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"'DM Sans',sans-serif" }}>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:18, padding:"36px 32px", width:"100%", maxWidth:420, boxShadow:"0 24px 64px #00000099" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:14, margin:"0 auto 12px", background:`linear-gradient(135deg, ${COLORS.accent}, #a855f7)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>✦</div>
          <h1 style={{ color:COLORS.text, fontSize:22, fontWeight:800, margin:0 }}>Create account</h1>
          <p style={{ color:COLORS.textMuted, fontSize:14, margin:"6px 0 0" }}>Start organizing your life</p>
        </div>
        {error&&<div style={{ background:"#f43f5e18", border:"1px solid #f43f5e44", borderRadius:8, padding:"10px 14px", color:COLORS.danger, fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { label:"FULL NAME", type:"text",     val:fullName, set:setFullName, ph:"Jane Doe" },
            { label:"EMAIL",     type:"email",    val:email,    set:setEmail,    ph:"you@example.com" },
            { label:"PASSWORD",  type:"password", val:password, set:setPassword, ph:"••••••••" },
          ].map(f=>(
            <div key={f.label}>
              <label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>{f.label}</label>
              <Input type={f.type} required value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}/>
            </div>
          ))}
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} type="submit" disabled={loading}
            style={{ background:`linear-gradient(135deg, ${COLORS.accent}, #a855f7)`, border:"none", borderRadius:9, padding:12, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading?"Creating...":"Create Account ✨"}
          </motion.button>
        </form>
        <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:COLORS.textMuted }}>
          Have an account?{" "}
          <button onClick={onGoLogin} style={{ background:"none", border:"none", color:COLORS.accent, fontWeight:700, cursor:"pointer", fontSize:13 }}>Sign in</button>
        </p>
      </motion.div>
    </div>
  );
};

// ── TASK MODAL ───────────────────────────────────────────
const TaskModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState(task || { title:"", description:"", priority:"medium", category:"work", due_date:"", status:"pending", is_favorite:false, tags:[] });
  const [tagInput, setTagInput] = useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addTag=()=>{ const t=tagInput.trim().toLowerCase(); if(t&&!form.tags?.includes(t)){set("tags",[...(form.tags||[]),t]);setTagInput("");} };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
      style={{ position:"fixed", inset:0, background:"#00000088", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <motion.div initial={{ scale:0.93, y:20 }} animate={{ scale:1, y:0 }} onClick={e=>e.stopPropagation()}
        style={{ background:COLORS.surface, borderRadius:16, padding:24, width:"100%", maxWidth:520, border:`1px solid ${COLORS.borderUp}`, boxShadow:"0 24px 64px #00000099", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:COLORS.text }}>{task?"✏️ Edit Task":"➕ New Task"}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:COLORS.textMuted, fontSize:20, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, marginBottom:5, display:"block" }}>TITLE *</label>
            <Input placeholder="What needs to be done?" value={form.title} onChange={e=>set("title",e.target.value)}/></div>
          <div><label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, marginBottom:5, display:"block" }}>DESCRIPTION</label>
            <Textarea placeholder="Add details..." value={form.description||""} onChange={e=>set("description",e.target.value)}/></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, marginBottom:5, display:"block" }}>PRIORITY</label>
              <Select value={form.priority} onChange={e=>set("priority",e.target.value)}>
                <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
              </Select></div>
            <div><label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, marginBottom:5, display:"block" }}>CATEGORY</label>
              <Select value={form.category} onChange={e=>set("category",e.target.value)}>
                {Object.entries(categoryConfig).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </Select></div>
          </div>
          <div><label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, marginBottom:5, display:"block" }}>DUE DATE</label>
            <Input type="date" value={form.due_date||""} onChange={e=>set("due_date",e.target.value)}/></div>
          <div>
            <label style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, marginBottom:5, display:"block" }}>TAGS</label>
            <div style={{ display:"flex", gap:8 }}>
              <Input placeholder="Add tag..." value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTag()} style={{ flex:1 }}/>
              <button onClick={addTag} style={{ background:COLORS.accentGlow, border:`1px solid ${COLORS.accent}44`, borderRadius:8, padding:"8px 14px", color:COLORS.accent, cursor:"pointer", fontWeight:600 }}>Add</button>
            </div>
            {form.tags?.length>0&&(
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                {form.tags.map(t=><span key={t} onClick={()=>set("tags",form.tags.filter(x=>x!==t))} style={{ background:COLORS.surfaceUp, border:`1px solid ${COLORS.borderUp}`, borderRadius:99, padding:"3px 10px", fontSize:12, color:COLORS.textMuted, cursor:"pointer" }}>#{t} ×</span>)}
              </div>
            )}
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={form.is_favorite||false} onChange={e=>set("is_favorite",e.target.checked)}/>
            <span style={{ fontSize:13, color:COLORS.textMuted }}>⭐ Mark as Favorite</span>
          </label>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, background:COLORS.surfaceUp, border:`1px solid ${COLORS.borderUp}`, borderRadius:8, padding:"10px", color:COLORS.textMuted, cursor:"pointer", fontWeight:600 }}>Cancel</button>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={()=>form.title.trim()&&onSave(form)}
            style={{ flex:2, background:`linear-gradient(135deg, ${COLORS.accent}, #a855f7)`, border:"none", borderRadius:8, padding:"10px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:14 }}>
            {task?"Save Changes":"Create Task"} ✨
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── STAT CARD ────────────────────────────────────────────
const StatCard = ({ icon, label, value, color=COLORS.accent, subtitle }) => (
  <motion.div whileHover={{ scale:1.03, y:-2 }}
    style={{ background:COLORS.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${COLORS.border}` }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
      <div>
        <p style={{ margin:0, fontSize:11, color:COLORS.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</p>
        <p style={{ margin:"6px 0 0", fontSize:30, fontWeight:800, color, lineHeight:1 }}>{value}</p>
        {subtitle&&<p style={{ margin:"4px 0 0", fontSize:11, color:COLORS.textMuted }}>{subtitle}</p>}
      </div>
      <div style={{ width:42, height:42, borderRadius:12, background:color+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>
    </div>
  </motion.div>
);

// ── SIDEBAR ──────────────────────────────────────────────
const navItems=[
  {id:"dashboard",icon:"🏠",label:"Dashboard"},
  {id:"tasks",    icon:"✅",label:"All Tasks"},
  {id:"kanban",   icon:"📋",label:"Kanban"},
  {id:"calendar", icon:"📅",label:"Calendar"},
  {id:"favorites",icon:"⭐",label:"Favorites"},
  {id:"analytics",icon:"📊",label:"Analytics"},
];

const Sidebar = ({ active, setActive, tasks, user, onLogout }) => {
  const pending=tasks.filter(t=>t.status==="pending").length;
  const overdue=tasks.filter(isOverdue).length;
  const initials=user?.full_name?.split(" ").map(n=>n[0]).join("").toUpperCase()||"U";
  return (
    <motion.nav initial={{ x:-20, opacity:0 }} animate={{ x:0, opacity:1 }}
      style={{ width:220, flexShrink:0, background:COLORS.surface, borderRight:`1px solid ${COLORS.border}`, display:"flex", flexDirection:"column", padding:"20px 12px", gap:2 }}>
      <div style={{ padding:"4px 8px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg, ${COLORS.accent}, #a855f7)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✦</div>
          <div><div style={{ fontSize:14, fontWeight:800, color:COLORS.text }}>TaskFlow</div><div style={{ fontSize:10, color:COLORS.textMuted }}>Premium</div></div>
        </div>
      </div>
      {navItems.map(item=>(
        <motion.button key={item.id} whileHover={{ x:2 }} whileTap={{ scale:0.97 }} onClick={()=>setActive(item.id)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:9, border:"none", cursor:"pointer", background:active===item.id?COLORS.accentGlow:"transparent", color:active===item.id?COLORS.accent:COLORS.textMuted, fontWeight:active===item.id?700:500, fontSize:13, transition:"all 0.15s" }}>
          <span style={{ fontSize:15 }}>{item.icon}</span>
          <span style={{ flex:1 }}>{item.label}</span>
          {item.id==="tasks"&&pending>0&&<span style={{ background:COLORS.accent, borderRadius:99, padding:"1px 7px", fontSize:10, fontWeight:800, color:"#fff" }}>{pending}</span>}
          {item.id==="tasks"&&overdue>0&&<span style={{ background:COLORS.danger, borderRadius:99, padding:"1px 5px", fontSize:10, fontWeight:800, color:"#fff" }}>!</span>}
        </motion.button>
      ))}
      <div style={{ flex:1 }}/>
      <div style={{ background:COLORS.surfaceUp, borderRadius:10, padding:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ width:32, height:32, borderRadius:99, background:`linear-gradient(135deg, ${COLORS.accent}, #a855f7)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>{initials}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:COLORS.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.full_name||"User"}</div>
            <div style={{ fontSize:10, color:COLORS.textMuted }}>Pro Plan</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width:"100%", background:"#f43f5e18", border:"1px solid #f43f5e33", borderRadius:7, padding:"6px", color:COLORS.danger, cursor:"pointer", fontWeight:600, fontSize:12 }}>
          Logout
        </button>
      </div>
    </motion.nav>
  );
};

// ── DASHBOARD ────────────────────────────────────────────
const DashboardView = ({ tasks, user }) => {
  const total=tasks.length, completed=tasks.filter(t=>t.status==="completed").length;
  const pending=tasks.filter(t=>t.status==="pending").length, overdue=tasks.filter(isOverdue).length;
  const pct=total?Math.round((completed/total)*100):0;
  const weekData=["M","T","W","T","F","S","S"].map((d,i)=>({label:d,value:[2,3,1,4,3,2,completed||1][i]}));
  const upcoming=tasks.filter(t=>t.status==="pending"&&t.due_date).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,4);
  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":"hour"<17?"Good afternoon":"Good evening";

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:COLORS.text }}>{greeting}, {user?.full_name?.split(" ")[0]||"there"} 👋</h2>
        <p style={{ margin:"4px 0 0", fontSize:14, color:COLORS.textMuted }}>
          You have <span style={{ color:COLORS.accent, fontWeight:700 }}>{pending} tasks</span> pending
          {overdue>0&&<> and <span style={{ color:COLORS.danger, fontWeight:700 }}>{overdue} overdue</span></>}
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
        <StatCard icon="📋" label="Total"     value={total}     color={COLORS.accent}/>
        <StatCard icon="✅" label="Completed" value={completed} color={COLORS.success} subtitle={`${pct}% done`}/>
        <StatCard icon="⏳" label="Pending"   value={pending}   color={COLORS.warn}/>
        <StatCard icon="⚠️" label="Overdue"   value={overdue}   color={COLORS.danger}/>
        <StatCard icon="🔥" label="Streak"    value="7d"        color="#f59e0b" subtitle="Keep it up!"/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
        <div style={{ background:COLORS.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${COLORS.border}` }}>
          <p style={{ margin:"0 0 14px", fontSize:13, fontWeight:700, color:COLORS.text }}>📈 Weekly Activity</p>
          <MiniBar data={weekData} color={COLORS.accent}/>
        </div>
        <div style={{ background:COLORS.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${COLORS.border}`, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:COLORS.text }}>🎯 Progress</p>
          <div style={{ fontSize:36, fontWeight:900, color:COLORS.accent }}>{pct}%</div>
          <div style={{ width:"100%", height:6, background:COLORS.borderUp, borderRadius:99, overflow:"hidden" }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1 }}
              style={{ height:"100%", background:`linear-gradient(90deg,${COLORS.accent},#a855f7)`, borderRadius:99 }}/>
          </div>
          <p style={{ margin:0, fontSize:11, color:COLORS.textMuted }}>Completion rate</p>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:COLORS.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${COLORS.border}` }}>
          <p style={{ margin:"0 0 14px", fontSize:13, fontWeight:700, color:COLORS.text }}>📅 Upcoming Deadlines</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {upcoming.length===0&&<p style={{ fontSize:13, color:COLORS.textMuted }}>No upcoming tasks! 🎉</p>}
            {upcoming.map(t=>{ const p=priorityConfig[t.priority]; return(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:COLORS.surfaceUp, borderRadius:8, borderLeft:`3px solid ${p.color}` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ fontSize:11, color:isOverdue(t)?COLORS.danger:COLORS.textMuted }}>{isOverdue(t)?"⚠️ Overdue":`📅 ${t.due_date}`}</div>
                </div>
                <Badge color={p.color} bg={p.bg}>{p.label}</Badge>
              </div>
            );})}
          </div>
        </div>
        <div style={{ background:COLORS.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${COLORS.border}` }}>
          <p style={{ margin:"0 0 14px", fontSize:13, fontWeight:700, color:COLORS.text }}>🏷️ Categories</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Object.entries(categoryConfig).map(([k,v])=>{ const count=tasks.filter(t=>t.category===k).length; if(!count)return null; const pctCat=total?(count/total)*100:0; return(
              <div key={k} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14, width:20 }}>{v.icon}</span>
                <span style={{ fontSize:12, color:COLORS.textMuted, flex:1 }}>{v.label}</span>
                <div style={{ width:80, height:4, borderRadius:99, background:COLORS.borderUp, overflow:"hidden" }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${pctCat}%` }} style={{ height:"100%", background:v.color, borderRadius:99 }}/>
                </div>
                <span style={{ fontSize:11, color:COLORS.textMuted, width:16, textAlign:"right" }}>{count}</span>
              </div>
            );})}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── TASKS VIEW ───────────────────────────────────────────
const filterLabels=[{id:"all",label:"All"},{id:"pending",label:"Pending"},{id:"completed",label:"Completed"},{id:"favorites",label:"⭐ Fav"},{id:"overdue",label:"⚠️ Overdue"},{id:"today",label:"📅 Today"},{id:"high",label:"🔴 High"}];

const TasksView = ({ tasks, onToggle, onFavorite, onEdit, onDelete, onAdd }) => {
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const filtered=tasks.filter(t=>{
    if(filter==="pending")  return t.status==="pending";
    if(filter==="completed")return t.status==="completed";
    if(filter==="favorites")return t.is_favorite;
    if(filter==="overdue")  return isOverdue(t);
    if(filter==="today")    return isDueToday(t);
    if(filter==="high")     return t.priority==="high";
    return true;
  }).filter(t=>!search||t.title.toLowerCase().includes(search.toLowerCase())||t.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:COLORS.text, flex:1 }}>All Tasks</h2>
        <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} onClick={onAdd}
          style={{ background:`linear-gradient(135deg,${COLORS.accent},#a855f7)`, border:"none", borderRadius:9, padding:"9px 16px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13 }}>
          ➕ New Task
        </motion.button>
      </div>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:COLORS.textMuted }}>🔍</span>
        <Input placeholder="Search tasks..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36 }}/>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {filterLabels.map(f=><Pill key={f.id} active={filter===f.id} onClick={()=>setFilter(f.id)}>{f.label}</Pill>)}
      </div>
      <p style={{ margin:0, fontSize:12, color:COLORS.textMuted }}>{filtered.length} task{filtered.length!==1?"s":""}</p>
      <AnimatePresence mode="popLayout">
        {filtered.length===0&&(
          <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:"center", padding:"48px 0", color:COLORS.textMuted }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
            <p style={{ fontSize:15, fontWeight:600 }}>No tasks found</p>
          </motion.div>
        )}
        {filtered.map(task=>(
          <motion.div key={task.id} layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.95 }} whileHover={{ y:-2 }}
            style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"14px 16px", borderLeft:`3px solid ${priorityConfig[task.priority]?.color}`, opacity:task.status==="completed"?0.65:1 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <motion.button whileTap={{ scale:0.8 }} onClick={()=>onToggle(task)}
                style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1, border:`2px solid ${task.status==="completed"?COLORS.success:COLORS.borderUp}`, background:task.status==="completed"?COLORS.success:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11 }}>
                {task.status==="completed"&&"✓"}
              </motion.button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:COLORS.text, textDecoration:task.status==="completed"?"line-through":"none" }}>{task.title}</span>
                  {task.is_favorite&&<span>⭐</span>}
                </div>
                {task.description&&<p style={{ fontSize:12, color:COLORS.textMuted, margin:"3px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.description}</p>}
                <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                  {task.category&&<Badge color={categoryConfig[task.category]?.color||COLORS.accent}>{categoryConfig[task.category]?.icon} {categoryConfig[task.category]?.label||task.category}</Badge>}
                  <Badge color={priorityConfig[task.priority]?.color} bg={priorityConfig[task.priority]?.bg}>{priorityConfig[task.priority]?.dot} {priorityConfig[task.priority]?.label}</Badge>
                  {task.due_date&&<Badge color={isOverdue(task)?COLORS.danger:isDueToday(task)?COLORS.warn:COLORS.textMuted}>{isOverdue(task)?"⚠️ Overdue":isDueToday(task)?"📅 Today":`📅 ${task.due_date}`}</Badge>}
                </div>
              </div>
              <div style={{ display:"flex", gap:2 }}>
                <IconBtn icon="⭐" onClick={()=>onFavorite(task)} active={task.is_favorite}/>
                <IconBtn icon="✏️" onClick={()=>onEdit(task)}/>
                <IconBtn icon="🗑️" onClick={()=>onDelete(task)} danger/>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

// ── KANBAN VIEW ──────────────────────────────────────────
const KanbanView = ({ tasks, onToggle, onDelete }) => {
  const cols=[
    {id:"high",   label:"🔴 High",      color:COLORS.danger,  filter:t=>t.status==="pending"&&t.priority==="high"},
    {id:"medium", label:"🟡 Medium",     color:COLORS.warn,    filter:t=>t.status==="pending"&&t.priority==="medium"},
    {id:"low",    label:"🟢 Low",        color:COLORS.success, filter:t=>t.status==="pending"&&t.priority==="low"},
    {id:"done",   label:"✅ Completed",  color:COLORS.accent,  filter:t=>t.status==="completed"},
  ];
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:COLORS.text }}>Kanban Board</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {cols.map(col=>{ const colTasks=tasks.filter(col.filter); return(
          <div key={col.id}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 10px", background:COLORS.surface, borderRadius:10, border:`1px solid ${COLORS.border}`, borderTop:`2px solid ${col.color}`, marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:700, color:COLORS.text, flex:1 }}>{col.label}</span>
              <span style={{ background:col.color+"22", borderRadius:99, padding:"1px 8px", fontSize:11, fontWeight:700, color:col.color }}>{colTasks.length}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {colTasks.map(task=>(
                <motion.div key={task.id} whileHover={{ scale:1.02 }}
                  style={{ background:COLORS.surface, borderRadius:10, padding:12, border:`1px solid ${COLORS.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:COLORS.text, flex:1 }}>{task.title}</span>
                    <IconBtn icon="🗑️" onClick={()=>onDelete(task)} danger/>
                  </div>
                  {task.due_date&&<div style={{ marginTop:6 }}><Badge color={isOverdue(task)?COLORS.danger:COLORS.textMuted}>📅 {task.due_date}</Badge></div>}
                  <button onClick={()=>onToggle(task)} style={{ marginTop:8, background:task.status==="completed"?COLORS.successGlow:COLORS.accentGlow, border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:600, color:task.status==="completed"?COLORS.success:COLORS.accent, cursor:"pointer" }}>
                    {task.status==="completed"?"✓ Done":"Mark Done"}
                  </button>
                </motion.div>
              ))}
              {colTasks.length===0&&<div style={{ textAlign:"center", padding:"20px 0", color:COLORS.textFaint, fontSize:12 }}>Empty</div>}
            </div>
          </div>
        );})}
      </div>
    </motion.div>
  );
};

// ── CALENDAR VIEW ────────────────────────────────────────
const CalendarView = ({ tasks }) => {
  const now=new Date();
  const [month,setMonth]=useState(now.getMonth());
  const [year,setYear]=useState(now.getFullYear());
  const daysInMonth=new Date(year,month+1,0).getDate();
  const firstDay=(new Date(year,month,1).getDay()+6)%7;
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const getDay=(day)=>{ const d=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; return tasks.filter(t=>t.due_date===d); };
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:COLORS.text, flex:1 }}>Calendar</h2>
        <IconBtn icon="◀" onClick={()=>month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1)}/>
        <span style={{ fontSize:15, fontWeight:700, color:COLORS.text, minWidth:150, textAlign:"center" }}>{months[month]} {year}</span>
        <IconBtn icon="▶" onClick={()=>month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1)}/>
      </div>
      <div style={{ background:COLORS.surface, borderRadius:14, border:`1px solid ${COLORS.border}`, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${COLORS.border}` }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} style={{ padding:"10px 6px", textAlign:"center", fontSize:11, fontWeight:700, color:COLORS.textMuted }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} style={{ minHeight:72, borderRight:`1px solid ${COLORS.border}`, borderBottom:`1px solid ${COLORS.border}` }}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{ const day=i+1; const dayTasks=getDay(day); const isToday=day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear(); return(
            <div key={day} style={{ minHeight:72, borderRight:`1px solid ${COLORS.border}`, borderBottom:`1px solid ${COLORS.border}`, padding:"6px 8px", background:isToday?COLORS.accentGlow:"transparent" }}>
              <div style={{ fontSize:12, fontWeight:isToday?800:500, color:isToday?COLORS.accent:COLORS.textMuted, marginBottom:4 }}>{day}</div>
              {dayTasks.slice(0,2).map(t=>{ const p=priorityConfig[t.priority]; return<div key={t.id} style={{ fontSize:10, padding:"2px 5px", borderRadius:4, marginBottom:2, background:p.color+"22", color:p.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>; })}
              {dayTasks.length>2&&<div style={{ fontSize:9, color:COLORS.textMuted }}>+{dayTasks.length-2}</div>}
            </div>
          );})}
        </div>
      </div>
    </motion.div>
  );
};

// ── ANALYTICS VIEW ───────────────────────────────────────
const AnalyticsView = ({ tasks }) => {
  const total=tasks.length, completed=tasks.filter(t=>t.status==="completed").length;
  const pct=total?Math.round((completed/total)*100):0;
  const priorityData=[
    {label:"High",  value:tasks.filter(t=>t.priority==="high").length,   color:COLORS.danger},
    {label:"Medium",value:tasks.filter(t=>t.priority==="medium").length, color:COLORS.warn},
    {label:"Low",   value:tasks.filter(t=>t.priority==="low").length,    color:COLORS.success},
  ];
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:COLORS.text }}>Analytics</h2>
      <div style={{ background:`linear-gradient(135deg,${COLORS.accent}22,#a855f722)`, border:`1px solid ${COLORS.accent}44`, borderRadius:16, padding:"24px", display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
        <div>
          <p style={{ margin:0, fontSize:11, color:COLORS.textMuted, fontWeight:700, letterSpacing:"0.06em" }}>PRODUCTIVITY SCORE</p>
          <p style={{ margin:"6px 0 0", fontSize:64, fontWeight:900, color:COLORS.accent, lineHeight:1 }}>{pct}</p>
          <p style={{ margin:"4px 0 0", fontSize:13, color:COLORS.textMuted }}>out of 100</p>
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ height:8, background:COLORS.borderUp, borderRadius:99, overflow:"hidden", marginBottom:16 }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1.5 }}
              style={{ height:"100%", background:`linear-gradient(90deg,${COLORS.accent},#a855f7)`, borderRadius:99 }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, textAlign:"center" }}>
            {[{label:"Total",val:total},{label:"Done",val:completed},{label:"Pending",val:tasks.filter(t=>t.status==="pending").length}].map(s=>(
              <div key={s.label}><div style={{ fontSize:22, fontWeight:800, color:COLORS.text }}>{s.val}</div><div style={{ fontSize:11, color:COLORS.textMuted }}>{s.label}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:COLORS.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${COLORS.border}` }}>
          <p style={{ margin:"0 0 16px", fontSize:13, fontWeight:700, color:COLORS.text }}>🎯 Priority Breakdown</p>
          {priorityData.map(p=>{ const pct2=total?(p.value/total)*100:0; return(
            <div key={p.label} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:COLORS.textMuted }}>{p.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.value}</span>
              </div>
              <div style={{ height:5, background:COLORS.borderUp, borderRadius:99, overflow:"hidden" }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${pct2}%` }} style={{ height:"100%", background:p.color, borderRadius:99 }}/>
              </div>
            </div>
          );})}
        </div>
        <div style={{ background:COLORS.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${COLORS.border}` }}>
          <p style={{ margin:"0 0 16px", fontSize:13, fontWeight:700, color:COLORS.text }}>🏷️ Categories</p>
          {Object.entries(categoryConfig).map(([k,v])=>{ const count=tasks.filter(t=>t.category===k).length; if(!count)return null; return(
            <div key={k} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:14 }}>{v.icon}</span>
              <span style={{ fontSize:12, color:COLORS.textMuted, flex:1 }}>{v.label}</span>
              <span style={{ fontSize:12, fontWeight:700, color:v.color }}>{count}</span>
            </div>
          );})}
        </div>
      </div>
    </motion.div>
  );
};

// ── MAIN APP ─────────────────────────────────────────────
export default function App() {
  const [user,       setUser]       = useState(null);
  const [page,       setPage]       = useState("login");
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [showModal,  setShowModal]  = useState(false);
  const [editTask,   setEditTask]   = useState(null);
  const [toasts,     setToasts]     = useState([]);

  const toast = useCallback((message, type="success") => {
    const id = Date.now();
    setToasts(ts => [...ts, {id, message, type}]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3200);
  }, []);

  const removeToast = (id) => setToasts(ts => ts.filter(t => t.id !== id));

  // Check if already logged in
  useEffect(() => {
    const token = getToken();
    if (token) {
      apiCall("/auth/me")
        .then(u => { setUser(u); setPage("app"); fetchTasks(); })
        .catch(() => { localStorage.removeItem("token"); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch tasks from database
  const fetchTasks = async () => {
    try {
      const data = await apiCall("/tasks");
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("app");
    fetchTasks();
    toast(`Welcome back, ${userData.full_name}! 👋`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setTasks([]);
    setPage("login");
    toast("Logged out successfully", "info");
  };

  const handleToggle = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const updated = await apiCall(`/tasks/${task.id}`, "PUT", { status: newStatus });
      setTasks(ts => ts.map(t => t.id === task.id ? updated : t));
      toast(newStatus === "completed" ? "✅ Task completed!" : "↩️ Task reopened", newStatus === "completed" ? "success" : "info");
    } catch (err) { toast(err.message, "error"); }
  };

  const handleFavorite = async (task) => {
    try {
      const updated = await apiCall(`/tasks/${task.id}`, "PUT", { is_favorite: !task.is_favorite });
      setTasks(ts => ts.map(t => t.id === task.id ? updated : t));
      toast(task.is_favorite ? "Removed from favorites" : "⭐ Added to favorites", "info");
    } catch (err) { toast(err.message, "error"); }
  };

  const handleDelete = async (task) => {
    try {
      await apiCall(`/tasks/${task.id}`, "DELETE");
      setTasks(ts => ts.filter(t => t.id !== task.id));
      toast("🗑️ Task deleted", "error");
    } catch (err) { toast(err.message, "error"); }
  };

  const handleSave = async (form) => {
    try {
      if (editTask) {
        const updated = await apiCall(`/tasks/${editTask.id}`, "PUT", form);
        setTasks(ts => ts.map(t => t.id === editTask.id ? updated : t));
        toast("✏️ Task updated!", "success");
      } else {
        const created = await apiCall("/tasks", "POST", form);
        setTasks(ts => [created, ...ts]);
        toast("✨ Task created!", "success");
      }
      setShowModal(false);
      setEditTask(null);
    } catch (err) { toast(err.message, "error"); }
  };

  // Loading screen
  if (loading) return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1.5 }}
        style={{ fontSize:18, fontWeight:700, color:COLORS.accent }}>✦ Loading TaskFlow...</motion.div>
    </div>
  );

  // Auth pages
  if (page === "login")    return <LoginPage    onLogin={handleLogin} onGoRegister={()=>setPage("register")}/>;
  if (page === "register") return <RegisterPage onLogin={handleLogin} onGoLogin={()=>setPage("login")}/>;

  const favTasks = tasks.filter(t => t.is_favorite);

  const renderView = () => {
    switch(activeView) {
      case "dashboard": return <DashboardView tasks={tasks} user={user}/>;
      case "tasks":     return <TasksView tasks={tasks} onToggle={handleToggle} onFavorite={handleFavorite} onEdit={t=>{setEditTask(t);setShowModal(true);}} onDelete={handleDelete} onAdd={()=>{setEditTask(null);setShowModal(true);}}/>;
      case "kanban":    return <KanbanView tasks={tasks} onToggle={handleToggle} onDelete={handleDelete}/>;
      case "calendar":  return <CalendarView tasks={tasks}/>;
      case "favorites": return <TasksView tasks={favTasks} onToggle={handleToggle} onFavorite={handleFavorite} onEdit={t=>{setEditTask(t);setShowModal(true);}} onDelete={handleDelete} onAdd={()=>{setEditTask(null);setShowModal(true);}}/>;
      case "analytics": return <AnalyticsView tasks={tasks}/>;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif", background:COLORS.bg, color:COLORS.text, minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${COLORS.bg};}
        ::-webkit-scrollbar-thumb{background:${COLORS.borderUp};border-radius:99px;}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.6);}
        select option{background:${COLORS.surfaceUp};color:${COLORS.text};}
      `}</style>
      <div style={{ display:"flex", flex:1, overflow:"hidden", height:"100vh" }}>
        <Sidebar active={activeView} setActive={setActiveView} tasks={tasks} user={user} onLogout={handleLogout}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <header style={{ height:52, background:COLORS.surface, borderBottom:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:12, flexShrink:0 }}>
            <h1 style={{ margin:0, fontSize:16, fontWeight:700, color:COLORS.text, flex:1 }}>
              {{dashboard:"Dashboard",tasks:"My Tasks",kanban:"Kanban Board",calendar:"Calendar",favorites:"Favorites",analytics:"Analytics"}[activeView]}
            </h1>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} onClick={()=>{setEditTask(null);setShowModal(true);}}
              style={{ background:`linear-gradient(135deg,${COLORS.accent},#a855f7)`, border:"none", borderRadius:8, padding:"7px 14px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:12 }}>
              ➕ Quick Add
            </motion.button>
          </header>
          <main style={{ flex:1, overflowY:"auto", padding:"24px" }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeView} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.18 }}>
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <AnimatePresence>
        {showModal&&<TaskModal task={editTask} onClose={()=>{setShowModal(false);setEditTask(null);}} onSave={handleSave}/>}
      </AnimatePresence>
      <Toast toasts={toasts} remove={removeToast}/>
    </div>
  );
}