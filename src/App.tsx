/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw, 
  BookOpen, 
  Clock, 
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Settings,
  Moon,
  Sun,
  PieChart,
  Brain,
  Coffee,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subject, Task, StudyStats } from './types';

// Constants
const POMODORO_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;

export default function App() {
  // State: Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  
  // State: UI
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'subjects'>('dashboard');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  
  // State: Pomodoro
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Persistence: Load
  useEffect(() => {
    const savedSubjects = localStorage.getItem('study_subjects');
    const savedTasks = localStorage.getItem('study_tasks');
    const savedTheme = localStorage.getItem('study_theme');

    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    // Defaulting to dark as per the theme, but keeping preference
    if (savedTheme === 'light') setDarkMode(false);
  }, []);

  // Persistence: Save
  useEffect(() => {
    localStorage.setItem('study_subjects', JSON.stringify(subjects));
    localStorage.setItem('study_tasks', JSON.stringify(tasks));
    localStorage.setItem('study_theme', darkMode ? 'dark' : 'light');
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [subjects, tasks, darkMode]);

  // Timer Logic
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMode === 'focus' ? POMODORO_TIME : SHORT_BREAK);
  };

  const switchMode = useCallback((mode: 'focus' | 'break') => {
    setTimerMode(mode);
    setTimeLeft(mode === 'focus' ? POMODORO_TIME : SHORT_BREAK);
    setIsTimerRunning(false);
  }, []);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play();
      switchMode(timerMode === 'focus' ? 'break' : 'focus');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft, timerMode, switchMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Actions
  const addSubject = (name: string, color: string) => {
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name,
      color,
    };
    setSubjects([...subjects, newSubject]);
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
    setTasks(tasks.filter(t => t.subjectId !== id));
  };

  const addTask = (topic: string, subjectId: string, estimatedTime: number) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      topic,
      subjectId,
      estimatedTime,
      completed: false,
      date: new Date().toISOString().split('T')[0],
    };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Stats
  const stats: StudyStats = {
    totalMinutes: tasks.filter(t => t.completed).reduce((acc, t) => acc + t.estimatedTime, 0),
    completedTasks: tasks.filter(t => t.completed).length,
    totalTasks: tasks.length,
  };

  const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  // Timer Progress Calculation
  const timerTotal = timerMode === 'focus' ? POMODORO_TIME : SHORT_BREAK;
  const timerProgress = (timeLeft / timerTotal) * 100;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 bg-slate-950 text-slate-200`}>
      
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">StudyFlow</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SideNavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <SideNavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar />} label="Cronograma" />
          <SideNavButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} icon={<PieChart />} label="Disciplinas" />
        </nav>

        <div className="p-6">
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Minhas Matérias</p>
            <ul className="space-y-3">
              {subjects.slice(0, 5).map(s => (
                <li key={s.id} className="flex items-center gap-3 text-xs font-medium text-slate-400">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  {s.name}
                </li>
              ))}
              {subjects.length === 0 && <li className="text-[10px] text-slate-600 italic">Nenhuma matéria</li>}
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem('study_user_seed') || 'study'}`} alt="Avatar" />
            </div>
            <span className="text-xs font-bold text-white">Estudante</span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 transition-colors hover:text-white">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex justify-around items-center p-4">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Início" />
        <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar />} label="Agenda" />
        <NavButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} icon={<PieChart />} label="Matérias" />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-24 md:pb-10">
          
          {/* Header Area */}
          <header className="mb-10 lg:mb-14">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                  {activeTab === 'dashboard' && "Boas vindas!"}
                  {activeTab === 'calendar' && "Seu Cronograma"}
                  {activeTab === 'subjects' && "Minhas Matérias"}
                </h1>
                <p className="text-slate-400 mt-2 font-medium">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Foco Diário</p>
                    <p className="text-xl font-black text-indigo-400 font-mono">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
                 </div>
                 <div className="w-1.5 h-10 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 w-full h-2/3"></div>
                 </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  label="Progresso Diário" 
                  value={`${Math.round(progress)}%`} 
                  icon={<PieChart className="text-indigo-400" />}
                  bgColor="bg-indigo-500/10"
                />
                <StatCard 
                  label="Horas Estudadas" 
                  value={`${Math.floor(stats.totalMinutes / 60)}h`} 
                  icon={<Clock className="text-slate-400" />}
                  bgColor="bg-slate-800"
                />
                <StatCard 
                  label="Tarefas Pendentes" 
                  value={`${stats.totalTasks - stats.completedTasks}`} 
                  icon={<Calendar className="text-amber-500" />}
                  bgColor="bg-amber-500/10"
                />
                <div className="bg-indigo-600 rounded-[28px] p-6 shadow-xl shadow-indigo-950/20 flex flex-col justify-between">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Status Geral</p>
                  <span className="text-lg font-bold text-white truncate">
                    {progress === 100 ? 'Meta Concluída!' : 'Faltam ' + (stats.totalTasks - stats.completedTasks) + ' tarefas'}
                  </span>
                </div>
              </div>
            )}
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-12 gap-8"
              >
                {/* Daily Schedule Section */}
                <section className="col-span-12 lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Agenda do Dia</h2>
                    <button 
                      onClick={() => setShowAddTask(true)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all border border-slate-700"
                    >
                      + Nova Tarefa
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {tasks.length > 0 ? (
                      tasks.slice(0, 6).map((task) => (
                        <TaskItem 
                          key={task.id} 
                          task={task} 
                          subject={subjects.find(s => s.id === task.subjectId)}
                          onToggle={() => toggleTask(task.id)}
                          onDelete={() => deleteTask(task.id)}
                        />
                      ))
                    ) : (
                      <EmptyState message="Sua agenda está limpa por enquanto." />
                    )}
                  </div>
                </section>

                {/* Focus Sidebar Section */}
                <section className="col-span-12 lg:col-span-4 space-y-8">
                  {/* Pomodoro Timer Card */}
                  <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[40px] p-10 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -z-10 group-hover:bg-indigo-500/30 transition-colors" />
                    
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6 block">Timer Pomodoro</span>
                    
                    <div className="relative inline-flex items-center justify-center mb-10">
                      <svg className="w-48 h-48 -rotate-90">
                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                        <motion.circle 
                          cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" 
                          className="text-indigo-500" 
                          strokeDasharray="552.92" 
                          initial={{ strokeDashoffset: 552.92 }}
                          animate={{ strokeDashoffset: 552.92 - (552.92 * (100 - timerProgress)) / 100 }}
                          transition={{ duration: 0.5 }}
                        />
                      </svg>
                      <span className="absolute text-5xl font-mono font-black tracking-tighter text-white tabular-nums">
                        {formatTime(timeLeft)}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={toggleTimer}
                        className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                          isTimerRunning ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-500'
                        }`}
                      >
                        {isTimerRunning ? 'Pausar' : 'Iniciar'}
                      </button>
                      <button 
                        onClick={resetTimer}
                        className="w-14 h-14 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700"
                      >
                        <RotateCcw className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    <div className="flex justify-center gap-6 mt-8">
                      <button onClick={() => switchMode('focus')} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${timerMode === 'focus' ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}>Foco</button>
                      <button onClick={() => switchMode('break')} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${timerMode === 'break' ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}>Pausa</button>
                    </div>
                  </div>

                  {/* Focus Stats Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
                    <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      Estatísticas de Foco
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                        <span className="text-2xl font-black text-white">{stats.completedTasks}</span>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mt-1">Sessões</span>
                      </div>
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                        <span className="text-2xl font-black text-white">{stats.totalMinutes}</span>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mt-1">Minutos</span>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'subjects' && (
              <motion.div 
                key="subjects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                <button 
                  onClick={() => setShowAddSubject(true)}
                  className="h-56 border-2 border-dashed border-slate-800 rounded-[40px] flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors border border-slate-800">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold tracking-tight">Nova Matéria</span>
                </button>

                {subjects.map((subject) => (
                  <div key={subject.id} className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] relative group overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full ${subject.color}`} />
                    <div className="flex justify-between items-start mb-8">
                      <h3 className="font-black text-2xl tracking-tight text-white">{subject.name}</h3>
                      <button 
                        onClick={() => deleteSubject(subject.id)}
                        className="p-3 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <span>{tasks.filter(t => t.subjectId === subject.id).length} Tópicos</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div 
                 key="calendar"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
              >
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-2xl font-black tracking-tight text-white">Cronograma Completo</h2>
                  <button 
                    onClick={() => setShowAddTask(true)}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
                  >
                    + Criar Tarefa
                  </button>
                </div>

                <div className="space-y-4">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        subject={subjects.find(s => s.id === task.subjectId)}
                        onToggle={() => toggleTask(task.id)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[40px] p-20 flex flex-col items-center text-center">
                       <EmptyState message="Sua agenda está esperando por novos desafios." />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals with Dark Aesthetic */}
      <Modal isOpen={showAddSubject} onClose={() => setShowAddSubject(false)} title="Criar Nova Matéria">
        <SubjectForm onSubmit={(name, color) => {
          addSubject(name, color);
          setShowAddSubject(false);
        }} />
      </Modal>

      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="Novo Planejamento">
        <TaskForm 
          subjects={subjects}
          onSubmit={(topic, subjectId, time) => {
            addTask(topic, subjectId, time);
            setShowAddTask(false);
          }} 
        />
      </Modal>
    </div>
  );
}

