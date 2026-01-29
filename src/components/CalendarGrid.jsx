import React from 'react';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import TimeSlot from './TimeSlot';

const hours = Array.from({ length: 24 }, (_, i) => i);

const CalendarGrid = ({ slots, onDeleteSlot, onEditSlot, onAddSlot }) => {
    const currentDate = new Date();
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handleCellClick = (day, hour) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        onAddSlot({ day: dateStr, startTime: timeStr });
    };

    return (
        <div className="calendar-container glass-panel">
            <div className="calendar-header">
                <div className="time-column-header"></div>
                {weekDays.map((day) => (
                    <div key={day.toString()} className="day-header">
                        <span className="day-name">{format(day, 'EEE')}</span>
                        <span className="day-date">{format(day, 'd')}</span>
                    </div>
                ))}
            </div>

            <div className="calendar-body">
                <div className="time-sidebar">
                    {hours.map((hour) => (
                        <div key={hour} className="time-label">
                            <span>{format(new Date().setHours(hour, 0), 'ha')}</span>
                        </div>
                    ))}
                </div>

                <div className="grid-columns">
                    {weekDays.map((day) => (
                        <DayColumn
                            key={day.toString()}
                            date={day}
                            hours={hours}
                            slots={slots.filter(s => s.day === format(day, 'yyyy-MM-dd'))}
                            onCellClick={handleCellClick}
                            onEditSlot={onEditSlot}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DayColumn = ({ date, hours, slots, onCellClick, onEditSlot }) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const { setNodeRef } = useDroppable({
        id: dayStr,
    });

    return (
        <div className="day-column" ref={setNodeRef}>
            {hours.map((hour) => (
                <div
                    key={`${dayStr}-${hour}`}
                    className="grid-cell"
                    onClick={() => onCellClick(date, hour)}
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
