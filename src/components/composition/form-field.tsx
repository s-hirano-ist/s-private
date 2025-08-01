"use client";
import { forwardRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormFieldProps = {
	label: string;
	htmlFor: string;
	required?: boolean;
	children: ReactNode;
	className?: string;
};

function FormField({
	label,
	htmlFor,
	required = false,
	children,
	className = "space-y-1",
}: FormFieldProps) {
	return (
		<div className={className}>
			<Label htmlFor={htmlFor}>
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</Label>
			{children}
		</div>
	);
}

type InputFieldProps = {
	name: string;
	type?: string;
	placeholder?: string;
	required?: boolean;
	autoComplete?: string;
	inputMode?: "text" | "url" | "email" | "search";
	className?: string;
};

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
	function InputField(
		{
			name,
			type = "text",
			placeholder,
			required = false,
			autoComplete = "off",
			inputMode = "text",
			className,
		},
		ref,
	) {
		return (
			<Input
				autoComplete={autoComplete}
				className={className}
				id={name}
				inputMode={inputMode}
				name={name}
				placeholder={placeholder}
				ref={ref}
				required={required}
				type={type}
			/>
		);
	},
);

type TextareaFieldProps = {
	name: string;
	placeholder?: string;
	required?: boolean;
	rows?: number;
	className?: string;
};

const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
	function TextareaField(
		{ name, placeholder, required = false, rows, className },
		ref,
	) {
		return (
			<Textarea
				autoComplete="off"
				className={className}
				id={name}
				name={name}
				placeholder={placeholder}
				ref={ref}
				required={required}
				rows={rows}
			/>
		);
	},
);

type ActionButtonProps = {
	children: ReactNode;
	disabled?: boolean;
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
	className?: string;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
};

function ActionButton({
	children,
	disabled = false,
	variant = "default",
	size = "default",
	className = "w-full",
	onClick,
	type = "submit",
}: ActionButtonProps) {
	return (
		<Button
			className={className}
			disabled={disabled}
			onClick={onClick}
			size={size}
			type={type}
			variant={variant}
		>
			{children}
		</Button>
	);
}

type InputWithButtonProps = {
	inputProps: InputFieldProps;
	buttonText: ReactNode;
	onButtonClick: () => void;
	inputRef?: React.RefObject<HTMLInputElement | null>;
};

function InputWithButton({
	inputProps,
	buttonText,
	onButtonClick,
	inputRef,
}: InputWithButtonProps) {
	return (
		<div className="flex space-x-2 px-2">
			<InputField {...inputProps} ref={inputRef} />
			<Button onClick={onButtonClick} type="button" variant="ghost">
				{buttonText}
			</Button>
		</div>
	);
}

type InputWithDropdownProps = {
	inputProps: InputFieldProps;
	dropdownTrigger: ReactNode;
	inputRef?: React.RefObject<HTMLInputElement | null>;
};

function InputWithDropdown({
	inputProps,
	dropdownTrigger,
	inputRef,
}: InputWithDropdownProps) {
	return (
		<div className="flex space-x-2 px-2">
			<InputField {...inputProps} ref={inputRef} />
			{dropdownTrigger}
		</div>
	);
}

export {
	FormField,
	InputField,
	TextareaField,
	ActionButton,
	InputWithButton,
	InputWithDropdown,
};
