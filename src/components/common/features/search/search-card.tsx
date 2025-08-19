"use client";
import { useTranslations } from "next-intl";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { useSearch } from "@/components/common/hooks/use-search";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/common/ui/command";
import Loading from "../../display/loading";
import type { search } from "./search";

type Props = { search: typeof search };

export function SearchCard({ search }: Props) {
	const t = useTranslations("label");

	const { searchQuery, searchResults, handleSearchChange, isPending } =
		useSearch({ search });

	const handleInputChange = (value: string) => {
		const event = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
		handleSearchChange(event);
	};

	return (
		<div className="px-2 sm:px-4">
			<Command className="my-4 rounded-lg border">
				<CommandInput
					onValueChange={handleInputChange}
					placeholder={t("search")}
					value={searchQuery}
				/>
				<CommandList>
					{searchResults === undefined ||
					(searchResults?.length === 0 && searchQuery && !isPending) ? (
						<CommandEmpty>
							<StatusCodeView statusCode="204" />
						</CommandEmpty>
					) : isPending ? (
						<div className="p-4">
							<Loading />
						</div>
					) : (
						searchResults?.map((item, index) => (
							<CommandItem key={String(index)}>{item.title}</CommandItem>
						))
					)}
				</CommandList>
			</Command>
		</div>
	);
}
