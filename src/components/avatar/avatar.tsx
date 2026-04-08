interface Props {
  source: string;
  size?: number;
}

export function Avatar({ source, size = 100 }: Props) {
  return (
    <div
      className="overflow-hidden border border-black-100 bg-white-200"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <img src={source} alt="user avatar" className="h-full w-full object-cover" />
    </div>
  );
}
