// Avatar.jsx — three simple SVG character figures, drawn identically every time.
// Roles: "customer" (blush), "boss" (gold), "you" (green).
// The same shape is reused for all three; only the colours change per role.
// `speaking` highlights the active figure; everyone else is dimmed.

const ROLE_COLORS = {
  customer: { body: "#C2737C", soft: "#F4E5E6", label: "Kunde" },
  boss: { body: "#B98A3E", soft: "#F2E8D4", label: "Chef" },
  you: { body: "#2F4A3C", soft: "#E6EDE3", label: "Sie" },
};

const ROLE_SUBTITLE = {
  customer: "Customer",
  boss: "Boss",
  you: "You",
};

export default function Avatar({ role, speaking = false, dimmed = false }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.you;

  return (
    <div
      className={
        "avatar" +
        (speaking ? " avatar--speaking" : "") +
        (dimmed ? " avatar--dimmed" : "")
      }
    >
      <svg
        viewBox="0 0 80 100"
        width="80"
        height="100"
        role="img"
        aria-label={`${c.label} (${ROLE_SUBTITLE[role]})`}
      >
        {/* soft glow disc behind the figure */}
        <ellipse cx="40" cy="50" rx="38" ry="46" fill={c.soft} />
        {/* body / shoulders */}
        <path
          d="M40 52 C22 52 16 70 16 92 L64 92 C64 70 58 52 40 52 Z"
          fill={c.body}
        />
        {/* head */}
        <circle cx="40" cy="34" r="18" fill={c.body} />
        {/* face highlight */}
        <circle cx="40" cy="34" r="18" fill="#FFFFFF" opacity="0.12" />
        {/* eyes */}
        <circle cx="33" cy="33" r="2.4" fill="#26302A" />
        <circle cx="47" cy="33" r="2.4" fill="#26302A" />
        {/* gentle smile */}
        <path
          d="M32 40 Q40 46 48 40"
          fill="none"
          stroke="#26302A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="avatar__label" style={{ color: c.body }}>
        {c.label}
        <small>{ROLE_SUBTITLE[role]}</small>
      </span>
    </div>
  );
}
