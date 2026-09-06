import { Platform, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { CircleUser, House, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsTrigger,
  TabsTriggerIcon,
  TabsTriggerText,
} from "@/components/ui/tabs";

/** Content height of the JS tab bar (mirrors the old OS default). */
export const TAB_BAR_HEIGHT = Platform.select({
  ios: 49,
  android: 56,
  default: 49,
}) as number;

const TABS = [
  {
    name: "home",
    href: "/home",
    label: "Home",
    icon: House,
    testID: "tab-home",
  },
  {
    name: "friends",
    href: "/friends",
    label: "Friends",
    icon: Users,
    testID: "tab-friends",
  },
  {
    name: "profile",
    href: "/profile",
    label: "Profile",
    icon: CircleUser,
    testID: "tab-profile",
  },
] as const;

type TabName = (typeof TABS)[number]["name"];

const LIST_INSET = 12;
const LIST_PADDING = 4;

function tabFromPathname(pathname: string): TabName {
  if (pathname.includes("/friends")) return "friends";
  if (pathname.includes("/profile")) return "profile";
  return "home";
}

export function AppTabBar() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const value = tabFromPathname(pathname);
  const tabWidth = (width - LIST_INSET * 2 - LIST_PADDING * 2) / TABS.length;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        paddingHorizontal: LIST_INSET,
        paddingBottom: Math.max(bottomInset - 8, 8),
        backgroundColor: "transparent",
      }}
    >
      <Tabs
        value={value}
        onValueChange={(next: string) => {
          if (next === value) return;
          const tab = TABS.find((item) => item.name === next);
          if (tab) router.navigate(tab.href);
        }}
        variant="filled"
        activationMode="manual"
        className="w-full"
      >
        <TabsList
          pointerEvents="auto"
          className="w-full"
          scrollEnabled={false}
          style={{
            height: TAB_BAR_HEIGHT,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
          }}
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.name}
              value={tab.name}
              testID={tab.testID}
              className="flex-col gap-0.5 py-1"
              style={{ width: tabWidth }}
            >
              <TabsTriggerIcon as={tab.icon} className="h-5 w-5" />
              <TabsTriggerText className="text-[10px] leading-3">
                {tab.label}
              </TabsTriggerText>
            </TabsTrigger>
          ))}
          <TabsIndicator />
        </TabsList>
      </Tabs>
    </View>
  );
}
