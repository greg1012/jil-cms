import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

// ── Design tokens (same as App.jsx) ─────────────────────────
const C = {
  ink:"#0A0F1E", ink2:"#1C2336", ink3:"#2E3A52",
  slate:"#64748B", mist:"#94A3B8", cloud:"#CBD5E1",
  fog:"#E8EDF5", white:"#FFFFFF",
  blue:"#1D4ED8", blue2:"#3B82F6", blue3:"#DBEAFE",
  green:"#15803D", green2:"#22C55E", green3:"#DCFCE7",
  amber:"#B45309", amber2:"#F59E0B", amber3:"#FEF3C7",
  rose:"#BE123C", rose2:"#F43F5E", rose3:"#FFE4E6",
  violet:"#6D28D9", violet2:"#8B5CF6", violet3:"#EDE9FE",
};
const R = { xs:"6px", sm:"10px", md:"14px", lg:"18px", xl:"24px", xxl:"32px", full:"9999px" };
const SH = { sm:"0 2px 8px rgba(0,0,0,.07)", md:"0 4px 20px rgba(0,0,0,.09)", lg:"0 8px 40px rgba(0,0,0,.12)" };

const CATEGORIES = ["Health", "Financial", "Family", "Work", "Spiritual", "General"];

const categoryColor = (cat) => {
  const colors = {
    "Health": C.rose2,
    "Financial": C.amber2,
    "Family": C.blue,
    "Work": C.violet2,
    "Spiritual": C.green2,
    "General": C.slate,
  };
  return colors[cat] || C.slate;
};

const useIsMobile = () => {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
};

const Av = ({ name, size = 36 }) => {
  const cols = [C.blue, C.violet2, C.rose2, C.green2, C.amber2, "#0EA5E9"];
  let h = 0; for (let c of (name || "?")) h += c.charCodeAt(0);
  const color = cols[h % cols.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color,
      display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
      fontWeight:700, fontSize:size * 0.37, flexShrink:0, letterSpacing:-.5 }}>
      {(name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  );
};

const Badge = ({ label, color = C.blue }) => (
  <span style={{ background:`${color}18`, color, padding:"3px 10px", borderRadius:R.full,
    fontSize:11, fontWeight:700, letterSpacing:.3, whiteSpace:"nowrap" }}>{label}</span>
);

const Card = ({ children, style={}, onClick, onMouseEnter, onMouseLeave }) => (
  <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
    style={{ background:C.white, borderRadius:R.xl, boxShadow:SH.sm,
    border:`1px solid ${C.fog}`, padding:"18px 20px", cursor: onClick ? "pointer" : "default", ...style }}>
    {children}
  </div>
);

const Btn = ({ label, onClick, color=C.blue, outline, sm, full, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display:"flex", alignItems:"center", gap:6, justifyContent:"center",
    padding: sm ? "7px 14px" : "10px 20px",
    background: disabled ? C.cloud : outline ? "transparent" : color,
    color: disabled ? C.mist : outline ? color : C.white,
    border: `1.5px solid ${disabled ? C.cloud : color}`,
    borderRadius: R.full, fontWeight:600, fontSize: sm ? 12 : 14,
    cursor: disabled ? "not-allowed" : "pointer", transition:"all .15s",
    width: full ? "100%" : "auto", flexShrink:0,
  }}>
    {label}
  </button>
);

