// Force dynamic rendering for admin pages - they use Convex hooks that require runtime client
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
