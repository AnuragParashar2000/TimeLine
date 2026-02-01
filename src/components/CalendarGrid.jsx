import React from 'react';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import TimeSlot from './TimeSlot';

const hours = Array.from({ length: 24 }, (_, i) => i);

const CalendarGrid = ({ slots, onDeleteSlot, onEditSlot, onAddSlot }) => {
    // Static week days for generic schedule
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleCellClick = (dayName, hour) => {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        onAddSlot({ day: dayName, startTime: timeStr });
    };

    return (
        <div className="calendar-container glass-panel" style={{ overflow: 'auto', position: 'relative' }}>
            {/* Headers Row (Sticky Top) */}
            <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 30, background: 'var(--bg-primary)' }}>
                {/* Top-Left Corner (Sticky Left) */}
                <div
                    className="time-column-header"
                    style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 40,
                        background: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)'
                    }}
                />

                {/* Day Headers (Scrolls horizontally) */}
                {weekDays.map((dayName) => (
                    <div
                        key={dayName}
                        className="day-header"
                        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}
                    >
                        <span className="day-name">{dayName}</span>
                    </div>
                ))}
            </div>

            {/* Body Row */}
            <div style={{ display: 'flex' }}>
                {/* Time Sidebar (Sticky Left) */}
                <div
                    className="time-sidebar"
                    style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 20,
                        background: 'var(--bg-primary)',
                        borderRight: '1px solid var(--border)'
                    }}
                >
                    {hours.map((hour) => (
                        <div key={hour} className="time-label">
                            <span>{format(new Date().setHours(hour, 0), 'ha')}</span>
                        </div>
                    ))}
                </div>

                {/* Grid Columns */}
                <div className="grid-columns" style={{ display: 'flex', flex: 1 }}>
                    {weekDays.map((dayName) => (
                        <DayColumn
                            key={dayName}
                            dayName={dayName}
                            hours={hours}
                            slots={slots.filter(s => s.day === dayName)}
                            onCellClick={handleCellClick}
                            onEditSlot={onEditSlot}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DayColumn = ({ dayName, hours, slots, onCellClick, onEditSlot }) => {
    const { setNodeRef } = useDroppable({
        id: dayName,
    });

    return (
        <div className="day-column" ref={setNodeRef}>
            {hours.map((hour) => (
                <div
                    key={`${dayName}-${hour}`}
                    className="grid-cell"
                    onClick={() => onCellClick(dayName, hour)}
                    title={`Click to add slot at ${hour}:00`}
                />
            ))}

            {slots.map(slot => {
                const [h, m] = slot.startTime.split(':').map(Number);
                const top = ((h * 60) + m) * 1;
                const height = slot.duration * 60;

                return (
                    <div
                        key={slot.id}
                        style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            left: '4px',
                            right: '4px',
                            zIndex: 10
                            // Note: we don't put interactive handlers here, 
                            // TimeSlot handles them via dnd-kit hooks and props
                        }}
                    >
                        <TimeSlot slot={slot} onEdit={onEditSlot} />
                    </div>
                );
            })}
        </div>
    );
};

export default CalendarGrid;
