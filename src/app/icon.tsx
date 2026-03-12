export const runtime = "edge";

export const contentType = "image/svg+xml";
export const size = {
  width: 32,
  height: 32,
};

export default function Icon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" stroke="#FFD600" strokeWidth="3.5" />
      <path d="M20 12V28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 16H28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 24L12 18L14 24H10Z" fill="#FFD600" opacity="0.8" />
      <path d="M26 24L28 18L30 24H26Z" fill="#FFD600" opacity="0.8" />
      <circle cx="20" cy="16" r="2" fill="#FFD600" />
    </svg>
  );
}
