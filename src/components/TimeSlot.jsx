import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const TimeSlot = ({ slot, onEdit }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: slot.id,
        data: slot,
    });

    const style = {
        // Basic slot styling inherited from parent or defined here?
        // Parent sets position. Here we handle visual style and drag transform.
        // We strictly use Translate.toString(transform) for performance
        transform: CSS.Translate.toString(transform),
        backgroundColor: slot.color || '#7c3aed',
        height: '100%', // Parent sets height wrapper
        width: '100%',
        borderRadius: '4px',
        padding: '4px',
        fontSize: '0.75rem',
        color: '#fff',
        cursor: 'grab',
        overflow: 'hidden',
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0.9 : 1,
        position: 'relative', // To fill wrapper
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                // Prevent edit if just finished dragging?
                // dnd-kit usually suppresses click on drag.
                onEdit(slot);
            }}
        >
            <div className="slot-title" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {slot.title}
            </div>
            <div className="slot-time" style={{ fontSize: '0.7em', opacity: 0.9 }}>
                {slot.startTime} ({slot.duration}h)
            </div>
        </div>
    );
};

export default TimeSlot;
