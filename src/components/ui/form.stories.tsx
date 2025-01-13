import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { Input } from "./input";

const meta = {
	title: "Components/UI/Form",
	component: Form,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

const SampleForm = () => {
	const form = useForm();
	return (
		<Form {...form}>
			<FormField
				control={form.control}
				name="username"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Username</FormLabel>
						<FormControl>
							<Input placeholder="shadcn" {...field} />
						</FormControl>
						<FormDescription>This is your public display name.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</Form>
	);
};

export const Default: Story = {
	render: () => <SampleForm />,
};
