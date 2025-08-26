import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Check, ChevronLeft, ClipboardList, LogIn, Package, RefreshCw, Search, Truck, Warehouse } from "lucide-react";

// -----------------------------------------------------------------------------
// Utilidades y datos mock
// -----------------------------------------------------------------------------
const zonas = {
  A: Array.from({ length: 8 }, (_, i) => `ZNA${String(i + 1).padStart(2, "0")}`),
  B: Array.from({ length: 9 }, (_, i) => `ZNB${String(i + 1).padStart(2, "0")}`),
  C: Array.from({ length: 22 }, (_, i) => `ZNC${String(i + 1).padStart(2, "0")}`),
};

const fmtUbic = (z = "ZNC15", est = 3, niv = 2) => `ALM01-${z}-EST${String(est).padStart(2, "0")}-NIV${String(niv).padStart(2, "0")}`;
const UBI_CONSUMO = "ALM01-CON01-EST01-NIV01";

const materialesCatalogo = {
  "MS130.9000.8404": { desc: "Sacagrapas metal" },
  "MS130.9000.6501": { desc: "Porta clips" },
};

function makeVale(num, prov, pendientes) {
  return {
    id: num,
    proveedor: prov,
    fecha: "2025-08-20",
    items: pendientes.map((p, idx) => ({
      mat: p.mat,
      pendiente: p.qty,
      asignados: [], // {lpn, qty}
      idx: idx + 1,
    })),
  };
}

const VALES_INICIALES = [
  makeVale("2025-0044356", "ABC", [
    { mat: "MS130.9000.8404", qty: 3 },
    { mat: "MS130.9000.6501", qty: 1 },
  ]),
  makeVale("2025-0044330", "Y", [
    { mat: "MS130.9000.8404", qty: 5 },
  ]),
  makeVale("2025-0044321", "Z", [
    { mat: "MS130.9000.6501", qty: 1 },
  ]),
];

function randomLPN() {
  return `LPN-${Math.floor(1 + Math.random() * 999999).toString().padStart(6, "0")}`;
}

// -----------------------------------------------------------------------------
// Componentes pequeños reutilizables
// -----------------------------------------------------------------------------
function AppBar({ title, onBack, onScan }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-white/80 backdrop-blur p-3">
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft />
          </Button>
        ) : (
          <div className="w-9" />
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <Button variant="outline" size="icon" onClick={onScan} title="Escáner rápido">
        <Camera />
      </Button>
    </div>
  );
}

function QtyStepper({ value, onChange, min = 0, max = 999 }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onChange(Math.max(min, value - 1))}>-</Button>
      <div className="w-10 text-center text-sm">{value}</div>
      <Button size="sm" onClick={() => onChange(Math.min(max, value + 1))}>+</Button>
    </div>
  );
}

function Toast({ text, onClose }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-2xl bg-black text-white px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2"><Check className="h-4 w-4" /> {text}</div>
          <button className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white text-black" onClick={onClose}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -----------------------------------------------------------------------------
// Pantallas
// -----------------------------------------------------------------------------
function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">App de Almacén</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Usuario</Label>
            <Input value={user} onChange={(e)=>setUser(e.target.value)} placeholder="operario" />
          </div>
          <div className="space-y-1">
            <Label>Clave</Label>
            <Input type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="••••••" />
          </div>
          <Button className="w-full" onClick={() => onLogin({ user: user || "Operario" })}>
            <LogIn className="mr-2 h-4 w-4"/> Ingresar
          </Button>
          <div className="text-xs text-muted-foreground">v1.0 • Soporte: TI</div>
        </CardContent>
      </Card>
    </div>
  );
}

