import React from 'react';

const ColorStats = ({ slots }) => {
    // Aggregate duration by color
    const stats = slots.reduce((acc, slot) => {
        const color = slot.color || '#7c3aed'; // Default
        if (!acc[color]) {
            acc[color] = 0;
        }
        acc[color] += slot.duration || 0;
        return acc;
    }, {});

    const grandTotal = slots.reduce((acc, slot) => acc + (slot.duration || 0), 0);

    const sortedColors = Object.entries(stats).sort((a, b) => b[1] - a[1]);

    const formatDuration = (hours) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0 && m === 0) return '0m';
        return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    };

    if (sortedColors.length === 0) return null;

    return (
        <div className="glass-panel" style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            overflowX: 'auto',
            alignItems: 'center',
            borderLeft: 'none', borderRight: 'none', borderRadius: 0, borderTop: 'none',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginRight: '1rem',
                paddingRight: '1rem',
                borderRight: '1px solid var(--border)'
            }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-secondary)', whiteSpace: 'nowrap' }}>
                    Total Scheduled:
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg-primary)' }}>
                    {formatDuration(grandTotal)}
                </span>
            </div>

            {sortedColors.map(([color, totalHours]) => (
                <div key={color} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-secondary)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap'
                }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }} />
                    <span style={{ fontWeight: 500, color: 'var(--fg-primary)' }}>
                        {formatDuration(totalHours)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ColorStats;
