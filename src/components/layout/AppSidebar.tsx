import {
  LayoutDashboard,
  ClipboardCheck,
  MessageSquare,
  Users,
  Shield,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, desc: 'Your overview' },
  { title: 'My Snapshot', url: '/snapshot', icon: ClipboardCheck, desc: 'Rate your 30 days' },
  { title: 'The Consultant', url: '/consultant', icon: MessageSquare, desc: 'AI guidance' },
  { title: 'Community', url: '/community', icon: Users, desc: 'Brothers & events' },
];

const adminNav = [
  { title: 'Admin Panel', url: '/admin', icon: Shield, desc: 'Manage everything' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, hasMinRole, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src={ironForumsLogo}
            alt="Iron Forums"
            className="h-10 w-auto brightness-0 invert"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-heading font-bold tracking-tight text-sidebar-foreground">
                Iron Forums
              </span>
              <span className="text-xs font-body tracking-[0.15em] uppercase text-sidebar-primary">
                Connect · Sharpen · Grow
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-3 px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="min-h-[52px]"
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent transition-colors rounded-lg px-3 py-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col">
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

        {hasMinRole('facilitator') && (
          <SidebarGroup className="mt-4">
            <div className="px-3 mb-2">
              {!collapsed && (
                <span className="text-[11px] font-body font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
                  Management
                </span>
              )}
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="min-h-[52px]"
                    >
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent transition-colors rounded-lg px-3 py-3"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {!collapsed && (
                          <div className="flex flex-col">
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
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Profile" className="min-h-[52px]">
              <NavLink
                to="/profile"
                className="hover:bg-sidebar-accent transition-colors rounded-lg px-3 py-3"
                activeClassName="bg-sidebar-accent text-sidebar-primary"
              >
                <UserCircle className="h-6 w-6 shrink-0" />
                {!collapsed && (
                  <div className="flex flex-col flex-1">
                    <span className="text-base font-body font-semibold leading-tight">{user?.name}</span>
                    <span className="text-xs font-body text-sidebar-foreground/50 leading-tight">{user?.chapter}</span>
                  </div>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={logout} className="min-h-[48px]">
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="font-body text-base">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
