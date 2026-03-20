import Sidebar from '@/components/Sidebar/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-[#F2F2F7] min-h-screen">
            <Sidebar />
            {/*
              Desktop: push right of fixed 220px sidebar
              Mobile:  full width, top padding for mobile top-bar (56px), bottom padding for bottom nav (64px)
            */}
            <main className="flex-1 w-full lg:ml-[220px] pb-24 lg:pb-0 min-h-screen">
                {children}
            </main>
        </div>
    );
}
