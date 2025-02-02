import { UserProvider } from "./UserContext";
import { SysSettingsProvider } from "./SysSettingsContext";
import { ViewProvider } from "./ViewContext";
import { LibraryProvider } from "./LibraryContext";

export default function UserClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <LibraryProvider>
        <SysSettingsProvider>
          <ViewProvider>{children}</ViewProvider>
        </SysSettingsProvider>
      </LibraryProvider>
    </UserProvider>
  );
}
