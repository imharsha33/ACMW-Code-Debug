import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  HelpCircle,
  PlayCircle,
  User,
  LogOut,
  Sliders,
  Award,
  Users,
  ShieldAlert,
  RotateCcw,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AcmwBrand } from "./AcmwBrand";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    session,
    logout,
    registeredStudents,
    addStudentUser,
    deleteStudentUser,
    adminResetStudentViolations,
    assessmentSettings,
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCandidatesDrawerOpen, setIsCandidatesDrawerOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const isAdmin = session?.role === "admin";

  const studentNav = [
    { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { label: "Live Assessment", path: "/student/assessment", icon: PlayCircle },
    { label: "My Profile", path: "/student/profile", icon: User },
  ];

  const adminNav = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Assessments", path: "/admin/assessments", icon: Sliders },
    { label: "Questions Bank", path: "/admin/questions", icon: HelpCircle },
    { label: "Assessment Config", path: "/admin/assessment-settings", icon: Sliders },
    { label: "Live Results", path: "/admin/results", icon: Award },
    { label: "My Profile", path: "/admin/profile", icon: User },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <div className="flex h-screen w-screen min-w-full overflow-hidden bg-slate-50 text-slate-900 font-sans">

      {/* Sidebar (Dark Charcoal Theme) */}
      <aside className="w-64 shrink-0 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 shadow-lg">
        {/* Brand Header: Top Left ACM-W Badge directly in front */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center">
          <AcmwBrand size="sm" badgeSize={38} showSubline sublineText={isAdmin ? "Admin Portal" : "Student Platform"} isDark />
        </div>


        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 ${
                  active
                    ? "bg-[#FF6B00] text-white shadow-md pl-3"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && registeredStudents && (
            <button
              onClick={() => setIsCandidatesDrawerOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all duration-150 border-none cursor-pointer text-left bg-transparent"
            >
              <Users size={16} className="text-slate-400" />
              <span>Manage Candidates</span>
              {registeredStudents.some((s) => s.isBlocked) && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-black text-white truncate">{session?.name}</p>
            <p className="text-[11px] font-medium text-slate-400 truncate">{session?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="p-2 text-slate-400 hover:text-[#FF6B00] hover:bg-slate-800 active:scale-95 transition-all rounded-lg border-none bg-transparent cursor-pointer"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area (Full Screen Width Clean Surface) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/70">
        <div className="p-6 md:p-8 w-full max-w-full">{children}</div>
      </main>

      {/* Candidates Drawer Overlay */}
      {isCandidatesDrawerOpen && isAdmin && registeredStudents && (
        <>
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsCandidatesDrawerOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-96 bg-slate-900 text-slate-100 shadow-2xl z-50 border-l border-slate-800 flex flex-col transition-all duration-300">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#FF6B00]" />
                <h3 className="text-sm font-black text-white tracking-tight">Candidate Control</h3>
              </div>
              <button 
                onClick={() => setIsCandidatesDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Card 1: Proctoring Alerts / Blocked Candidates */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldAlert size={14} className="text-red-500 animate-pulse" /> Proctoring Alerts
                </h4>
                
                {registeredStudents.filter((s) => s.isBlocked).length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-800 rounded-lg bg-slate-900/40">
                    <p className="text-xs font-semibold text-slate-400">No Blocked Students</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">All candidate sessions are currently active.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-red-950 bg-red-950/40 p-3 text-[10px] text-red-300 leading-normal space-y-1">
                      <p className="font-bold flex items-center gap-1 text-red-200">
                        <ShieldAlert size={12} /> Student Violation Override Needed
                      </p>
                      <p className="font-semibold text-red-400">
                        A student session was locked due to exceeding tab switch limit. Reset violations to grant re-entry.
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {registeredStudents.filter((s) => s.isBlocked).map((student) => (
                        <div key={student.email} className="p-2.5 rounded-lg border border-red-950 bg-red-950/20 flex flex-col gap-2">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-red-200 truncate">{student.email}</p>
                            <p className="text-[10px] font-semibold text-red-400">
                              Violations: {student.tabSwitchCount} tab switches
                            </p>
                          </div>
                          <button 
                            onClick={() => adminResetStudentViolations(student.email)}
                            className="w-full btn-danger text-[10px] py-1 bg-red-600 hover:bg-red-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer border-none"
                          >
                            <RotateCcw size={10} /> Reset &amp; Unlock
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Add Candidate Form */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Plus size={14} className="text-[#FF6B00]" /> Add Candidate
                </h4>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newEmail && newPassword) {
                      addStudentUser(newEmail, newPassword);
                      setNewEmail("");
                      setNewPassword("");
                    }
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Student Email</label>
                    <input 
                      type="email" 
                      required 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="candidate@klu.ac.in" 
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition-all font-semibold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Student Password</label>
                    <input 
                      type="text" 
                      required 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter password" 
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition-all font-semibold"
                    />
                  </div>
                  
                  <button type="submit" className="w-full btn-primary text-xs py-2 bg-[#FF6B00] hover:bg-orange-700 font-bold border-orange-500 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
                    <Plus size={12} /> Add Candidate
                  </button>
                </form>
              </div>

              {/* Card 3: Student User Directory */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <Users size={14} className="text-[#FF6B00]" /> Candidate Directory
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                    {registeredStudents.length} Total
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {registeredStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 font-medium p-3 text-center">No candidates registered.</p>
                  ) : (
                    registeredStudents.map((student) => (
                      <div key={student.email} className="p-3 rounded-lg border border-slate-800 bg-slate-950/20 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{student.email}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate">Password: <span className="font-mono">{student.pass}</span></p>
                          </div>
                          {student.isBlocked ? (
                            <span className="inline-flex shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950 text-red-400 border border-red-900/60">
                              Locked
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/60">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900 font-medium">
                          <span>Violations: {student.tabSwitchCount} / {assessmentSettings.tabSwitchLimit ?? 3}</span>
                          <div className="flex items-center gap-2">
                            {student.isBlocked && (
                              <button 
                                onClick={() => adminResetStudentViolations(student.email)}
                                className="text-orange-400 hover:text-orange-300 flex items-center gap-0.5 font-bold transition-colors border-none bg-transparent cursor-pointer"
                              >
                                <RotateCcw size={10} /> Reset
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete candidate ${student.email}? This will remove them from Firebase permanently.`)) {
                                  deleteStudentUser(student.email);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 flex items-center gap-0.5 font-bold transition-colors border-none bg-transparent cursor-pointer"
                              title="Delete candidate account permanently from Firebase"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