const Spinner = () => (
  <div style={{ display:"inline-block", width:18, height:18, borderRadius:"50%",
    border:`2px solid ${C.cloud}`, borderTopColor:C.blue,
    animation:"spin .7s linear infinite" }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Toast = ({ msg, type="info", onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  const cfg = {
    success:{ bg:C.green, light:C.green3, icon:"✓" },
    error:  { bg:C.rose2, light:C.rose3, icon:"✕" },
    warn:   { bg:C.amber2, light:C.amber3, icon:"⚠" },
    info:   { bg:C.blue, light:C.blue3, icon:"ⓘ" },
  }[type] || { bg:C.blue, light:C.blue3, icon:"ⓘ" };
  return (
    <div style={{ position:"fixed", bottom:20, left:20, right:20, maxWidth:420,
      background:cfg.light, border:`1.5px solid ${cfg.bg}`, borderRadius:R.lg,
      padding:"12px 16px", display:"flex", alignItems:"center", gap:12,
      fontSize:14, color:cfg.bg, fontWeight:500, boxShadow:SH.md, zIndex:2000,
      animation:"slideUp .3s ease-out" }}>
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <span style={{ fontWeight:700, fontSize:18 }}>{cfg.icon}</span>
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onDone} style={{ background:"transparent", border:"none",
        color:cfg.bg, cursor:"pointer", fontSize:18, padding:0, lineHeight:1 }}>✕</button>
    </div>
  );
};

const Modal = ({ open, onClose, title, children, width=500 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(10,15,30,.5)", backdropFilter:"blur(6px)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      boxSizing:"border-box" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:R.xxl,
        boxShadow:SH.lg, width:"100%", maxWidth:width, maxHeight:"92vh", overflowY:"auto",
        overflowX:"hidden", boxSizing:"border-box" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"22px 24px 0" }}>
          <h3 style={{ margin:0, fontWeight:800, fontSize:17, color:C.ink }}>{title}</h3>
          <button onClick={onClose} style={{ border:"none", background:C.fog, borderRadius:"50%",
            width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:C.slate }}>✕</button>
        </div>
        <div style={{ padding:"16px 24px 28px", boxSizing:"border-box", width:"100%" }}>{children}</div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  NEW PRAYER REQUEST MODAL
// ════════════════════════════════════════════════════════════
function NewPrayerModal({ open, onClose, user, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [isAnon, setIsAnon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setMsg({ text:"Title and description required", type:"warn" });
      return;
    }
    setSaving(true);
    setMsg(null);

    const { error } = await supabase.from("prayer_requests").insert({
      member_id: user?.memberId,
      branch_id:   user?.branchId,
      title: title.trim(),
      description: description.trim(),
      category,
      is_anonymous: isAnon,
      status: "pending", // Admin approves first
    });

    if (error) {
      setMsg({ text:"Failed: " + error.message, type:"error" });
      setSaving(false);
      return;
    }

    setMsg({ text:"Prayer request submitted for approval! 🙏", type:"success" });
    setSaving(false);
    setTimeout(() => {
      setTitle(""); setDescription(""); setCategory("General"); setIsAnon(false);
      onSuccess?.();
      onClose();
    }, 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Submit Prayer Request" width={520}>
      {msg && (
        <div style={{ background: msg.type==="success"?C.green3:msg.type==="warn"?C.amber3:C.rose3,
          color: msg.type==="success"?C.green:msg.type==="warn"?C.amber:C.rose2,
          borderRadius:R.md, padding:"10px 14px", fontSize:13, fontWeight:600, marginBottom:14 }}>
          {msg.text}
        </div>
      )}

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.slate, display:"block", marginBottom:5 }}>
          Title
        </label>
        <input value={title} onChange={e=>setTitle(e.target.value)}
          placeholder="What should we pray for?"
          style={{ width:"100%", padding:"10px 14px", borderRadius:R.md, boxSizing:"border-box",
            border:`1.5px solid ${C.cloud}`, fontSize:14, outline:"none", color:C.ink }}/>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.slate, display:"block", marginBottom:5 }}>
          Description
        </label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)}
          placeholder="Tell us more details about your prayer request..."
          rows={5}
          style={{ width:"100%", padding:"10px 14px", borderRadius:R.md, boxSizing:"border-box",
            border:`1.5px solid ${C.cloud}`, fontSize:14, outline:"none", color:C.ink,
            fontFamily:"inherit", resize:"vertical" }}/>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, fontWeight:600, color:C.slate, display:"block", marginBottom:5 }}>
          Category
        </label>
        <select value={category} onChange={e=>setCategory(e.target.value)}
          style={{ width:"100%", padding:"10px 14px", borderRadius:R.md,
            border:`1.5px solid ${C.cloud}`, fontSize:14, outline:"none",
            color:C.ink, background:C.white, boxSizing:"border-box" }}>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <input type="checkbox" checked={isAnon} onChange={e=>setIsAnon(e.target.checked)}
          style={{ cursor:"pointer", width:18, height:18 }}/>
        <label style={{ fontSize:13, color:C.slate, fontWeight:500, cursor:"pointer" }}>
          Post anonymously
        </label>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn label="Cancel" onClick={onClose} outline full sm/>
        <Btn label={saving ? "Submitting…" : "Submit"} onClick={handleSubmit}
          disabled={saving} full sm/>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
