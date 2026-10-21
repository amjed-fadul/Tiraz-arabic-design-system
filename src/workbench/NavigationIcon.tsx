import { SquaresFourIcon } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { BookOpenIcon } from "@phosphor-icons/react/dist/csr/BookOpen";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { StackIcon } from "@phosphor-icons/react/dist/csr/Stack";
import { PaletteIcon } from "@phosphor-icons/react/dist/csr/Palette";
import { TranslateIcon } from "@phosphor-icons/react/dist/csr/Translate";
import { PersonArmsSpreadIcon } from "@phosphor-icons/react/dist/csr/PersonArmsSpread";
import { RobotIcon } from "@phosphor-icons/react/dist/csr/Robot";
import { WaveformIcon } from "@phosphor-icons/react/dist/csr/Waveform";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/csr/FolderSimple";
import { SparkleIcon } from "@phosphor-icons/react/dist/csr/Sparkle";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { TrayIcon } from "@phosphor-icons/react/dist/csr/Tray";
import { ChatCircleDotsIcon } from "@phosphor-icons/react/dist/csr/ChatCircleDots";
import { ChartBarIcon } from "@phosphor-icons/react/dist/csr/ChartBar";
import { TextboxIcon } from "@phosphor-icons/react/dist/csr/Textbox";
import { CompassIcon } from "@phosphor-icons/react/dist/csr/Compass";
import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import type { Icon } from "@phosphor-icons/react";

const icons: Record<string, Icon> = {
  introduction: BookOpenIcon,
  installation: DownloadSimpleIcon,
  providers: StackIcon,
  theming: PaletteIcon,
  rtl: TranslateIcon,
  accessibility: PersonArmsSpreadIcon,
  ai: RobotIcon,
  "agent-handoff": RobotIcon,
  "voice-field": WaveformIcon,
  "document-vault": FolderSimpleIcon,
  "no-records": TrayIcon,
  "no-search-results": MagnifyingGlassIcon,
  "getting-started": CompassIcon,
  ask: ChatCircleDotsIcon,
  delegate: RobotIcon,
  create: SparkleIcon,
  understand: ChartBarIcon,
  forms: TextboxIcon,
  files: FolderSimpleIcon,
  navigation: CompassIcon,
  feedback: BellIcon,
  data: ChartBarIcon,
};
export function NavigationIcon({ id }: { id: string }) {
  const Icon = icons[id] ?? SquaresFourIcon;
  return <Icon size={22} weight="duotone" aria-hidden="true" />;
}
