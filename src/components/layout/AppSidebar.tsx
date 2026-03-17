import {
  LayoutDashboard,
  ClipboardCheck,
  MessageSquare,
  Users,
  Shield,
  UserCircle,
  LogOut,
  CreditCard,
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
  { title: 'The Consultant', url: '/consultant', icon: MessageSquare, desc: 'AI mentor' },
  { title: 'Community', url: '/community', icon: Users, desc: 'Brothers & events' },
  { title: 'Membership', url: '/membership', icon: CreditCard, desc: 'Dues & billing' },
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
      {/* Logo Area — generous, centered, prominent */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex flex-col items-center justify-center transition-all duration-300 ${collapsed ? 'py-4 px-2' : 'py-6 px-5'}`}>
          <img
            src={ironForumsLogo}
            alt="Iron Forums"
            className={`brightness-0 invert transition-all duration-300 ${collapsed ? 'h-8 w-8' : 'h-14 w-auto max-w-[180px]'}`}
          />
          {!collapsed && (
            <span className="text-[10px] font-body tracking-[0.2em] uppercase text-sidebar-primary mt-2.5 opacity-80">
              Connect » Sharpen » Grow
            </span>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
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
                      <item.icon className="h-5 w-5 shrink-0 opacity-80" />
                      {!collapsed && (
                        <div className="flex flex-col ml-0.5">
                          <span className="font-body text-[15px] font-semibold leading-tight">{item.title}</span>
                          <span className="font-body text-[11px] text-sidebar-foreground/40 leading-tight">{item.desc}</span>
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
          <SidebarGroup className="mt-6">
            <div className="px-3 mb-1.5">
              {!collapsed && (
                <span className="text-[10px] font-body font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/30">
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
                      className="min-h-[48px]"
                    >
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent/60 transition-all duration-200 rounded-xl px-3 py-2.5"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                      >
                        <item.icon className="h-5 w-5 shrink-0 opacity-80" />
                        {!collapsed && (
                          <div className="flex flex-col ml-0.5">
                            <span className="font-body text-[15px] font-semibold leading-tight">{item.title}</span>
                            <span className="font-body text-[11px] text-sidebar-foreground/40 leading-tight">{item.desc}</span>
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

      {/* Footer — user profile & sign out */}
      <SidebarFooter className="p-2.5 border-t border-sidebar-border space-y-0.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Profile" className="min-h-[48px]">
              <NavLink
                to="/profile"
                className="hover:bg-sidebar-accent/60 transition-all duration-200 rounded-xl px-3 py-2.5"
                activeClassName="bg-sidebar-accent text-sidebar-primary"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                ) : (
                  <UserCircle className="h-5 w-5 shrink-0 opacity-80" />
                )}
                {!collapsed && (
                  <div className="flex flex-col flex-1 ml-0.5">
                    <span className="text-[15px] font-body font-semibold leading-tight truncate">{profile?.full_name || 'My Profile'}</span>
                    <span className="text-[11px] font-body text-sidebar-foreground/40 leading-tight truncate">{profile?.chapter || profile?.company_name || ''}</span>
                  </div>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={logout} className="min-h-[44px] hover:bg-sidebar-accent/60 transition-all duration-200 rounded-xl">
              <LogOut className="h-5 w-5 shrink-0 opacity-60" />
              {!collapsed && <span className="font-body text-[15px] opacity-80">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
