"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="gap-2" />}
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{session?.user?.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm text-gray-500">
            {session?.user?.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Se deconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
