import React, { useState, useEffect } from 'react'
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { startOfWeek, addDays, getDay, format } from 'date-fns'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import CalendarGrid from './components/CalendarGrid'
import SlotModal from './components/SlotModal'
import ColorStats from './components/ColorStats'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import { LoginPage, SignupPage } from './pages/AuthPages'
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// The original App component logic moved here
const SchedulerDashboard = () => {
    const { logout, user } = useAuth();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingSlot, setEditingSlot] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Real-time Firestore Sync
    useEffect(() => {
        if (!user) return;

        // Reference to the user's document in 'schedules' collection
        const docRef = doc(db, 'schedules', user.uid);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setSlots(docSnap.data().slots || []);
            } else {
                // Initialize default slot if new user
                const defaultSlots = [{
                    id: '1',
                    title: 'Welcome!',
                    day: format(new Date(), 'yyyy-MM-dd'),
                    startTime: '09:00',
                    duration: 1,
                    color: '#7c3aed',
                    description: `Welcome! This schedule is synced to the cloud.`
                }];
                // We don't necessarily need to write it immediately, but let's set local
                setSlots(defaultSlots);
            }
            setLoading(false);
        }, (error) => {
            console.error("Sync error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Save to Firestore whenever slots change
    // Note: To avoid infinite loops with onSnapshot, we should ideally separate "saving" from "rendering".
    // But for this simple app, we can just save inside specific handlers (add/edit/delete) 
    // instead of a useEffect that watches 'slots'.

    // Helper to save current state
    const saveSlotsToCloud = async (newSlots) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'schedules', user.uid), { slots: newSlots }, { merge: true });
        } catch (err) {
            console.error("Failed to save:", err);
            alert("Failed to save changes to cloud. Check your connection.");
        }
    };

    const handleAddSlot = (prefillData) => {
        setEditingSlot(prefillData || null);
        setIsModalOpen(true);
    };

    const handleEditSlot = (slot) => {
        setEditingSlot(slot);
        setIsModalOpen(true);
    };

    const handleDeleteSlot = (id) => {
        const newSlots = slots.filter(s => s.id !== id);
        // Optimistic update
        setSlots(newSlots);
        saveSlotsToCloud(newSlots);
        setIsModalOpen(false);
    };

    const handleSaveSlot = (data) => {
        let newSlots = [...slots];
        if (data.id) {
            newSlots = newSlots.map(s => s.id === data.id ? { ...s, ...data } : s);
        } else {
            if (data.isRecurring && data.selectedDays?.length > 0) {
                const currentDate = new Date();
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
                const generated = data.selectedDays.map(dayIndex => {
                    const daysInWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
                    const targetDate = daysInWeek.find(d => getDay(d) === dayIndex);
                    if (!targetDate) return null;
                    return {
                        id: Date.now().toString() + '-' + dayIndex + '-' + Math.random().toString(36).substr(2, 9),
                        title: data.title,
                        day: format(targetDate, 'yyyy-MM-dd'),
                        startTime: data.startTime,
                        duration: data.duration,
                        color: data.color,
                        description: data.description
                    };
                }).filter(Boolean);
                newSlots = [...newSlots, ...generated];
            } else {
                newSlots.push({ ...data, id: Date.now().toString() });
            }
        }
        setSlots(newSlots); // Optimistic
        saveSlotsToCloud(newSlots);
        setIsModalOpen(false);
    };

    const handleDragEnd = (event) => {
        const { active, over, delta } = event;
        if (!over) return;
        const slotId = active.id;
        const slot = slots.find(s => s.id === slotId);
        if (!slot) return;

        const newDay = over.id;
        const [h, m] = slot.startTime.split(':').map(Number);
        const newMinutes = Math.round((h * 60 + m + delta.y) / 15) * 15;
        const finalMinutes = Math.max(0, Math.min(1439 - (slot.duration * 60), newMinutes));
        const newH = Math.floor(finalMinutes / 60);
        const newM = finalMinutes % 60;
        const newTimeStr = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;

        const newSlots = slots.map(s => s.id === slotId ? { ...s, day: newDay, startTime: newTimeStr } : s);
        setSlots(newSlots);
        saveSlotsToCloud(newSlots);
    };

    const handleExportData = () => {
        const dataStr = JSON.stringify(slots, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timeline_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportData = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported) && confirm('Replace current data?')) {
                    setSlots(imported);
                    saveSlotsToCloud(imported);
                }
            } catch { alert('Invalid file'); }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ margin: 0, fontSize: '1.25rem', lineHeight: 1.2 }}>Timeline</h1>
                        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--fg-secondary)' }}>{user?.email}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-ghost" onClick={handleExportData} title="Export">Backup</button>
                            <label className="btn btn-ghost" style={{ cursor: 'pointer' }} title="Import">
                                Import
                                <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleAddSlot(null)}>+ New Slot</button>
                    </div>
                </div>

                <ColorStats slots={slots} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <CalendarGrid slots={slots} onEditSlot={handleEditSlot} onDeleteSlot={handleDeleteSlot} onAddSlot={handleAddSlot} />
                </div>
                <SlotModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSlot} onDelete={handleDeleteSlot} initialData={editingSlot} />
            </div>
        </DndContext>
    )
}

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <SchedulerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App