function Home({ user, go }) {
  const tile = (
    label, icon, key) => (
      <Button variant="secondary" className="h-24 rounded-2xl text-base justify-start" onClick={() => go(key)}>
        {icon}
        <span className="ml-3">{label}</span>
      </Button>
    );
  return (
    <div className="p-4 space-y-4">
      <AppBar title="Menú Principal" onScan={() => alert("(mock) abrir cámara")} />
      <Card>
        <CardHeader>
          <CardTitle>
            Hola, {user?.user || "Operario"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {tile("Tareas de Ingreso", <ClipboardList/>, "ingreso")}
          {tile("Despacho", <Truck/>, "despacho")}
          {tile("Reubicar LPN", <RefreshCw/>, "reubicarLpn")}
          {tile("Reubicar Material", <Package/>, "reubicarMaterial")}
          {tile("Consulta", <Search/>, "consulta")}
        </CardContent>
      </Card>
    </div>
  );
}

function ListaVales({ vales, openVale }) {
  const [q, setQ] = useState("");
  const filtrados = vales.filter(v => v.id.includes(q));
  return (
    <div className="p-4 space-y-3">
      <AppBar title="Tareas de Ingreso" onBack={() => openVale(null)} onScan={() => alert("(mock) escanear")} />
      <Input placeholder="Buscar por número de vale" value={q} onChange={(e)=>setQ(e.target.value)} />
      <div className="space-y-2">
        {filtrados.map(v => (
          <Card key={v.id} className="cursor-pointer" onClick={() => openVale(v.id)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{v.id}</div>
                <div className="text-xs text-muted-foreground">Proveedor: {v.proveedor}</div>
              </div>
              <Badge variant="secondary">Pend: {v.items.reduce((a,b)=>a+b.pendiente,0)} ítems</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DetalleVale({ vale, onBack, onAsignar, onFinalizar }) {
  const pendientes = vale.items.reduce((a,b)=>a+b.pendiente,0);
  return (
    <div className="p-4 space-y-3">
      <AppBar title={`Vale: ${vale.id}`} onBack={onBack} onScan={() => alert("(mock) escanear")} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proveedor: {vale.proveedor} • Fecha: {vale.fecha}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {vale.items.map((it, i) => (
            <div key={i} className="border rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{String(i+1).padStart(2,"0")}. {it.mat}</div>
                <div className="text-xs text-muted-foreground">{materialesCatalogo[it.mat]?.desc} • Pend: {it.pendiente}</div>
              </div>
              <Button onClick={() => onAsignar(vale, it)}>Asignar</Button>
            </div>
          ))}
          <Button disabled={pendientes!==0} className="w-full" onClick={onFinalizar}>
            <Check className="mr-2 h-4 w-4"/> Finalizar Tarea
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Despacho({ onBack, onToast }) {
  const [lpn, setLpn] = useState("");
  const [items, setItems] = useState([
    { mat: "MS130.9000.8404", disp: 3, qty: 0, checked: false },
    { mat: "MS130.9000.6501", disp: 1, qty: 0, checked: false },
  ]);
  const [showResumen, setShowResumen] = useState(false);

  const seleccionarTodos = (val) => setItems(prev => prev.map(it => ({...it, checked: val, qty: val ? it.disp : 0 })));

  return (
    <div className="p-4 space-y-3">
      <AppBar title="Despacho" onBack={onBack} onScan={() => setLpn(randomLPN())} />
      <Input placeholder="Escanear LPN origen" value={lpn} onChange={e=>setLpn(e.target.value)} />
      {lpn && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">LPN: <span className="font-medium">{lpn}</span></div>
              <div className="text-xs text-muted-foreground">Ubicación: {fmtUbic()}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={()=>seleccionarTodos(true)}>Seleccionar todos</Button>
              <Button variant="outline" size="sm" onClick={()=>seleccionarTodos(false)}>Deseleccionar</Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-xl border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={it.checked} onCheckedChange={(c)=>setItems(prev => prev.map((p,i)=> i===idx?{...p, checked: !!c}:p))} />
                    <div>
                      <div className="font-medium">{it.mat}</div>
                      <div className="text-xs text-muted-foreground">{materialesCatalogo[it.mat]?.desc} • Disp: {it.disp}</div>
                    </div>
                  </div>
                  <QtyStepper value={it.qty} onChange={(q)=>setItems(prev => prev.map((p,i)=> i===idx?{...p, qty: Math.min(q, it.disp), checked: q>0}:p))} max={it.disp} />
                </div>
              ))}
            </div>
            <div className="rounded-xl border p-3 text-sm">
              Destino: <span className="font-medium">{UBI_CONSUMO}</span> (CONSUMO)
            </div>
            <Button className="w-full" onClick={()=>setShowResumen(true)}>Ver resumen</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showResumen} onOpenChange={setShowResumen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resumen de Despacho</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            <div>LPN Origen: <b>{lpn}</b></div>
            <div>Destino: <b>{UBI_CONSUMO}</b></div>
            <ul className="list-disc ml-4">
              {items.filter(i=>i.qty>0).map((i,idx)=> (
                <li key={idx}>{materialesCatalogo[i.mat]?.desc} ({i.mat}): {i.qty} u.</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={()=>setShowResumen(false)}>Cancelar</Button>
            <Button onClick={()=>{setShowResumen(false); onToast(`Movidos ${items.reduce((a,b)=>a+b.qty,0)} ítems a CONSUMO`);}}>Confirmar Movimiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReubicarLPN({ onBack, onToast }) {
  const [origen, setOrigen] = useState("");
  const [zona, setZona] = useState("ZNC15");
  const [est, setEst] = useState(3);
  const [niv, setNiv] = useState(2);
  const destino = fmtUbic(zona, est, niv);
  return (
    <div className="p-4 space-y-3">
      <AppBar title="Reubicar LPN" onBack={onBack} onScan={() => setOrigen(randomLPN())} />
      <Input placeholder="Escanear LPN Origen" value={origen} onChange={e=>setOrigen(e.target.value)} />
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium">Escanear Nueva Ubicación</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label>Zona</Label>
              <Select value={zona} onValueChange={setZona}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(zonas).flat().map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estantería</Label>
              <Input type="number" min={1} value={est} onChange={(e)=>setEst(parseInt(e.target.value||"1"))} />
            </div>
            <div>
              <Label>Nivel</Label>
              <Input type="number" min={1} value={niv} onChange={(e)=>setNiv(parseInt(e.target.value||"1"))} />
            </div>
          </div>
          <div className="rounded-xl border p-3 text-sm">Destino: <b>{destino}</b></div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onBack}>Cancelar</Button>
            <Button onClick={()=> onToast(`${origen} reubicado a ${destino}`)}>Confirmar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReubicarMaterial({ onBack, onToast }) {
  const [lpn, setLpn] = useState("");
  const [items, setItems] = useState([
    { mat: "MS130.9000.8404", disp: 3, qty: 0, checked: false },
    { mat: "MS130.9000.6501", disp: 1, qty: 0, checked: false },
  ]);
  const [destino, setDestino] = useState("");
  const seleccionarTodos = (val) => setItems(prev => prev.map(it => ({...it, checked: val, qty: val ? it.disp : 0 })));
  return (
    <div className="p-4 space-y-3">
      <AppBar title="Reubicar Material" onBack={onBack} onScan={() => setLpn(randomLPN())} />
      <Input placeholder="Escanear LPN Origen" value={lpn} onChange={e=>setLpn(e.target.value)} />
      {lpn && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={()=>seleccionarTodos(true)}>Seleccionar todos</Button>
              <Button variant="outline" size="sm" onClick={()=>seleccionarTodos(false)}>Deseleccionar</Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-xl border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={it.checked} onCheckedChange={(c)=>setItems(prev => prev.map((p,i)=> i===idx?{...p, checked: !!c}:p))} />
                    <div>
                      <div className="font-medium">{it.mat}</div>
                      <div className="text-xs text-muted-foreground">{materialesCatalogo[it.mat]?.desc} • Disp: {it.disp}</div>
                    </div>
                  </div>
                  <QtyStepper value={it.qty} onChange={(q)=>setItems(prev => prev.map((p,i)=> i===idx?{...p, qty: Math.min(q, it.disp), checked: q>0}:p))} max={it.disp} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Escanear Nuevo LPN destino</Label>
              <div className="flex gap-2">
                <Input value={destino} onChange={(e)=>setDestino(e.target.value)} placeholder="LPN-000999" />
                <Button variant="outline" onClick={()=>setDestino(randomLPN())}><Camera className="h-4 w-4"/></Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onBack}>Cancelar</Button>
              <Button onClick={()=> onToast(`Materiales movidos al ${destino || "LPN-000999"}`)}>Confirmar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Consulta({ onBack }) {
  const [modo, setModo] = useState("material");
  const [q, setQ] = useState("");
  const resultado = useMemo(() => {
    if (!q) return null;
    if (modo === "material") {
      return {
        material: q,
        ubicaciones: [
          { ubi: fmtUbic("ZNC15", 3, 2), qty: 2, lpn: randomLPN() },
          { ubi: fmtUbic("ZNA08", 1, 3), qty: 1, lpn: randomLPN() },
        ],
      };
    } else {
      return {
        lpn: q,
        contenido: [
          { mat: "MS130.9000.8404", qty: 3 },
          { mat: "MS130.9000.6501", qty: 1 },
        ],
      };
    }
  }, [modo, q]);

  return (
    <div className="p-4 space-y-3">
      <AppBar title="Consulta" onBack={onBack} onScan={() => setQ("MS130.9000.8404")} />
      <Tabs value={modo} onValueChange={setModo}>
        <TabsList>
          <TabsTrigger value="material">Material</TabsTrigger>
          <TabsTrigger value="lpn">LPN</TabsTrigger>
        </TabsList>
        <TabsContent value="material" className="space-y-3">
          <Input placeholder="Código de material" value={q} onChange={(e)=>setQ(e.target.value)} />
          {resultado && (
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="font-medium">Material: {resultado.material}</div>
                <div className="space-y-1">
                  {resultado.ubicaciones.map((r, i)=> (
                    <div key={i} className="rounded-xl border p-2 flex items-center justify-between">
                      <div>{r.ubi} → {r.qty} u.</div>
                      <Badge variant="secondary">{r.lpn}</Badge>
                    </div>
                  ))}
                </div>
                <div>Total: {resultado.ubicaciones.reduce((a,b)=>a+b.qty, 0)} u.</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="lpn" className="space-y-3">
          <Input placeholder="LPN-000123" value={q} onChange={(e)=>setQ(e.target.value)} />
          {resultado && (
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="font-medium">LPN: {resultado.lpn}</div>
                <div className="space-y-1">
                  {resultado.contenido.map((c,i)=> (
                    <div key={i} className="rounded-xl border p-2 flex items-center justify-between">
                      <div>{c.mat} — {materialesCatalogo[c.mat]?.desc}</div>
                      <Badge variant="secondary">{c.qty} u.</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -----------------------------------------------------------------------------
// App principal con ruteo simple por estado
// -----------------------------------------------------------------------------
export default function AppAlmacenMock() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState("home");
  const [toast, setToast] = useState("");

  const [vales, setVales] = useState(VALES_INICIALES);
  const [valeSel, setValeSel] = useState(null); // id
  const [modalAsignar, setModalAsignar] = useState({ open: false, valeId: null, itemIdx: null, lpn: "", qty: 1 });

  const currentVale = useMemo(()=> vales.find(v => v.id === valeSel), [vales, valeSel]);

  const go = (r) => {
    if (r === "ingreso") { setRoute("ingreso"); setValeSel(null); }
    else setRoute(r);
  };

  // --- Acciones de Ingreso ---
  const openVale = (id) => {
    if (id === null) { setRoute("home"); return; }
    setValeSel(id); setRoute("detalleVale");
  };

  const onAsignar = (vale, item) => {
    setModalAsignar({ open: true, valeId: vale.id, itemIdx: vale.items.indexOf(item), lpn: "", qty: 1 });
  };

  const confirmarAsignacion = () => {
    setVales(prev => prev.map(v => {
      if (v.id !== modalAsignar.valeId) return v;
      const items = v.items.map((it, idx) => {
        if (idx !== modalAsignar.itemIdx) return it;
        const q = Math.min(modalAsignar.qty, it.pendiente);
        return {
          ...it,
          pendiente: it.pendiente - q,
          asignados: [...it.asignados, { lpn: modalAsignar.lpn || randomLPN(), qty: q }],
        };
      });
      return { ...v, items };
    }));
    setModalAsignar({ open: false, valeId: null, itemIdx: null, lpn: "", qty: 1 });
    setToast(`${modalAsignar.qty} u. movida(s) a ${modalAsignar.lpn || "LPN-######"}`);
  };

  const finalizarTarea = () => {
    setVales(prev => prev.filter(v => v.id !== currentVale.id));
    setRoute("ingreso");
    setToast("Tarea finalizada");
  };

  // ---------------------------------------------------------------------------
  if (!user) return <Login onLogin={(u)=>{ setUser(u); setRoute("home"); }} />;

  return (
    <div className="mx-auto max-w-md bg-white min-h-dvh">
      {route === "home" && <Home user={user} go={go} />}
      {route === "ingreso" && <ListaVales vales={vales} openVale={openVale} />}
      {route === "detalleVale" && currentVale && (
        <DetalleVale vale={currentVale} onBack={()=>setRoute("ingreso")} onAsignar={onAsignar} onFinalizar={finalizarTarea} />
      )}
      {route === "despacho" && <Despacho onBack={()=>setRoute("home")} onToast={(t)=>setToast(t)} />}
      {route === "reubicarLpn" && <ReubicarLPN onBack={()=>setRoute("home")} onToast={(t)=>setToast(t)} />}
      {route === "reubicarMaterial" && <ReubicarMaterial onBack={()=>setRoute("home")} onToast={(t)=>setToast(t)} />}
      {route === "consulta" && <Consulta onBack={()=>setRoute("home")} />}

      {/* Modal Asignar */}
      <Dialog open={modalAsignar.open} onOpenChange={(o)=>setModalAsignar(s => ({...s, open: o}))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Ubicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>Material: <b>{currentVale?.items[modalAsignar.itemIdx]?.mat}</b> — {materialesCatalogo[currentVale?.items[modalAsignar.itemIdx]?.mat]?.desc}</div>
            <div>Pendiente: {currentVale?.items[modalAsignar.itemIdx]?.pendiente}</div>
            <div className="space-y-1">
              <Label>Escanear LPN destino</Label>
              <div className="flex gap-2">
                <Input value={modalAsignar.lpn} onChange={(e)=>setModalAsignar(s=>({...s, lpn: e.target.value}))} placeholder="LPN-000123" />
                <Button variant="outline" onClick={()=>setModalAsignar(s=>({...s, lpn: randomLPN()}))}><Camera className="h-4 w-4"/></Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Cantidad a mover</Label>
              <QtyStepper value={modalAsignar.qty} onChange={(q)=>setModalAsignar(s=>({...s, qty: q}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={()=>setModalAsignar({ open:false, valeId:null, itemIdx:null, lpn:"", qty:1 })}>Cancelar</Button>
            <Button onClick={confirmarAsignacion}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast text={toast} onClose={()=>setToast("")} />
    </div>
  );
}
