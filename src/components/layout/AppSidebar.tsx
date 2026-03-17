import {
  LayoutDashboard,
  ClipboardCheck,
  MessageSquare,
  Users,
  Shield,
  UserCircle,
  LogOut,
  ChevronRight,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Member Snapshot', url: '/snapshot', icon: ClipboardCheck },
  { title: 'The Consultant', url: '/consultant', icon: MessageSquare },
  { title: 'Community', url: '/community', icon: Users },
];

const adminNav = [
  { title: 'Admin', url: '/admin', icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, hasMinRole, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src={ironForumsLogo}
            alt="Iron Forums"
            className="h-9 w-auto brightness-0 invert"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-heading font-bold tracking-tight text-sidebar-foreground">
                IronForums
              </span>
              <span className="text-[10px] font-body tracking-[0.2em] uppercase text-sidebar-primary">
                Connect · Sharpen · Grow
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-[0.15em] font-body font-semibold">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="font-body text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasMinRole('facilitator') && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-[0.15em] font-body font-semibold">
              {!collapsed && 'Management'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span className="font-body text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <NavLink
                to="/profile"
                className="hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-primary"
              >
                <UserCircle className="h-5 w-5" />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-body font-semibold">{user?.name}</span>
                      <span className="text-xs font-body text-sidebar-foreground/50">{user?.chapter}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sidebar-foreground/30" />
                  </div>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={logout}>
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="font-body text-sm">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
