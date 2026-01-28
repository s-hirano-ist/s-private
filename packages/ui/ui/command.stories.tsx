import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Calendar, Settings, Smile, User } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "./command";

const meta = {
	component: Command,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Command>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Command className="max-w-md rounded-lg border shadow-md">
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Suggestions">
					<CommandItem>
						<Calendar className="mr-2" />
						Calendar
					</CommandItem>
					<CommandItem>
						<Smile className="mr-2" />
						Search Emoji
					</CommandItem>
					<CommandItem>
						<Settings className="mr-2" />
						Settings
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	),
};

export const WithGroups: Story = {
	render: () => (
		<Command className="max-w-md rounded-lg border shadow-md">
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Profile">
					<CommandItem>
						<User className="mr-2" />
						Profile
						<CommandShortcut>Ctrl+P</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<Settings className="mr-2" />
						Settings
						<CommandShortcut>Ctrl+S</CommandShortcut>
					</CommandItem>
				</CommandGroup>
				<CommandGroup heading="Actions">
					<CommandItem>
						<Calendar className="mr-2" />
						Calendar
					</CommandItem>
					<CommandItem>
						<Smile className="mr-2" />
						Search Emoji
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	),
};

export const InDialog: Story = {
	render: function InDialogRender() {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Command Palette</Button>
				<CommandDialog onOpenChange={setOpen} open={open}>
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Suggestions">
							<CommandItem>
								<Calendar className="mr-2" />
								Calendar
							</CommandItem>
							<CommandItem>
								<Smile className="mr-2" />
								Search Emoji
							</CommandItem>
							<CommandItem>
								<Settings className="mr-2" />
								Settings
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</CommandDialog>
			</>
		);
	},
};