// Subcomponents

function SideNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
        active 
          ? 'bg-slate-800 text-white shadow-lg shadow-black/20' 
          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <span className={active ? 'text-indigo-400' : ''}>{icon}</span>
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-all px-4 py-2 ${
        active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, bgColor }: { label: string, value: string, icon: ReactNode, bgColor: string }) {
  return (
    <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-sm flex flex-col items-start">
      <div className={`p-3 ${bgColor} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <span className="text-3xl font-black tracking-tighter text-white tabular-nums">{value}</span>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{label}</span>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  subject?: Subject;
  onToggle: () => void;
  onDelete: () => void;
  key?: string;
}

function TaskItem({ task, subject, onToggle, onDelete }: TaskItemProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group bg-slate-900 p-5 rounded-2xl border transition-all flex items-center gap-5 hover:bg-slate-800/80 ${
        task.completed ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-slate-700 shadow-sm'
      }`}
    >
      <button onClick={onToggle} className="flex-shrink-0 transition-transform active:scale-90">
        {task.completed ? (
          <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-lg border-2 border-slate-700 group-hover:border-indigo-400 transition-colors" />
        )}
      </button>
      
      <div className="flex-grow min-w-0">
        <h4 className={`text-base font-bold tracking-tight ${task.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {task.topic}
        </h4>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${subject?.color || 'bg-slate-700'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {subject?.name || 'Geral'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Clock className="w-3 h-3 text-indigo-400" />
            {task.estimatedTime} min
          </div>
        </div>
      </div>

      <button 
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-600">
      <Brain className="w-16 h-16 mb-6 opacity-30 text-indigo-400" />
      <p className="text-sm font-bold uppercase tracking-widest leading-loose max-w-xs">{message}</p>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-slate-900 w-full max-w-lg rounded-[48px] shadow-2xl p-10 lg:p-12 border border-slate-800"
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-white">{title}</h2>
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function SubjectForm({ onSubmit }: { onSubmit: (name: string, color: string) => void }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-indigo-600');
  const colors = [
    'bg-indigo-600', 'bg-rose-600', 'bg-emerald-600', 'bg-amber-600', 
    'bg-sky-600', 'bg-violet-600', 'bg-orange-600', 'bg-fuchsia-600'
  ];

  return (
    <form onSubmit={(e) => { e.preventDefault(); if(name) onSubmit(name, selectedColor); }} className="space-y-10">
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Identificação</label>
        <input 
          autoFocus
          className="w-full bg-slate-800/50 border border-slate-800 text-white placeholder-slate-600 rounded-3xl p-6 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-slate-800 transition-all font-bold text-lg"
          placeholder="Ex: Arquitetura de Dados"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Paleta Institucional</label>
        <div className="grid grid-cols-4 gap-4">
          {colors.map(color => (
            <button 
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`h-16 rounded-[24px] transition-all transform hover:scale-105 active:scale-95 ${color} ${selectedColor === color ? 'ring-4 ring-offset-4 ring-indigo-500 ring-offset-slate-900 shadow-2xl' : 'opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}
            />
          ))}
        </div>
      </div>
      <button 
        type="submit"
        disabled={!name}
        className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:scale-100 transition-all text-lg"
      >
        Publicar Matéria
      </button>
    </form>
  );
}

