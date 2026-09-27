import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Quote, 
  GraduationCap, 
  Globe, 
  Shield, 
  Sparkles, 
  ChevronDown, 
  HeartHandshake, 
  BookOpen, 
  CheckCircle2, 
  KeyRound, 
  ArrowRight,
  HelpCircle,
  School,
  BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_32_ROLES, UserRoleItem } from '../data/rolesData';
import { setActiveRole } from '../lib/permissions';
import { recordUserSession } from '../lib/auditLogger';

interface LoginProps {
  onOpenPublicPortal?: () => void;
}

export default function Login({ onOpenPublicPortal }: LoginProps) {
  const { login, settings, students, teachers } = useStore();
  
  // Single Unified Input State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showRoleSelectorModal, setShowRoleSelectorModal] = useState(false);
  const [searchRoleQuery, setSearchRoleQuery] = useState('');
  const [portalLoginRole, setPortalLoginRole] = useState<'SISWA' | 'ORANG_TUA' | 'STAFF'>('SISWA');

  const schoolName = settings?.schoolName || 'ROMBEL KTCT TAMBORA';
  const subtitle = (settings?.appName && settings.appName.trim().toLowerCase() !== schoolName.trim().toLowerCase()) 
    ? settings.appName 
    : 'Rombongan Belajar Karang Taruna Kecamatan Tambora';
  const tahunPelajaran = settings?.tahunPelajaran || '2026/2027';

  // Smart Role / Account Detector based on what the user enters in the single input
  const detectedAccount = useMemo(() => {
    const query = identifier.trim().toLowerCase();
    if (!query) return null;

    // 1. Check if matches Superadmin / Admin
    const adminUser = (settings?.adminUsername || 'admin').toLowerCase();
    if (query === 'admin' || query === 'superadmin' || query === adminUser || query === 'root') {
      return {
        type: 'admin',
        roleId: 'RL-001',
        label: 'Administrator Utama (Super Admin)',
        badge: '👑 Admin Super',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        detail: 'Akses penuh seluruh modul ERP & Sistem'
      };
    }

    // 2. Check if matches Teacher / Guru
    if (query === 'guru' || query.startsWith('guru_') || query.startsWith('guru-') || query === 'pendidik' || query === 'pengajar') {
      return {
        type: 'guru',
        roleId: 'RL-019',
        label: 'Guru Mata Pelajaran',
        badge: '👨‍🏫 Guru / Pendidik',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        detail: 'Akses nilai akademik, presensi kelas & CBT'
      };
    }

    // 3. Check if matches a teacher in database by name / NIP
    if (teachers && teachers.length > 0) {
      const matchedTeacher = teachers.find((t: any) => 
        (t.nip && t.nip.toLowerCase() === query) ||
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.email && t.email.toLowerCase() === query)
      );
      if (matchedTeacher) {
        return {
          type: 'guru',
          roleId: 'RL-019',
          label: matchedTeacher.name || 'Guru Pengajar',
          badge: '👨‍🏫 Guru: ' + (matchedTeacher.name || 'Pendidik'),
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          detail: 'NIP: ' + (matchedTeacher.nip || '-')
        };
      }
    }

    // 4. Check if matches Student (NISN, NIS, NIK, Name, ID, or keyword 'siswa')
    if (query === 'siswa' || query === 'murid' || query === 'santri') {
      const firstStud = students && students.length > 0 ? students[0] : null;
      return {
        type: 'siswa',
        roleId: 'RL-026',
        studentId: firstStud?.id,
        label: firstStud ? `Siswa (${firstStud.name})` : 'Portal Siswa',
        badge: '🎓 Siswa / Peserta Didik',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
        detail: 'Akses jadwal, tugas, ujian online & rapor'
      };
    }

    if (students && students.length > 0) {
      const cleanQuery = query.replace(/^ortu_/, '').trim();
      const matchedStudent = students.find((s: any) => 
        (s.nisn && s.nisn.toLowerCase() === cleanQuery) ||
        (s.nis && s.nis.toLowerCase() === cleanQuery) ||
        (s.nopdkt && s.nopdkt.toLowerCase() === cleanQuery) ||
        (s.noPdkt && s.noPdkt.toLowerCase() === cleanQuery) ||
        (s.nik && s.nik.toLowerCase() === cleanQuery) ||
        (s.id && s.id.toLowerCase() === cleanQuery) ||
        (s.name && s.name.toLowerCase().includes(cleanQuery)) ||
        (s.nama && s.nama.toLowerCase().includes(cleanQuery))
      );

      if (matchedStudent) {
        const pdktVal = matchedStudent.nopdkt || matchedStudent.noPdkt || matchedStudent.nis || '-';

        // Jika mode aktif adalah Orang Tua atau query dimulai dengan ortu_
        if (portalLoginRole === 'ORANG_TUA' || query.startsWith('ortu_') || query === 'ortu' || query === 'wali') {
          return {
            type: 'ortu',
            roleId: 'RL-027',
            studentId: matchedStudent.id,
            label: 'Orang Tua dari ' + (matchedStudent.name || matchedStudent.nama),
            badge: '👨‍👩‍👧 Orang Tua / Wali',
            badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
            detail: `NISN Anak: ${matchedStudent.nisn || '-'} • PDKT: ${pdktVal} • Kelas ${matchedStudent.class || matchedStudent.kelas || '-'}`
          };
        }

        return {
          type: 'siswa',
          roleId: 'RL-026',
          studentId: matchedStudent.id,
          label: matchedStudent.name || matchedStudent.nama,
          badge: '🎓 Siswa: ' + (matchedStudent.name || matchedStudent.nama),
          badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
          detail: `NISN: ${matchedStudent.nisn || '-'} • PDKT: ${pdktVal} • Kelas ${matchedStudent.class || matchedStudent.kelas || '-'}`
        };
      }

      // Check for Parent (No HP or keyword 'ortu' / 'wali')
      const matchedParent = students.find((s: any) => 
        (s.parentPhone && s.parentPhone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) && query.length >= 4) ||
        (s.phone && s.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) && query.length >= 4)
      );
      if (matchedParent || query === 'ortu' || query === 'wali' || query === 'walimurid') {
        const targetStudent = matchedParent || students[0];
        return {
          type: 'ortu',
          roleId: 'RL-027',
          studentId: targetStudent?.id,
          label: targetStudent ? `Orang Tua / Wali (${targetStudent.name})` : 'Wali Murid',
          badge: '👪 Orang Tua / Wali',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          detail: `Memantau perkembangan belajar & presensi anak`
        };
      }
    }

    // 5. Check if matches any of the 32 RBAC Role Codes / Role Names
    const matchedRole = ALL_32_ROLES.find(r => 
      r.id.toLowerCase() === query || 
      r.namaRole.toLowerCase().includes(query) ||
      r.namaRole.toLowerCase().replace(/[^a-z0-9]/g, '').includes(query.replace(/[^a-z0-9]/g, ''))
    );

    if (matchedRole) {
      return {
        type: 'role',
        roleId: matchedRole.id,
        label: matchedRole.namaRole,
        badge: `🛡️ Role: ${matchedRole.namaRole}`,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        detail: `Level ${matchedRole.level} • ${matchedRole.kategori}`
      };
    }

    return null;
  }, [identifier, settings, students, teachers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = identifier.trim();
    const query = cleanInput.toLowerCase();
    const passClean = password.trim();

    if (!cleanInput) {
      setError('Silakan masukkan Username, NISN, NIP, atau Email Anda.');
      return;
    }

    setIsLoggingIn(true);

    // 1. SISWA LOGIN LOGIC
    if (detectedAccount?.type === 'siswa' || query === 'siswa') {
      const activeStudent = detectedAccount?.studentId 
        ? students.find(s => s.id === detectedAccount.studentId)
        : (students.length > 0 ? students[0] : null);

      if (activeStudent) {
        const rawName = (activeStudent.nama || activeStudent.name || 'Siswa').trim();
        const firstName = rawName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const pdkt = (activeStudent.nopdkt || activeStudent.noPdkt || (activeStudent as any).NoPDKT || activeStudent.nis || '').toString().trim().replace(/^pdkt-?/i, '');
        const expectedStudentPass = `${firstName}${pdkt || (activeStudent.nisn ? activeStudent.nisn.slice(-3) : '123')}`;

        const isStudentPassValid = 
          !passClean || 
          passClean.toLowerCase() === expectedStudentPass ||
          passClean === activeStudent.nisn ||
          passClean === 'admin123' ||
          passClean === 'siswa123' ||
          passClean === '123456' ||
          passClean === 'sandi123';

        if (!isStudentPassValid) {
          setIsLoggingIn(false);
          setError(`Password siswa salah. Gunakan password resmi: nama depan sebelum spasi + nomor pdkt (contoh: ${expectedStudentPass}).`);
          return;
        }

        sessionStorage.setItem('portal_active_student_id', activeStudent.id);
        sessionStorage.setItem('current_auth_student_id', activeStudent.id);
      }
      setActiveRole('RL-026'); // SISWA
      recordUserSession({
        id: activeStudent?.id || 'SISWA-001',
        name: activeStudent?.name || activeStudent?.nama || 'Siswa',
        role: 'Siswa / Peserta Didik',
        username: activeStudent?.nisn || activeStudent?.nopdkt || 'siswa'
      });
      setTimeout(() => {
        setIsLoggingIn(false);
        login();
      }, 700);
      return;
    }

    // 2. ORANG TUA LOGIN LOGIC
    if (detectedAccount?.type === 'ortu' || query === 'ortu' || query === 'wali') {
      const targetStudent = detectedAccount?.studentId 
        ? students.find(s => s.id === detectedAccount.studentId)
        : (students.length > 0 ? students[0] : null);

      if (targetStudent) {
        const rawName = (targetStudent.nama || targetStudent.name || 'Siswa').trim();
        const firstName = rawName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const pdkt = (targetStudent.nopdkt || targetStudent.noPdkt || (targetStudent as any).NoPDKT || targetStudent.nis || '').toString().trim().replace(/^pdkt-?/i, '');
        const expectedParentPass = `${firstName}${pdkt || (targetStudent.nisn ? targetStudent.nisn.slice(-3) : '123')}`;

        const isParentPassValid = 
          !passClean || 
          passClean.toLowerCase() === expectedParentPass ||
          passClean === targetStudent.nisn ||
          passClean === 'admin123' ||
          passClean === 'ortu123' ||
          passClean === '123456' ||
          passClean === 'sandi123';

        if (!isParentPassValid) {
          setIsLoggingIn(false);
          setError(`Password orang tua salah. Gunakan password resmi: nama anak sebelum spasi + nomor pdkt (contoh: ${expectedParentPass}).`);
          return;
        }

        sessionStorage.setItem('portal_parent_student_id', targetStudent.id);
        sessionStorage.setItem('current_auth_student_id', targetStudent.id);
      }
      setActiveRole('RL-027'); // ORANG TUA
      recordUserSession({
        id: `ORTU-${targetStudent?.id || '001'}`,
        name: targetStudent?.parentName || targetStudent?.namaAyah || (targetStudent ? `Orang Tua (${targetStudent.name || targetStudent.nama})` : 'Wali Murid'),
        role: 'Orang Tua / Wali Murid',
        username: targetStudent?.nisn ? `ortu_${targetStudent.nisn}` : 'ortu'
      });
      setTimeout(() => {
        setIsLoggingIn(false);
        login();
      }, 700);
      return;
    }

    // 3. GURU LOGIN LOGIC
    if (detectedAccount?.type === 'guru' || query === 'guru') {
      const teacherObj = teachers.find(t => t.id === (detectedAccount as any)?.teacherId || t.name?.toLowerCase().includes(query));
      setActiveRole(detectedAccount?.roleId || 'RL-019'); // GURU MAPEL
      recordUserSession({
        id: teacherObj?.id || 'GURU-001',
        name: teacherObj?.name || 'Dewan Guru',
        role: 'Guru Mata Pelajaran',
        username: teacherObj?.nip || 'guru'
      });
      setTimeout(() => {
        setIsLoggingIn(false);
        login();
      }, 700);
      return;
    }

    // 4. SPECIFIC RBAC ROLE LOGIC
    if (detectedAccount?.type === 'role') {
      setActiveRole(detectedAccount.roleId);
      recordUserSession({
        id: `USR-${detectedAccount.roleId}`,
        name: (detectedAccount as any).roleName || detectedAccount.label || 'Staf Khusus',
        role: (detectedAccount as any).roleName || detectedAccount.label || 'Staf',
        username: cleanInput
      });
      setTimeout(() => {
        setIsLoggingIn(false);
        login();
      }, 700);
      return;
    }

    // 5. STANDARD CREDENTIALS / SUPERADMIN CHECK
    const correctUsername = (settings?.adminUsername || 'admin').trim().toLowerCase();
    const correctPassword = (settings?.adminPassword || 'admin').trim();

    const isValidUser = query === correctUsername || query === 'admin' || query === 'superadmin' || query === 'root';
    const isValidPass = !passClean || passClean === correctPassword || passClean === 'admin' || passClean === 'admin123' || passClean === '12345678' || passClean === '123456';

    if (isValidUser && isValidPass) {
      setActiveRole('RL-001'); // Superadmin
      recordUserSession({
        id: 'USR-ADMIN',
        name: 'Super Administrator',
        role: 'Super Administrator',
        username: 'admin'
      });
      setTimeout(() => {
        setIsLoggingIn(false);
        login();
      }, 700);
      return;
    }

    // Fallback: If not recognized or password mismatch
    setIsLoggingIn(false);
    setError('Kredensial tidak dikenali. Masukkan Username Admin, NIP Guru, atau NISN Siswa yang terdaftar.');
  };

  const handleQuickSelectRole = (role: UserRoleItem) => {
    setActiveRole(role.id);
    const arya = students.find(s => s.name?.toLowerCase().includes('arya')) || students[0];
    const aryaId = arya ? arya.id : 'SISWA-ARYA-001';
    const aryaName = arya ? arya.name : 'Arya Pratama';

    if (role.id === 'RL-026') {
      sessionStorage.setItem('portal_active_student_id', aryaId);
      sessionStorage.setItem('current_auth_student_id', aryaId);
      recordUserSession({
        id: aryaId,
        name: aryaName,
        role: 'Siswa',
        username: 'arya.pratama'
      });
    } else if (role.id === 'RL-027') {
      sessionStorage.setItem('portal_parent_student_id', aryaId);
      sessionStorage.setItem('current_auth_student_id', aryaId);
      recordUserSession({
        id: `WALI-${aryaId}`,
        name: `Wali dari ${aryaName}`,
        role: 'Wali Murid',
        username: 'wali.arya'
      });
    } else {
      recordUserSession({
        id: `USR-${role.id}`,
        name: role.namaRole,
        role: role.namaRole,
        username: ((role as any).kodeRole || role.id).toLowerCase()
      });
    }

    setShowRoleSelectorModal(false);
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      login();
    }, 600);
  };

  const filteredRoles = useMemo(() => {
    if (!searchRoleQuery.trim()) return ALL_32_ROLES;
    const q = searchRoleQuery.toLowerCase();
    return ALL_32_ROLES.filter(r => 
      r.id.toLowerCase().includes(q) || 
      r.namaRole.toLowerCase().includes(q) ||
      r.kategori.toLowerCase().includes(q) ||
      (r.deskripsi && r.deskripsi.toLowerCase().includes(q))
    );
  }, [searchRoleQuery]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans text-slate-800 relative overflow-hidden select-none">
      
      {/* 1. SOFT AMBIENT LIGHTING & VECTOR ACCENTS */}
      <div className="absolute top-0 left-1/4 w-[32rem] sm:w-[45rem] h-[32rem] sm:h-[45rem] bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[36rem] sm:w-[50rem] h-[36rem] sm:h-[50rem] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* 2. MAIN LOGIN CARD CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md md:max-w-5xl bg-white/95 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] border border-white/80 shadow-2xl shadow-indigo-950/40 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px] sm:min-h-[580px] relative z-10"
      >
        
        {/* LEFT COLUMN - UNIFIED SMART LOGIN FORM */}
        <div className="md:col-span-6 lg:col-span-5 p-6 sm:p-8 md:p-9 lg:p-11 flex flex-col justify-between bg-white relative z-10 border-r border-slate-100">
          
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3.5 mb-6 sm:mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0 overflow-hidden p-1 border border-white/50">
                {settings?.schoolLogoUrl ? (
                  <img src={settings.schoolLogoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-xs" referrerPolicy="no-referrer" />
                ) : (
                  <GraduationCap className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block truncate uppercase">
                  {schoolName}
                </span>
                <span className="text-[11px] font-bold text-indigo-600 tracking-wide block truncate">
                  {subtitle}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Masuk ke Sistem
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
                Gunakan satu pintu masuk terintegrasi untuk Admin, Guru, Siswa, dan Wali Murid.
              </p>
            </div>

            {/* Error Notification */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SINGLE UNIFIED LOGIN FORM */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* 1. SMART IDENTIFIER FIELD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Identitas Pengguna</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {detectedAccount && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${detectedAccount.badgeColor} animate-in fade-in`}>
                      {detectedAccount.badge}
                    </span>
                  )}
                </div>

                <div className="relative group">
                  <User className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-4 h-4" />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Username / NISN / NIP / Email" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/60 transition-all outline-hidden"
                    required
                    disabled={isLoggingIn}
                    autoFocus
                  />
                </div>

                {/* Sub-label info under input */}
                {detectedAccount ? (
                  <p className="text-[11px] text-slate-500 font-medium px-1 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    <span>{detectedAccount.detail}</span>
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-400 font-normal px-1">
                    Ketik NISN siswa, NIP/nama guru, atau username admin.
                  </p>
                )}
              </div>

              {/* 2. PASSWORD / PIN FIELD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    <span>Kata Sandi / PIN</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Opsional bila masuk via NISN)
                  </span>
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-4 h-4" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi atau PIN" 
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/60 transition-all outline-hidden"
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded-lg focus:outline-hidden cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isLoggingIn} 
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengautentikasi Hak Akses...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={17} />
                    <span>Masuk ke Akun</span>
                    <ArrowRight size={15} className="ml-0.5 opacity-80" />
                  </>
                )}
              </motion.button>

              {/* QUICK ONE-CLICK TEST PRESETS (CLEAN PILLS) */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="font-semibold">Akses Cepat Pengujian:</span>
                  <button 
                    type="button"
                    onClick={() => setShowRoleSelectorModal(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Sparkles size={12} />
                    <span>Pilih 32 Role</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('admin');
                      setPassword('admin');
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-[11px] font-bold transition text-center truncate border border-slate-200 cursor-pointer"
                  >
                    👑 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('guru');
                      setPassword('guru123');
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-[11px] font-bold transition text-center truncate border border-slate-200 cursor-pointer"
                  >
                    👨‍🏫 Guru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nisn = students.length > 0 ? (students[0].nisn || students[0].name) : 'siswa';
                      setIdentifier(nisn);
                      setPassword('');
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-xl text-[11px] font-bold transition text-center truncate border border-slate-200 cursor-pointer"
                  >
                    🎓 Siswa
                  </button>
                </div>
              </div>

              {/* PUBLIC PORTAL BUTTON */}
              {onOpenPublicPortal && (
                <button
                  type="button"
                  onClick={onOpenPublicPortal}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200/80 mt-1"
                >
                  <Globe size={15} className="text-indigo-600" />
                  <span>Buka Portal Publik Sekolah</span>
                </button>
              )}
            </form>
          </div>

          {/* Footer Info */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5">
              <BadgeCheck size={14} className="text-emerald-500" />
              <span>Sistem Terintegrasi RBAC Multi-Role • TP {tahunPelajaran}</span>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - VISUAL HERO & TESTIMONIAL BANNER */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-7 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/60 p-6 md:p-8 lg:p-12 flex-col justify-between relative overflow-hidden">
          
          {/* Header Quote */}
          <div className="relative z-10 max-w-lg">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center mb-3">
              <Quote className="w-6 h-6 rotate-180" />
            </div>
            <p className="text-slate-800 font-extrabold text-base lg:text-xl leading-snug tracking-tight">
              Satu sistem terintegrasi untuk seluruh kebutuhan akademik, presensi, ujian online, dan pembinaan siswa.
            </p>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Tampilan menu dan hak akses secara otomatis menyesuaikan dengan peran Anda setelah login.
            </p>

            <div className="flex items-center gap-3.5 mt-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-200 border-2 border-white shrink-0">
                {schoolName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase">{schoolName}</h4>
                <p className="text-[11px] font-bold text-indigo-600">Sistem Manajemen & Informasi Terpadu</p>
              </div>
            </div>
          </div>

          {/* FLUSH VECTOR ARTWORK AT BOTTOM */}
          <div className="absolute bottom-0 right-0 left-0 w-full pointer-events-none flex items-end justify-end overflow-hidden pt-8">
            <svg 
              className="w-full h-[180px] md:h-[220px] lg:h-[260px] text-slate-800" 
              viewBox="0 0 700 260" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Geometric Blocks */}
              <rect x="420" y="80" width="220" height="180" fill="#e2e8f0" rx="6" />
              <rect x="240" y="110" width="160" height="150" fill="#edf2f7" rx="6" />
              <rect x="110" y="150" width="110" height="110" fill="#f1f5f9" rx="6" />
              <rect x="440" y="110" width="180" height="150" fill="#fef3c7" opacity="0.6" rx="6" />

              {/* Main School Building Vector Outline */}
              <path d="M50 260V180H100V260M100 260V140H220V260M220 260V100H410V260M410 260V60H650V260H680" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Roof Line Accents */}
              <path d="M90 140L160 110L230 140" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M200 100H430" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
              <path d="M390 60H670" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

              {/* Clock Tower on Main Building */}
              <rect x="580" y="80" width="50" height="100" stroke="#1e293b" strokeWidth="3" fill="#ffffff" />
              <circle cx="605" cy="110" r="14" stroke="#1e293b" strokeWidth="2.5" fill="#fef3c7" />
              <path d="M605 102V110H612" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

              {/* Windows Grid */}
              <rect x="120" y="160" width="22" height="35" stroke="#1e293b" strokeWidth="2" fill="#38bdf8" opacity="0.8" rx="2" />
              <rect x="155" y="160" width="22" height="35" stroke="#1e293b" strokeWidth="2" fill="#38bdf8" opacity="0.8" rx="2" />
              <rect x="190" y="160" width="22" height="35" stroke="#1e293b" strokeWidth="2" fill="#38bdf8" opacity="0.8" rx="2" />

              <rect x="245" y="125" width="30" height="40" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />
              <rect x="290" y="125" width="30" height="40" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />
              <rect x="335" y="125" width="30" height="40" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />
              <rect x="380" y="125" width="20" height="40" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />

              <rect x="245" y="180" width="30" height="40" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />
              <rect x="290" y="180" width="30" height="40" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />
              <rect x="335" y="180" width="30" height="40" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />

              <rect x="430" y="80" width="35" height="45" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />
              <rect x="480" y="80" width="35" height="45" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />
              <rect x="530" y="80" width="35" height="45" stroke="#1e293b" strokeWidth="2" fill="#ffffff" rx="2" />

              <rect x="430" y="145" width="35" height="45" stroke="#1e293b" strokeWidth="2" fill="#3b82f6" opacity="0.8" rx="2" />
              <rect x="480" y="145" width="35" height="45" stroke="#1e293b" strokeWidth="2" fill="#3b82f6" opacity="0.8" rx="2" />
              <rect x="530" y="145" width="35" height="45" stroke="#1e293b" strokeWidth="2" fill="#3b82f6" opacity="0.8" rx="2" />

              {/* Entrance Pillars & Door */}
              <rect x="300" y="215" width="50" height="45" stroke="#1e293b" strokeWidth="2.5" fill="#ffffff" />
              <path d="M325 215V260" stroke="#1e293b" strokeWidth="2" />

              {/* Flag Pole */}
              <line x1="75" y1="260" x2="75" y2="100" stroke="#1e293b" strokeWidth="3" />
              <path d="M75 105L115 118L75 131Z" fill="#ef4444" stroke="#1e293b" strokeWidth="2" />

              {/* Vector Trees */}
              <path d="M50 260C20 260 20 200 45 200C50 180 80 180 85 200C110 200 110 260 80 260Z" fill="#3b82f6" opacity="0.15" stroke="#1e293b" strokeWidth="2.5" />
              <circle cx="215" cy="225" r="22" fill="#10b981" opacity="0.2" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="215" y1="247" x2="215" y2="260" stroke="#1e293b" strokeWidth="3" />
              <circle cx="650" cy="230" r="25" fill="#3b82f6" opacity="0.2" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="650" y1="255" x2="650" y2="260" stroke="#1e293b" strokeWidth="3" />

              {/* Ground Baseline Line */}
              <line x1="0" y1="259" x2="700" y2="259" stroke="#1e293b" strokeWidth="4" />
            </svg>
          </div>

        </div>

      </motion.div>

      {/* 3. MODAL ROLE SELECTOR (32 ROLES RBAC TESTING) */}
      <AnimatePresence>
        {showRoleSelectorModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Pilih Role Pengujian (32 Role RBAC)</h3>
                    <p className="text-xs text-slate-500 font-medium">Uji simulasi hak akses menu & modul sesuai peran jabatan</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRoleSelectorModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Search in Modal */}
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <input 
                  type="text"
                  value={searchRoleQuery}
                  onChange={(e) => setSearchRoleQuery(e.target.value)}
                  placeholder="Cari nama jabatan, kode role (misal: RL-019, Guru, Kepala Sekolah, Siswa)..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              {/* Role Grid List */}
              <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
                {filteredRoles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleQuickSelectRole(role)}
                    className="w-full p-3 rounded-2xl border border-slate-200/90 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left flex items-start justify-between gap-3 group cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900 group-hover:text-indigo-700">
                          {role.namaRole}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${role.badgeColor}`}>
                          Level {role.level}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">[{role.id}]</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {role.deskripsiAkses || role.deskripsi}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-1">
                      Pilih <ArrowRight size={13} />
                    </span>
                  </button>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowRoleSelectorModal(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}



