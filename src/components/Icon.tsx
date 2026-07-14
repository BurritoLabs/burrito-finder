import c from "classnames";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleHelp,
  Copy,
  Info,
  TriangleAlert,
  X,
  type LucideIcon
} from "lucide-react";

type Props = { name: string; size?: number; className?: string };

const icons: Record<string, LucideIcon> = {
  arrow_back: ArrowLeft,
  check: Check,
  check_circle: CheckCircle,
  close: X,
  error: CircleAlert,
  error_outline: CircleAlert,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  filter_none: Copy,
  info: Info,
  info_outline: Info,
  keyboard_arrow_down: ChevronDown,
  keyboard_arrow_up: ChevronUp,
  warning: TriangleAlert
};

const Icon = ({ name, size = 20, className }: Props) => {
  const Component = icons[name] ?? CircleHelp;
  return (
    <Component
      aria-hidden="true"
      className={c(className)}
      size={size}
      strokeWidth={1.8}
    />
  );
};

export default Icon;
