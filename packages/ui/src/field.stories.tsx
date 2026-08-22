import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field.js";
import { Input } from "./input.js";

const meta = { component: Field } satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Field>
			<FieldLabel htmlFor="email">Email</FieldLabel>
			<Input id="email" type="email" />
			<FieldDescription>Used for account notifications.</FieldDescription>
			<FieldError>Enter a valid email address.</FieldError>
		</Field>
	),
};
