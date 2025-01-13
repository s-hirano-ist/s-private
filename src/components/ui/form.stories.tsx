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
import { fn } from "@storybook/test";
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
	const form = useForm<{ username: string }>();
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
	args: {
		children: <div>Sample Form</div>,
		watch: fn(),
		getValues: fn(),
		setFocus: fn(),
		setError: fn(),
		clearErrors: fn(),
		getFieldState: fn(),
		setValue: fn(),
		trigger: fn(),
		formState: {
			isDirty: false,
			isLoading: false,
			isSubmitted: false,
			isSubmitSuccessful: false,
			isSubmitting: false,
			isValidating: false,
			isValid: false,
			disabled: false,
			submitCount: 1,
			dirtyFields: fn(),
			touchedFields: fn(),
			validatingFields: fn(),
			errors: {},
		},
		resetField: fn(),
		reset: fn(),
		handleSubmit: fn(),
		unregister: fn(),
		// eslint-disable-next-line
		control: fn() as any,
		register: fn(),
	},
	render: () => <SampleForm />,
};