function TaskForm({ subjects, onSubmit }: { subjects: Subject[], onSubmit: (topic: string, subjectId: string, time: number) => void }) {
  const [topic, setTopic] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [time, setTime] = useState(30);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if(topic && subjectId) onSubmit(topic, subjectId, time); }} className="space-y-10">
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">O que vamos aprender?</label>
        <input 
          autoFocus
          className="w-full bg-slate-800/50 border border-slate-800 text-white placeholder-slate-600 rounded-3xl p-6 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-slate-800 transition-all font-bold text-lg"
          placeholder="Ex: Revisar Redux Toolkit"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Domínio de Estudo</label>
        <select 
          className="w-full bg-slate-800/50 border border-slate-800 text-white rounded-3xl p-6 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-slate-800 transition-all font-bold text-lg appearance-none cursor-pointer"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          {subjects.length > 0 ? (
            subjects.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)
          ) : (
            <option disabled value="">Cadastre uma matéria primeiro</option>
          )}
        </select>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center ml-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estimativa de Foco</label>
          <span className="font-black text-indigo-400 text-lg font-mono">{time}m</span>
        </div>
        <input 
          type="range"
          min="5" max="180" step="5"
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          value={time}
          onChange={(e) => setTime(parseInt(e.target.value))}
        />
      </div>
      <button 
        type="submit"
        disabled={!topic || !subjectId}
        className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 transition-all text-lg"
      >
        Confirmar Planejamento
      </button>
    </form>
  );
}

// Final components and helpers below
