import UserManagementTabs from "@/components/user-management/user-management-tabs";

export default function UserManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <UserManagementTabs />
      {children}
    </div>
  );
}
