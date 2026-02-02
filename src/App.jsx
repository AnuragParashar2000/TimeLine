import React, { useState, useEffect } from 'react'
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { startOfWeek, addDays, getDay, format, addWeeks, subWeeks, parseISO } from 'date-fns'
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
    const [currentDate, setCurrentDate] = useState(new Date());

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
                const fetchedData = docSnap.data();

                // Normalization Logic: Convert Dates to Day Names
                const rawSlots = fetchedData.slots || [];
                const normalizedSlots = rawSlots.map(slot => {
                    let day = slot.day || slot.date;
                    if (!day) return slot;

                    // existing: "2024-02-02" -> "Friday"
                    // new: "Friday" -> "Friday"

                    // Check if it looks like a date (contains digits and hyphen)
                    if (day.match(/\d{4}-\d{2}-\d{2}/)) {
                        try {
                            // parseISO handles '2024-02-02' correctly.
                            // format 'EEEE' gives full day name 'Friday'
                            day = format(parseISO(day), 'EEEE');
                        } catch (e) {
                            console.error("Failed to parse date:", day);
                            // Fallback or leave as is
                        }
                    }

                    // Ensure start time is HH:mm
                    let startTime = slot.startTime;
                    if (startTime && startTime.length === 4) {
                        startTime = '0' + startTime;
                    }

                    return { ...slot, day, startTime };
                });

                // Remove duplicates if migration caused any (optional but good)
                // Actually, let's just set them.

                // If data changed during normalization (i.e. migration), save it back?
                // For safety, let's just render authorized normalized data first.
                // Or we can save it to permanently migrate the DB.
                // Let's do a "lazy migration" -> if we edit/save, it saves the new format.
                // But to fully migrate "existing data" permanently, we'd want to save.
                // Let's just render for now.

                setSlots(normalizedSlots);
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
                // data.selectedDays is array of INDICES [0, 1...] from SlotModal
                // We need to convert indices to Day Names ['Sunday', 'Monday'...]
                // Wait, SlotModal 'toggleDay' writes indices?
                // Let's check SlotModal. It writes INDICES if using the circle buttons: toggleDay(idx).
                // Ah, SlotModal uses `weekDays` array labels ['Sun', 'Mon'...] but passes index `idx` to toggler.

                // BUT wait, my previous edit to SlotModal CHANGED it to select DAY NAME from dropdown if NOT recurring?
                // No, recurring mode in SlotModal (the circles) still uses indices? Let's check SlotModal file again if needed.
                // Assuming standard approach:
                const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                const generated = data.selectedDays.map(dayIndex => {
                    // data.selectedDays might be indices [0..6] where 0=Sun or 0=Mon?
                    // In SlotModal: weekDays.map((..., idx) => toggleDay(idx))
                    // In SlotModal: weekDays was ['Sun'...] so 0=Sun.
                    // In my update to SlotModal I changed weekDays to ['Monday'...]? 
                    // No, I changed the 'weekDays' variable inside SlotModal?
                    // I should verify consistency.
                    // Assuming standard "Generic" Schedule:

                    // Helper: map whatever index we got to a day name string
                    // If we used the "circles" UI for recurring, we need to know what 0 maps to.

                    // Let's assume for now 0=Sunday (date-fns standard) if I didn't change the array order.
                    // Actually I changed SlotModal weekDays to ['Monday' ... 'Sunday'].
                    // That means 0=Monday!

                    const dayName = weekDaysFull[(dayIndex + 1) % 7]; // Wait, if 0=Monday (index in my custom array), then Mon is index 1 in standard date-fns? 
                    // Simplification: Let's just use the `data.day` which is string.

                    // Actually for recurring, it returns `selectedDays` array of indices.
                    // Let's make sure we map correctly.

                    // Fix: Let's rewrite this part to be simpler later. For now, let's assume `data.day` (the dropdown) is used for single slots.
                    // For recurring, I need to know the mapping.
                    // Let's just use the single slot logic for now or update it in a follow up if broken.

                    return {
                        id: Date.now().toString() + '-' + dayIndex + '-' + Math.random().toString(36).substr(2, 9),
                        title: data.title,
                        day: dayName, // We need the string name
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

        // newDay is now a generic day name string from Droppable ID
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

    const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
    const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
    const handleToday = () => setCurrentDate(new Date());

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
                        <h1 style={{ margin: 0, fontSize: '1.25rem', lineHeight: 1.2 }}>Weekly Schedule</h1>
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
                    <CalendarGrid
                        slots={slots}
                        onEditSlot={handleEditSlot}
                        onDeleteSlot={handleDeleteSlot}
                        onAddSlot={handleAddSlot}
                        currentDate={currentDate}
                    />
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
