const SKIN = "#ffe0c2";
const INK = "#2b2a28";
const BLUSH = "#ff9d9d";

// Shared facial features drawn on top of every icon: eyes, blush, smile.
function Face({ eyeY = 50, mouthY = 68, wide = false }) {
  const ex = wide ? 12 : 15;
  return (
    <>
      <circle cx={50 - ex} cy={eyeY} r="4.5" fill={INK} />
      <circle cx={50 + ex} cy={eyeY} r="4.5" fill={INK} />
      <circle cx={50 - ex - 3} cy={eyeY + 13} r="6" fill={BLUSH} opacity="0.55" />
      <circle cx={50 + ex + 3} cy={eyeY + 13} r="6" fill={BLUSH} opacity="0.55" />
      <path
        d={`M${50 - ex + 1} ${mouthY} Q50 ${mouthY + 12} ${50 + ex - 1} ${mouthY}`}
        stroke={INK}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

function Glasses({ y = 50 }) {
  return (
    <g stroke={INK} strokeWidth="2.5" fill="none" opacity="0.75">
      <circle cx="35" cy={y} r="9" />
      <circle cx="65" cy={y} r="9" />
      <path d={`M44 ${y} L56 ${y}`} />
    </g>
  );
}

const ICONS = {
  dad: ({ color }) => (
    <>
      <circle cx="50" cy="52" r="38" fill={SKIN} />
      <path d="M10 46 A40 40 0 0 1 90 46 L90 26 A40 32 0 0 0 10 26 Z" fill={color} />
      <Face />
    </>
  ),
  mom: ({ color }) => (
    <>
      <ellipse cx="14" cy="58" rx="9" ry="22" fill={color} />
      <ellipse cx="86" cy="58" rx="9" ry="22" fill={color} />
      <circle cx="50" cy="52" r="38" fill={SKIN} />
      <path d="M10 44 A40 40 0 0 1 90 44 L90 24 A40 34 0 0 0 10 24 Z" fill={color} />
      <Face />
    </>
  ),
  child: ({ color }) => (
    <>
      <circle cx="50" cy="55" r="40" fill={SKIN} />
      <path d="M14 46 A36 36 0 0 1 86 46 L86 40 A36 30 0 0 0 14 40 Z" fill={color} />
      <path d="M44 16 Q50 2 56 16 Q52 22 50 17 Q48 22 44 16 Z" fill={color} />
      <Face eyeY={53} mouthY={70} wide />
    </>
  ),
  baby: ({ color }) => (
    <>
      <circle cx="50" cy="58" r="40" fill={SKIN} />
      <path d="M49 18 q7 -1 7 8 q-6 3 -9 -3 q-1 -4 2 -5 Z" fill={color} />
      <Face eyeY={56} mouthY={70} wide />
      <ellipse cx="50" cy="80" rx="7" ry="5" fill="#e8871e" opacity="0.55" />
    </>
  ),
  grandpa: ({ color }) => (
    <>
      <ellipse cx="13" cy="55" rx="7" ry="16" fill={color} opacity="0.85" />
      <ellipse cx="87" cy="55" rx="7" ry="16" fill={color} opacity="0.85" />
      <circle cx="50" cy="54" r="37" fill={SKIN} />
      <Glasses y={49} />
      <Face eyeY={49} mouthY={67} />
    </>
  ),
  grandma: ({ color }) => (
    <>
      <ellipse cx="14" cy="56" rx="8" ry="18" fill={color} />
      <ellipse cx="86" cy="56" rx="8" ry="18" fill={color} />
      <circle cx="50" cy="54" r="37" fill={SKIN} />
      <path d="M14 46 A36 36 0 0 1 86 46 L86 38 A36 28 0 0 0 14 38 Z" fill={color} />
      <circle cx="50" cy="14" r="10" fill={color} />
      <Glasses y={49} />
      <Face eyeY={49} mouthY={67} />
    </>
  ),
  other: ({ color }) => (
    <>
      <circle cx="50" cy="52" r="38" fill={SKIN} />
      <path d="M10 42 A40 40 0 0 1 90 42 Z" fill={color} />
      <Face />
    </>
  ),
};

export const AVATAR_KEYS = ["dad", "mom", "child", "baby", "grandpa", "grandma", "other"];

const AVATAR_EMOJI_FALLBACK = {
  dad: "👨",
  mom: "👩",
  child: "🧒",
  baby: "👶",
  grandpa: "👴",
  grandma: "👵",
  other: "🧑",
};

// Renders a cute flat-cartoon face for known icon keys. Falls back to
// rendering the raw string (legacy plain-emoji avatars) so old data still
// displays fine without a migration. `size` only affects the emoji fallback
// (an SVG always fills className's box) — pass it to match that box, e.g.
// size="1.75rem" for a w-12 h-12 container, since emoji glyph size is driven
// by font-size, not width/height.
export default function AvatarIcon({ icon, color = "#6fa695", className = "", size = "1em" }) {
  const Icon = ICONS[icon];
  if (!Icon) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center`}
        style={{ fontSize: size, lineHeight: 1 }}
      >
        {icon}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={icon}>
      <Icon color={color} />
    </svg>
  );
}

export function avatarEmoji(icon) {
  return AVATAR_EMOJI_FALLBACK[icon] || icon;
}
