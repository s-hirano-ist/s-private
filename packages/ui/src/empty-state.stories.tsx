import type { Meta, StoryObj } from "@storybook/react-vite";
import InboxIcon from "lucide-react/dist/esm/icons/inbox.mjs";
import { Button } from "./button.js";
import {
	EmptyState,
	EmptyStateActions,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "./empty-state.js";

const meta = { component: EmptyState } satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<EmptyState>
			<EmptyStateIcon>
				<InboxIcon className="size-8" />
			</EmptyStateIcon>
			<EmptyStateTitle>No content</EmptyStateTitle>
			<EmptyStateDescription>
				Create an item to get started.
			</EmptyStateDescription>
			<EmptyStateActions>
				<Button>Create</Button>
			</EmptyStateActions>
		</EmptyState>
	),
};
