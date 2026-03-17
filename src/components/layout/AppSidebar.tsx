import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Award,
  CalendarDays,
  LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReminders } from '@/hooks/use-reminders';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { getOverdue } = useReminders();

  // Notification logic
  const now = new Date();
  const isPast15th = now.getDate() > 15;
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasThisMonthSnapshot = MOCK_SNAPSHOTS[0]?.date.startsWith(currentMonth);
  const overdueCount = getOverdue().length;
  const showSnapshotBadge = (isPast15th && !hasThisMonthSnapshot) || overdueCount > 0;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const mainNav = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard, desc: 'Your overview', badge: false },
    { title: 'My Snapshot', url: '/snapshot', icon: ClipboardCheck, desc: 'Rate your 30 days', badge: showSnapshotBadge },
    { title: 'Community', url: '/community', icon: Users, desc: 'Your forum brothers', badge: false },
    { title: 'Leadership', url: '/leadership', icon: Award, desc: 'Growth & mentoring', badge: false },
    { title: 'Events', url: '/events', icon: CalendarDays, desc: 'Meetings & gatherings', badge: false },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className={`flex flex-col items-center justify-center transition-all duration-300 ${collapsed ? 'py-3 px-1' : 'py-6 px-4'}`}>
          <img
            src={ironForumsLogo}
            alt="Iron Forums"
            className={`brightness-0 invert transition-all duration-300 object-contain ${collapsed ? 'h-8 w-8' : 'w-[85%] max-w-[220px] h-auto'}`}
          />
          {!collapsed && (
            <p className="text-[0.65rem] font-body tracking-[0.3em] uppercase text-sidebar-primary mt-2.5 font-bold text-center whitespace-nowrap">
              Connect <span className="text-sidebar-foreground/30 mx-0.5">»</span> Sharpen <span className="text-sidebar-foreground/30 mx-0.5">»</span> Grow
            </p>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4 px-2.5">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="min-h-[48px]"
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/60 transition-all duration-200 rounded-xl px-3 py-2.5"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                    >
                      <div className="relative shrink-0">
                        <item.icon className="h-5 w-5 opacity-80" />
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-sidebar-background" />
                        )}
                      </div>
                      {!collapsed && (
                        <div className="flex flex-col ml-0.5">
                          <span className="font-body text-base font-semibold leading-tight">{item.title}</span>
                          <span className="font-body text-xs text-sidebar-foreground/50 leading-tight">{item.desc}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2.5 border-t border-sidebar-border space-y-0.5">
        <SidebarMenu>
          {!collapsed && profile && (
            <SidebarMenuItem>
              <div className="px-3 py-2">
                <p className="text-base font-body font-semibold leading-tight truncate text-sidebar-foreground">{profile.full_name}</p>
                <p className="text-xs font-body text-sidebar-foreground/50 leading-tight truncate">{profile.chapter || profile.company_name || ''}</p>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={() => { logout(); navigate('/login'); }} className="min-h-[44px] hover:bg-sidebar-accent/60 transition-all duration-200 rounded-xl">
              <LogOut className="h-5 w-5 shrink-0 opacity-60" />
              {!collapsed && <span className="font-body text-base opacity-80">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
