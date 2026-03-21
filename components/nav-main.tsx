'use client';

import { type LucideIcon } from 'lucide-react';

import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: LucideIcon;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
}) {
	const router = useRouter();
	return (
		<SidebarGroup className="p-0 pt-4 w-full">
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton
							tooltip={item.title}
							className={`px-[16px] cursor-pointer py-[16px] gap-3 m-0 rounded-none h-fit text-md hover:bg-transparent hover:text-primary w-full  ${
								item.isActive
									? 'border-l-[4px] border-primary bg-[#f0f6ff] text-[#3C8DFF] hover:bg-[#f0f6ff] hover:text-[#3C8DFF] opacity-100'
									: ''
							}`}
							onClick={() => router.push(item.url)}
						>
							{item.icon && <item.icon />}
							<Link href={item.url}>{item.title}</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
