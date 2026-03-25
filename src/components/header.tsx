interface Props {
  title: string;
}

export function Header({ title }: Props) {
  return <span className="font-semibold text-xl bg-transparent">{title}</span>;
}
