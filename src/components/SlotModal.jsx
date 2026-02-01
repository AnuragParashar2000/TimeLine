import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addMinutes, format, parse, differenceInMinutes, startOfWeek, addDays, getDay } from 'date-fns';

const SlotModal = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        day: '',
        startTime: '09:00',
        endTime: '10:00',
        duration: 1,
        color: '#7c3aed',
        description: '',
        selectedDays: []
    });

    const [isRecurringMode, setIsRecurringMode] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setIsRecurringMode(false);
                const start = parse(initialData.startTime || '09:00', 'HH:mm', new Date());
                const end = addMinutes(start, (initialData.duration || 1) * 60);

                setFormData({
                    id: initialData.id,
                    title: initialData.title || '',
                    day: initialData.day || '',
                    startTime: initialData.startTime || '09:00',
                    endTime: format(end, 'HH:mm'),
                    duration: initialData.duration || 1,
                    color: initialData.color || '#7c3aed',
                    description: initialData.description || '',
                    selectedDays: []
                });
            } else {
                // New Slot
                const todayDayIndex = getDay(new Date()); // 0 = Sun
                const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                setFormData({
                    title: '',
                    day: weekDaysFull[todayDayIndex], // Default to today's name
                    startTime: '09:00',
                    endTime: '10:00',
                    duration: 1,
                    color: '#7c3aed',
                    description: '',
                    selectedDays: [todayDayIndex]
                });
                setIsRecurringMode(true);
            }
        }
    }, [isOpen, initialData]);

    // Duration calculation with overnight support
    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            // Parse time strings into a base date (e.g., today)
            const baseDate = new Date();
            const start = parse(formData.startTime, 'HH:mm', baseDate);
            let end = parse(formData.endTime, 'HH:mm', baseDate);

            // If end is before start, assume it's the next day
            if (end < start) {
                end = addDays(end, 1);
            }

            // Calculate difference in hours
            let diffMinutes = differenceInMinutes(end, start);

            if (diffMinutes === 0) diffMinutes = 60; // Default to 1h if same time

            const durationInHours = diffMinutes / 60;

            if (Math.abs(durationInHours - formData.duration) > 0.01) {
                setFormData(prev => ({ ...prev, duration: durationInHours }));
            }
        }
    }, [formData.startTime, formData.endTime]);

    const toggleDay = (dayIndex) => {
        setFormData(prev => {
            const days = prev.selectedDays.includes(dayIndex)
                ? prev.selectedDays.filter(d => d !== dayIndex)
                : [...prev.selectedDays, dayIndex];
            return { ...prev, selectedDays: days };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, isRecurring: isRecurringMode });
    };

    if (!isOpen) return null;

    // Use full names to match date-fns 'EEEE' format
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Slot' : 'New Slot'}</h2>
                    <button onClick={onClose} className="btn-ghost icon-btn"><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Meeting Name"
                            autoFocus
                        />
                    </div>

                    {(!initialData && isRecurringMode) ? (
                        <div className="form-group">
                            <label>Repeat on Days</label>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                                {weekDays.map((dayName, idx) => (
                                    <button
                                        key={dayName}
                                        type="button"
                                        onClick={() => toggleDay(idx)}
                                        style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            border: '1px solid var(--border)',
                                            background: formData.selectedDays.includes(idx) ? 'hsl(var(--accent))' : 'var(--bg-primary)',
                                            color: formData.selectedDays.includes(idx) ? '#fff' : 'var(--fg-secondary)',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            fontSize: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {dayName[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Day</label>
                            <select
                                value={formData.day}
                                onChange={e => setFormData({ ...formData, day: e.target.value })}
                                style={{ width: '100%' }}
                            >
                                <option value="" disabled>Select Day</option>
                                {weekDays.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label>Start Time</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>End Time</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ flexDirection: 'row', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label>Color</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                {['#7c3aed', '#2563eb', '#db2777', '#16a34a', '#ea580c', '#6366f1'].map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        style={{
                                            width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c,
                                            cursor: 'pointer',
                                            border: formData.color === c ? '2px solid white' : 'none',
                                            outline: formData.color === c ? '2px solid ' + c : 'none',
                                            outlineOffset: '2px'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--fg-secondary)', paddingBottom: '0.5rem' }}>
                            {Math.floor(formData.duration)}h {Math.round((formData.duration % 1) * 60)}m
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            style={{
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                color: 'var(--fg-primary)',
                                borderRadius: '6px',
                                resize: 'none',
                                padding: '0.5rem'
                            }}
                        />
                    </div>

                </div>

                <div className="modal-footer">
                    {initialData && (
                        <button
                            className="btn btn-danger"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this session?')) onDelete(initialData.id);
                            }}
                            style={{ marginRight: 'auto' }}
                        >
                            Delete
                        </button>
                    )}
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default SlotModal;