//  PRAYER REQUEST DETAIL MODAL
// ════════════════════════════════════════════════════════════
function PrayerDetailModal({ open, onClose, requestId, user, onSuccess }) {
  const [request, setRequest] = useState(null);
  const [responses, setResponses] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasPrayed, setHasPrayed] = useState(false);

  useEffect(() => {
    if (!open || !requestId) return;
    loadRequest();
  }, [open, requestId]);

  const loadRequest = async () => {
    setLoading(true);
    console.log("loadRequest: requestId =", requestId);

    const { data: req, error: reqErr } = await supabase.from("prayer_requests")
      .select(`*, members(name)`)
      .eq("id", requestId).single();
    console.log("loadRequest: req =", req, "reqErr =", reqErr);
    setRequest(req);

    const { data: resp, error: respErr } = await supabase.from("prayer_responses")
      .select(`*, members(name)`)
      .eq("prayer_request_id", requestId)
      .order("created_at", { ascending: false });
    console.log("loadRequest: resp =", resp, "respErr =", respErr);
    setResponses(resp || []);

    if (user?.memberId) {
      const { data: prayed, error: prayedErr } = await supabase.from("prayer_prays")
        .select("id").eq("prayer_request_id", requestId).eq("member_id", user.memberId).maybeSingle();
      console.log("loadRequest: prayed =", prayed, "prayedErr =", prayedErr);
      setHasPrayed(!!prayed);
    }

    setLoading(false);
  };

  const handlePray = async () => {
    if (!user?.id) return;
    setSending(true);

    // Insert prayer record
    const { error: prayErr } = await supabase.from("prayer_prays").insert({
      prayer_request_id: requestId,
      member_id: user.memberId,
    });

    if (!prayErr) {
      // Update prayer count
      await supabase.from("prayer_requests")
        .update({ prayer_count: (request?.prayer_count || 0) + 1 })
        .eq("id", requestId);
      
      setHasPrayed(true);
      setRequest({ ...request, prayer_count: (request?.prayer_count || 0) + 1 });
    } else {
        console.error("Pray error:", prayErr);  // ← ADD THIS TO SEE THE ERROR
    }

    setSending(false);
  };

  const handleComment = async () => {
    if (!newMessage.trim()) return;
    setSending(true);

    const { error } = await supabase.from("prayer_responses").insert({
      prayer_request_id: requestId,
      member_id: user?.memberId,
      message: newMessage.trim(),
      is_prayer: false,
    });

    if (!error) {
      setNewMessage("");
      loadRequest();
    }

    setSending(false);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Prayer Request" width={600}>
      {loading ? (
        <div style={{ textAlign:"center", padding:"40px 0" }}>
          <Spinner/>
        </div>
      ) : request ? (
        <>
          {/* Header */}
          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", gap:12, marginBottom:10 }}>
              <div>
                <h3 style={{ margin:"0 0 6px", fontWeight:800, fontSize:18, color:C.ink }}>
                  {request.title}
                </h3>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Badge label={request.category} color={categoryColor(request.category)}/>
                  {request.is_anonymous ? (
                    <span style={{ fontSize:11, color:C.mist, fontWeight:600 }}>🔒 Anonymous</span>
                  ) : (
                    <span style={{ fontSize:11, color:C.slate, fontWeight:600 }}>
                      By {request.members?.name || "Unknown"}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:26, fontWeight:800, color:C.blue }}>{request.prayer_count}</div>
                <div style={{ fontSize:11, color:C.mist, fontWeight:600 }}>prayed</div>
              </div>
            </div>

            <p style={{ fontSize:14, color:C.ink, lineHeight:1.6, margin:"12px 0" }}>
              {request.description}
            </p>

            <div style={{ fontSize:11, color:C.mist }}>
              Submitted {new Date(request.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
            <Btn 
              label={hasPrayed ? "✓ I Prayed" : "🙏 I Will Pray"}
              onClick={handlePray}
              disabled={!user?.id || sending}
              color={hasPrayed ? C.green : C.blue}
              full
            />
          </div>

          {/* Responses/Comments */}
          <div style={{ marginBottom:16 }}>
            <h4 style={{ margin:"0 0 12px", fontWeight:700, fontSize:13, color:C.ink }}>
              Prayers & Comments ({responses.length})
            </h4>
            
            {responses.length === 0 ? (
              <div style={{ background:C.fog, borderRadius:R.lg, padding:"20px", textAlign:"center", color:C.mist, fontSize:13 }}>
                No prayers or comments yet. Be the first to respond!
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:300, overflowY:"auto" }}>
                {responses.map(resp => (
                  <div key={resp.id} style={{ background:C.fog, borderRadius:R.lg, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"start", gap:10, marginBottom:6 }}>
                      <Av name={resp.members?.name || "?"} size={28}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:12, color:C.ink }}>
                          {resp.members?.name || "Anonymous"}
                        </div>
                        <div style={{ fontSize:11, color:C.mist }}>
                          {resp.is_prayer ? "🙏 Prayed" : "💬 Comment"}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin:"0", fontSize:13, color:C.ink, lineHeight:1.5 }}>
                      {resp.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add comment */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.slate, display:"block", marginBottom:6 }}>
              Add a prayer update or encouragement
            </label>
            <textarea value={newMessage} onChange={e=>setNewMessage(e.target.value)}
              placeholder="Share how you're praying for this request..."
              rows={3}
              style={{ width:"100%", padding:"10px 14px", borderRadius:R.md, boxSizing:"border-box",
                border:`1.5px solid ${C.cloud}`, fontSize:13, outline:"none", color:C.ink,
                fontFamily:"inherit", resize:"vertical", marginBottom:12 }}/>
            <Btn label={sending ? "Sending…" : "Send"} onClick={handleComment}
              disabled={!newMessage.trim() || sending} full sm/>
          </div>
        </>
      ) : (
        <div style={{ textAlign:"center", color:C.mist }}>Request not found</div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function PrayerPage({ user, role }) {
  const mob = useIsMobile();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("All");
  const [toast, setToast] = useState(null);

  const [showNewPrayer, setShowNewPrayer] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase.from("prayer_requests")
      .select(`*, members(name)`)
      .eq("status", "approved")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (user?.branchId && role !== "superadmin") {
      query = query.eq("branch_id", user.branchId);
    }

    const { data, error } = await query;
    console.log("fetchRequests data:", data, "error:", error);
    setRequests(data || []);
    setLoading(false);
  };

  const filtered = requests.filter(r =>
    filterCat === "All" || r.category === filterCat
  );

  const stats = {
    total: requests.length,
    totalPrayers: requests.reduce((sum, r) => sum + (r.prayer_count || 0), 0),
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      <NewPrayerModal open={showNewPrayer} onClose={()=>setShowNewPrayer(false)}
        user={user} onSuccess={fetchRequests}/>
      <PrayerDetailModal open={!!selectedRequest} onClose={()=>setSelectedRequest(null)}
        requestId={selectedRequest} user={user} onSuccess={fetchRequests}/>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ margin:0, fontWeight:800, fontSize:20, color:C.ink }}>Prayer Requests 🙏</h2>
        <button onClick={()=>setShowNewPrayer(true)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
            background:C.blue, color:C.white, border:"none", borderRadius:R.full,
            fontWeight:600, fontSize:13, cursor:"pointer" }}>
          <span style={{ fontSize:15 }}>➕</span> New Request
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:18, flexWrap:"wrap" }}>
        <Card style={{ flex:1, minWidth:140 }}>
          <div style={{ fontSize:11, color:C.mist, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>
            Active Requests
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:C.blue }}>{stats.total}</div>
        </Card>
        <Card style={{ flex:1, minWidth:140 }}>
          <div style={{ fontSize:11, color:C.mist, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>
            Total Prayers
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:C.green }}>{stats.totalPrayers}</div>
        </Card>
      </div>

      {/* Category filter */}
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        {["All", ...CATEGORIES].map(cat => (
          <button key={cat} onClick={()=>setFilterCat(cat)}
            style={{ padding:"6px 16px", borderRadius:R.full,
              border:`1.5px solid ${filterCat===cat?categoryColor(cat):C.cloud}`,
              background:filterCat===cat?categoryColor(cat):C.white,
              color:filterCat===cat?C.white:C.slate,
              fontWeight:600, fontSize:13, cursor:"pointer",
              transition:"all .15s", whiteSpace:"nowrap" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:C.mist }}>
          <Spinner/>
          <div style={{ marginTop:12, fontSize:14 }}>Loading prayer requests…</div>
        </div>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ fontSize:14, color:C.mist }}>
            {requests.length === 0 ? "No prayer requests yet. Be the first to share!" : "No requests in this category."}
          </div>
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:16 }}>
          {filtered.map(req => (
            <Card key={req.id} style={{ cursor:"pointer", transition:"all .2s" }}
              onClick={()=>{ console.log("Card clicked, req.id =", req.id); setSelectedRequest(req.id); }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=SH.lg}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=SH.sm}>
              
              {/* Top: Category & Prayer Count */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", gap:10, marginBottom:10 }}>
                <Badge label={req.category} color={categoryColor(req.category)}/>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:18 }}>🙏</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.blue }}>{req.prayer_count}</span>
                </div>
              </div>

              {/* Title */}
              <h3 style={{ margin:"0 0 8px", fontWeight:700, fontSize:15, color:C.ink, lineHeight:1.4 }}>
                {req.title}
              </h3>

              {/* Description (truncated) */}
              <p style={{ margin:"0 0 12px", fontSize:13, color:C.slate, lineHeight:1.5,
                overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box",
                WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                {req.description}
              </p>

              {/* Footer: Submitter & Date */}
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:C.mist, borderTop:`1px solid ${C.fog}`, paddingTop:10 }}>
                {req.is_anonymous ? (
                  <span style={{ fontWeight:600 }}>🔒 Anonymous</span>
                ) : (
                  <>
                    <Av name={req.members?.name || "?"} size={20}/>
                    <span style={{ fontWeight:600 }}>{req.members?.name || "Unknown"}</span>
                  </>
                )}
                <span style={{ marginLeft:"auto" }}>
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin: Pending approvals section */}
      {(role === "admin" || role === "superadmin") && (
  <PendingApprovalsSection user={user} role={role} onApprovalChange={fetchRequests}/>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN: PENDING APPROVALS
// ════════════════════════════════════════════════════════════
function PendingApprovalsSection({ onApprovalChange, user, role }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    let query = supabase.from("prayer_requests")
      .select(`*, members(name)`)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (role === "admin" && user?.branchId) {
      query = query.eq("branch_id", user.branchId);
    }
    const { data, error } = await query;
    console.log("pending data:", data, "error:", error);
    setPending(data || []);
    setLoading(false);
  };

  const handleApprove = async (id) => {
    await supabase.from("prayer_requests").update({ status: "approved" }).eq("id", id);
    loadPending();
    onApprovalChange?.();
  };

  const handleReject = async (id) => {
    await supabase.from("prayer_requests").update({ status: "rejected" }).eq("id", id);
    loadPending();
    onApprovalChange?.();
  };

  if (pending.length === 0) return null;

  return (
    <div style={{ marginTop:40, paddingTop:24, borderTop:`2px solid ${C.fog}` }}>
      <h3 style={{ margin:"0 0 16px", fontWeight:800, fontSize:16, color:C.ink }}>
        ⚙️ Pending Approvals ({pending.length})
      </h3>
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:12 }}>
        {pending.map(req => (
          <Card key={req.id} style={{ background:C.amber3, border:`1.5px solid ${C.amber2}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", gap:12, marginBottom:12 }}>
              <div>
                <h4 style={{ margin:0, fontWeight:700, fontSize:14, color:C.ink }}>
                  {req.title}
                </h4>
                <div style={{ fontSize:12, color:C.mist, marginTop:4 }}>
                  By {req.members?.name || "Anonymous"} · {req.category}
                </div>
              </div>
              <Badge label="Pending" color={C.amber2}/>
            </div>
            <p style={{ margin:"0 0 12px", fontSize:13, color:C.ink, lineHeight:1.5 }}>
              {req.description}
            </p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Btn label="✓ Approve" onClick={()=>handleApprove(req.id)} color={C.green} sm/>
              <Btn label="✕ Reject" onClick={()=>handleReject(req.id)} color={C.rose2} sm/>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}