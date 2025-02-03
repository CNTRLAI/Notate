import { UserProvider } from "./UserContext";
import { SysSettingsProvider } from "./SysSettingsContext";
import { LibraryProvider } from "./LibraryContext";

export default function UserClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <LibraryProvider>
        <SysSettingsProvider>{children}</SysSettingsProvider>
      </LibraryProvider>
    </UserProvider>
  );
}
