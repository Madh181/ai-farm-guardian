import React from 'react'

const TIER_MAP = {
  CRITICAL: { cls: 'badge-critical', emoji: '🔴' },
  HIGH: { cls: 'badge-high', emoji: '🟠' },
  MEDIUM: { cls: 'badge-medium', emoji: '🟡' },
  LOW: { cls: 'badge-low', emoji: '🟢' },
}

export default function PriorityBadge({ tier, score }) {
  const info = TIER_MAP[tier] || TIER_MAP.LOW
  return (
    <span className={`badge ${info.cls}`}>
      {info.emoji} {tier} {typeof score === 'number' ? `· ${score}` : ''}
    </span>
  )
}
