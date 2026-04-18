import fs from 'fs';
let code = fs.readFileSync('src/App.jsx', 'utf-8');

const lucideImport = `import { 
  CheckCircle, StopCircle, Play, Coffee, User, Briefcase, Calendar, 
  Download, Clock, Check, X, Inbox, ClipboardList, IndianRupee, 
  Users, Settings, LayoutDashboard, Timer, Phone, Mail, MapPin, 
  Edit2, Trash2, Flag, Eye, EyeOff, ChevronLeft, ChevronRight, LogOut 
} from "lucide-react";\n`;

code = code.replace(/import \{ initializeApp \} from "firebase\/app";/, lucideImport + 'import { initializeApp } from "firebase/app";');

code = code.replace(/✅ &nbsp;/g, '<CheckCircle size={16} />&nbsp;');
code = code.replace(/✅/g, '<CheckCircle size={16} style={{display:"inline", verticalAlign:"middle", marginRight:4}} />');
code = code.replace(/🔴 &nbsp;/g, '<StopCircle size={16} />&nbsp;');
code = code.replace(/▶️ &nbsp;/g, '<Play size={16} />&nbsp;');
code = code.replace(/☕ &nbsp;/g, '<Coffee size={16} />&nbsp;');

code = code.replace(/<span style=\{\{fontSize:18\}\}>🧑‍💼<\/span>/g, '<User size={18} />');
code = code.replace(/<span style=\{\{fontSize:18\}\}>👔<\/span>/g, '<Briefcase size={18} />');
code = code.replace(/<span style=\{\{fontSize:16\}\}>👤<\/span>/g, '<User size={16} />');
code = code.replace(/\{sess \? <span className="live-dot" style=\{\{width:10,height:10\}\}\/> : "👤"\}/g, '{sess ? <span className="live-dot" style={{width:10,height:10}}/> : <User size={18} />}');
code = code.replace(/👤/g, '<User size={20} />');

code = code.replace(/<div style=\{\{fontSize:36\}\}>📅<\/div>/g, '<div style={{color:"var(--gold)"}}><Calendar size={36} /></div>');
code = code.replace(/<div style=\{\{fontSize:20,marginBottom:8,opacity:\.7\}\}>\{s\.icon\}<\/div>/g, '<div style={{color:s.color, marginBottom:8}}>{s.icon}</div>');
code = code.replace(/<div style=\{\{position:"absolute",bottom:-10,right:-10,fontSize:48,opacity:\.04\}\}>\{s\.icon\}<\/div>/g, '<div style={{position:"absolute",bottom:-10,right:-10,opacity:.04, transform:"scale(3)"}}>{s.icon}</div>');

code = code.replace(/icon:"⭕"/g, 'icon:<LayoutDashboard size={14} />');
code = code.replace(/icon:"⏱"/g, 'icon:<Timer size={14} />');
code = code.replace(/icon:"📋"/g, 'icon:<ClipboardList size={14} />');
code = code.replace(/icon:"₹"/g, 'icon:<IndianRupee size={14} />');
code = code.replace(/icon:"📥"/g, 'icon:<Inbox size={14} />');
code = code.replace(/icon:"👥"/g, 'icon:<Users size={14} />');
code = code.replace(/icon:"📅"/g, 'icon:<Calendar size={14} />');
code = code.replace(/icon:"💸"/g, 'icon:<IndianRupee size={14} />');
code = code.replace(/icon:"⚙️"/g, 'icon:<Settings size={14} />');

code = code.replace(/⬇ Export CSV/g, '<Download size={14}/> Export CSV');
code = code.replace(/⬇ Export/g, '<Download size={14}/> Export');

code = code.replace(/← Prev/g, '<ChevronLeft size={14}/> Prev');
code = code.replace(/Next →/g, 'Next <ChevronRight size={14}/>');
code = code.replace(/← Back/g, '<ChevronLeft size={14}/> Back');

code = code.replace(/✓ Approve/g, '<Check size={14}/> Approve');
code = code.replace(/✕ Reject/g, '<X size={14}/> Reject');
code = code.replace(/✓ Mark Paid/g, '<Check size={14}/> Mark Paid');
code = code.replace(/✕ Cancel/g, '<X size={14}/> Cancel');

code = code.replace(/✓ /g, '<Check size={14} style={{verticalAlign:"middle", marginTop:"-2px"}}/> ');
code = code.replace(/✕ /g, '<X size={14} style={{verticalAlign:"middle", marginTop:"-2px"}}/> ');
code = code.replace(/⚑ /g, '<Flag size={12} style={{verticalAlign:"middle", marginTop:"-2px"}}/> ');
code = code.replace(/⏳ /g, '<Clock size={14} style={{verticalAlign:"middle", marginTop:"-2px"}}/> ');

code = code.replace(/📞 /g, '<Phone size={12}/> ');
code = code.replace(/✉️ /g, '<Mail size={12}/> ');
code = code.replace(/⚧ /g, '<Users size={12}/> ');
code = code.replace(/📍 /g, '<MapPin size={12}/> ');

code = code.replace(/>✎</g, '><Edit2 size={12}/><');
code = code.replace(/>🗑</g, '><Trash2 size={12}/><');
code = code.replace(/>✕</g, '><X size={12}/><');

code = code.replace(/"👁️"/g, '<Eye size={16}/>');
code = code.replace(/"🙈"/g, '<EyeOff size={16}/>');
code = code.replace(/⬇️ Install Amigos App/g, '<Download size={14}/> Install Amigos App');

code = code.replace(/<h3 style=\{\{fontSize:20,marginBottom:20\}\}>Leave Requests<\/h3>/g, '<h3 style={{fontSize:20,marginBottom:20,textAlign:"left"}}>Leave Requests</h3>');
code = code.replace(/<h3 style=\{\{fontSize:20,marginBottom:0\}\}>Salary Advances<\/h3>/g, '<h3 style={{fontSize:20,marginBottom:0,textAlign:"left"}}>Salary Advances</h3>');

fs.writeFileSync('src/App.jsx', code);
console.log('done');
